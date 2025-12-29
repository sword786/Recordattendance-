
import { GoogleGenAI } from "@google/genai";
import { EntityProfile, TimeSlot, AiImportResult } from '../types';

const TIMETABLE_SYSTEM_INSTRUCTION = `
    You are an expert OCR and Timetable Extraction Engine. 
    Your goal is to parse complex, potentially messy school timetable documents (PDFs, Images, or Text) into structured JSON.

    EXTRACTION STRATEGY:
    1. Look for headers representing Classes (e.g., "10A", "Grade 7") or Teachers (e.g., "Mr. Smith", "J. Doe").
    2. Group data by these headers. Each group is a "profile".
    3. For each profile, extract the weekly schedule (Days: Mon, Tue, Wed, Thu, Fri, Sat, Sun).
    4. Map periods (1, 2, 3...) to their respective slots.
    5. DETERMINATION: 
       - If the main profiles are Classes, detectedType is "CLASS_WISE".
       - If the main profiles are Teachers, detectedType is "TEACHER_WISE".

    DATA MAPPING:
    - In "CLASS_WISE": "code" inside a slot is the Teacher.
    - In "TEACHER_WISE": "code" inside a slot is the Class.
    - Always extract "subject" and "room" (if available).

    CRITICAL: 
    - Output ONLY valid JSON.
    - If a profile is partially visible, extract what you can. 
    - Do not skip profiles.

    RETURN STRUCTURE:
    {
      "detectedType": "TEACHER_WISE" | "CLASS_WISE",
      "profiles": [
        {
          "name": "Full Profile Name",
          "schedule": {
            "Mon": { "1": { "subject": "MATH", "room": "S1", "code": "JD" }, ... },
            ...
          }
        }
      ],
      "unknownCodes": ["JD", "SMT", "10A"]
    }
`;

/**
 * Parses raw text or file using Gemini 3 Pro.
 * Uses thinkingBudget for complex layout reasoning.
 */
export const processTimetableImport = async (input: { text?: string, base64?: string, mimeType?: string }): Promise<AiImportResult | null> => {
  // Creating a new instance right before call ensures we use the latest injected API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  try {
    let contentParts: any[] = [];
    
    if (input.base64 && input.mimeType) {
        contentParts.push({ 
          inlineData: { 
            data: input.base64, 
            mimeType: input.mimeType 
          } 
        });
        contentParts.push({ text: "Please analyze this document carefully. Extract every single timetable profile you find. Do not leave any profiles out. Use the provided JSON schema." });
    } else if (input.text) {
        contentParts.push({ text: input.text });
    } else {
        return null;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: { parts: contentParts },
      config: {
        systemInstruction: TIMETABLE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        // Pro model allows thinking for complex layouts
        thinkingConfig: { thinkingBudget: 2048 },
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty response from AI.");

    const data = JSON.parse(responseText);

    if (!data.profiles || data.profiles.length === 0) {
        return {
            detectedType: data.detectedType || 'CLASS_WISE',
            profiles: [],
            unknownCodes: [],
            rawTextResponse: responseText
        };
    }

    const processedProfiles = data.profiles.map((p: any) => ({
        ...p,
        schedule: mapScheduleCodes(p.schedule)
    }));

    return {
        detectedType: data.detectedType || 'CLASS_WISE',
        profiles: processedProfiles,
        unknownCodes: data.unknownCodes || [],
        rawTextResponse: responseText
    };

  } catch (error: any) {
    console.error("Gemini Pro Extraction Error:", error);
    throw error;
  }
};

const mapScheduleCodes = (rawSchedule: any) => {
    const newSchedule: any = {};
    if (!rawSchedule) return {};

    // Normalize day names to handle variations (Monday vs Mon)
    const dayMap: Record<string, string> = {
        'monday': 'Mon', 'mon': 'Mon',
        'tuesday': 'Tue', 'tue': 'Tue',
        'wednesday': 'Wed', 'wed': 'Wed',
        'thursday': 'Thu', 'thu': 'Thu',
        'friday': 'Fri', 'fri': 'Fri',
        'saturday': 'Sat', 'sat': 'Sat',
        'sunday': 'Sun', 'sun': 'Sun'
    };

    Object.keys(rawSchedule).forEach(rawDayKey => {
        const normalizedDay = dayMap[rawDayKey.toLowerCase()];
        if (normalizedDay) {
            newSchedule[normalizedDay] = {};
            const periods = rawSchedule[rawDayKey];
            if (periods) {
                Object.keys(periods).forEach(periodNum => {
                    const slot = periods[periodNum];
                    if (slot && slot.subject) {
                        newSchedule[normalizedDay][periodNum] = {
                            subject: slot.subject.toUpperCase(),
                            room: slot.room || '',
                            teacherOrClass: slot.code || ''
                        };
                    }
                });
            }
        }
    });
    return newSchedule;
};

/**
 * Assistant logic using Gemini 3 Pro.
 */
export const generateAiResponse = async (userPrompt: string, dataContext: any): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const systemInstruction = `
    You are the ${dataContext.schoolName} Admin Assistant. 
    Use the following school data to answer user queries accurately.
    Today: ${new Date().toDateString()}.
    Data Context: ${JSON.stringify(dataContext.entities.map(e => ({ name: e.name, code: e.shortCode })))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });
    return response.text || "No response generated.";
  } catch (error) {
    return "The assistant encountered a rate limit or processing error. Please try again.";
  }
};
