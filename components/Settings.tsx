
import React, { useState, useRef, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Trash2, Plus, FileText, Sparkles, Loader2, FileUp, Check, X, Upload, AlertCircle, ArrowRight, Pencil, Clock, Key, ExternalLink } from 'lucide-react';
import { EntityProfile, TimeSlot } from '../types';

type SettingsTab = 'general' | 'timetable' | 'teachers' | 'classes' | 'students' | 'import';

// The global aistudio is already defined by the environment as AIStudio.
// We remove the manual declaration to avoid "identical modifiers" and type mismatch errors.

export const Settings: React.FC = () => {
  const { 
    schoolName, updateSchoolName, 
    academicYear, updateAcademicYear,
    entities, addEntity, deleteEntity, updateEntity,
    students, addStudent, deleteStudent,
    timeSlots, updateTimeSlots,
    resetData,
    aiImportStatus, aiImportResult, aiImportErrorMessage, startAiImport, cancelAiImport, finalizeAiImport
  } = useData();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [bulkStudentInput, setBulkStudentInput] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [aiTimetableInput, setAiTimetableInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [isAddingEntity, setIsAddingEntity] = useState<'TEACHER' | 'CLASS' | null>(null);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityCode, setNewEntityCode] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [localTimeSlots, setLocalTimeSlots] = useState<TimeSlot[]>([]);
  const [isEditingSlots, setIsEditingSlots] = useState(false);
  
  const classes = useMemo(() => entities.filter(e => e.type === 'CLASS'), [entities]);

  // Handler for API Key selection using the global aistudio object
  const handleApiKeySelection = async () => {
    try {
      await window.aistudio.openSelectKey();
    } catch (e) {
      console.error("Key selection failed", e);
    }
  };

  const handleAddEntity = (type: 'TEACHER' | 'CLASS') => {
    if (!newEntityName.trim()) return;
    let finalCode = newEntityCode.trim().toUpperCase() || newEntityName.trim().substring(0, 3).toUpperCase();
    addEntity({
      id: `${type.toLowerCase()}-${Date.now()}`,
      name: newEntityName.trim(),
      shortCode: finalCode,
      type,
      schedule: {} as any
    });
    setNewEntityName('');
    setNewEntityCode('');
    setIsAddingEntity(null);
  };

  const startEditing = (entity: EntityProfile) => {
    setEditingId(entity.id);
    setEditName(entity.name);
    setEditCode(entity.shortCode || '');
    setConfirmDeleteId(null);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
        updateEntity(editingId, { name: editName.trim(), shortCode: editCode.trim().toUpperCase() });
        setEditingId(null);
    }
  };

  const renderEntityList = (type: 'TEACHER' | 'CLASS') => {
    const items = entities.filter(e => e.type === type);
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">{type === 'CLASS' ? 'Class Registry' : 'Teacher Registry'}</h3>
          {isAddingEntity !== type ? (
            <button 
              onClick={() => setIsAddingEntity(type)} 
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-2" /> Add {type === 'CLASS' ? 'Class' : 'Teacher'}
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                autoFocus
                placeholder="Name"
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
                className="px-3 py-2 border border-blue-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-blue-100 outline-none"
              />
               <input
                placeholder="Code"
                value={newEntityCode}
                onChange={(e) => setNewEntityCode(e.target.value)}
                className="px-3 py-2 border border-blue-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-blue-100 outline-none w-full sm:w-20"
              />
              <div className="flex gap-1">
                <button onClick={() => handleAddEntity(type)} className="flex-1 sm:flex-none p-2 bg-green-500 text-white rounded-xl hover:bg-green-600"><Check className="w-4 h-4" /></button>
                <button onClick={() => setIsAddingEntity(null)} className="flex-1 sm:flex-none p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
        <div className="divide-y divide-slate-100">
          {items.map(item => (
            <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/50 transition-colors gap-4">
              {editingId === item.id ? (
                  <div className="flex flex-col sm:flex-row gap-3 flex-1">
                      <input 
                        value={editName} onChange={e => setEditName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-blue-300 rounded-xl text-sm font-bold bg-white focus:ring-4 focus:ring-blue-50 outline-none"
                      />
                      <input 
                        value={editCode} onChange={e => setEditCode(e.target.value)}
                        className="sm:w-24 px-4 py-2 border border-blue-300 rounded-xl text-sm font-black uppercase text-center bg-white focus:ring-4 focus:ring-blue-50 outline-none"
                      />
                      <div className="flex gap-2">
                          <button onClick={saveEdit} className="flex-1 sm:flex-none p-2.5 bg-green-500 text-white rounded-xl shadow-sm"><Check className="w-5 h-5" /></button>
                          <button onClick={() => setEditingId(null)} className="flex-1 sm:flex-none p-2.5 bg-slate-200 text-slate-600 rounded-xl"><X className="w-5 h-5" /></button>
                      </div>
                  </div>
              ) : (
                  <>
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shrink-0">
                            {item.shortCode || '?'}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.shortCode} Profile</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 justify-end">
                        {confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-2 bg-rose-50 p-1.5 rounded-xl border border-rose-100 animate-in fade-in slide-in-from-right-2">
                                <span className="text-[9px] font-black text-rose-500 px-2">SURE?</span>
                                <button onClick={() => deleteEntity(item.id)} className="p-2 bg-rose-500 text-white rounded-lg shadow-sm"><Check className="w-3 h-3" /></button>
                                <button onClick={() => setConfirmDeleteId(null)} className="p-2 bg-white text-slate-400 rounded-lg border border-slate-200"><X className="w-3 h-3" /></button>
                            </div>
                        ) : (
                            <>
                                <button onClick={() => startEditing(item)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => setConfirmDeleteId(item.id)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                            </>
                        )}
                    </div>
                  </>
              )}
            </div>
          ))}
          {items.length === 0 && <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No profiles found</div>}
        </div>
      </div>
    );
  };

  if (aiImportStatus === 'REVIEW' && aiImportResult) {
    const isTeacherWise = aiImportResult.detectedType === 'TEACHER_WISE';
    return (
      <div className="max-w-4xl mx-auto pb-10 px-2 sm:px-0 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
              <div className="bg-slate-900 p-6 sm:p-8 text-white">
                  <h2 className="text-xl font-black flex items-center uppercase tracking-widest">
                      <Sparkles className="w-5 h-5 mr-3 text-blue-400" /> AI Import Review
                  </h2>
                  <p className="text-slate-400 text-xs mt-2 font-bold">
                      Extracted <b>{aiImportResult.profiles.length}</b> {isTeacherWise ? 'Teacher' : 'Class'} schedules.
                  </p>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {aiImportResult.unknownCodes.map(code => (
                          <div key={code} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Found Code: {code}</span>
                              <input 
                                  type="text"
                                  placeholder={isTeacherWise ? "Assign to Class..." : "Assign to Teacher..."}
                                  value={mappings[code] || ''}
                                  onChange={(e) => setMappings(prev => ({ ...prev, [code]: e.target.value }))}
                                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                              />
                          </div>
                      ))}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
                      <button onClick={cancelAiImport} className="px-6 py-3 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-xl">Cancel</button>
                      <button onClick={() => finalizeAiImport(mappings)} className="px-8 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">Connect Data</button>
                  </div>
              </div>
          </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Scrollable Tabs */}
      <div className="flex gap-1 mb-6 bg-white p-1.5 rounded-2xl border border-slate-200 w-fit max-w-full overflow-x-auto scrollbar-hide shadow-sm mx-auto">
        {(['general', 'timetable', 'teachers', 'classes', 'students', 'import'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">School Name</label>
              <input type="text" value={schoolName} onChange={e => updateSchoolName(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year</label>
              <input type="text" value={academicYear} onChange={e => updateAcademicYear(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
                {confirmDeleteId === 'FULL_RESET' ? (
                    <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 flex flex-col sm:flex-row items-center gap-4 animate-in zoom-in-95">
                        <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
                        <span className="text-xs font-black text-rose-700 uppercase tracking-wide text-center sm:text-left">Delete all data permanently?</span>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => { resetData(); setConfirmDeleteId(null); }} className="flex-1 sm:flex-none px-6 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">WIPE</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 sm:flex-none px-6 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setConfirmDeleteId('FULL_RESET')} className="px-5 py-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-rose-100 transition-colors">
                      <Trash2 className="w-4 h-4 mr-2" /> Reset System
                    </button>
                )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timetable' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-slate-50/50">
                 <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Period Configuration</h3>
                 {!isEditingSlots ? (
                    <button onClick={() => { setLocalTimeSlots(JSON.parse(JSON.stringify(timeSlots))); setIsEditingSlots(true); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 shadow-sm">Customize</button>
                 ) : (
                    <div className="flex gap-2">
                         <button onClick={() => setIsEditingSlots(false)} className="px-4 py-2 text-slate-400 font-black text-[10px] uppercase">Cancel</button>
                         <button onClick={() => { updateTimeSlots(localTimeSlots); setIsEditingSlots(false); }} className="px-6 py-2 bg-blue-600 text-white font-black text-[10px] uppercase rounded-xl shadow-md">Save</button>
                    </div>
                 )}
             </div>
             <div className="p-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     {(isEditingSlots ? localTimeSlots : timeSlots).map((slot, idx) => (
                         <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2">
                             <span className="text-[10px] font-black text-slate-300 uppercase">Period {slot.period}</span>
                             {isEditingSlots ? (
                                 <input value={slot.timeRange} onChange={(e) => { const upd = [...localTimeSlots]; upd[idx].timeRange = e.target.value; setLocalTimeSlots(upd); }} className="w-full p-2 border-2 border-blue-100 rounded-xl text-sm font-black text-slate-800 bg-white" />
                             ) : (
                                 <span className="text-lg font-black text-slate-800">{slot.timeRange}</span>
                             )}
                         </div>
                     ))}
                 </div>
             </div>
        </div>
      )}

      {activeTab === 'teachers' && renderEntityList('TEACHER')}
      {activeTab === 'classes' && renderEntityList('CLASS')}

      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6 flex items-center"><FileText className="w-4 h-4 mr-2 text-blue-500" /> Student Onboarding</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Class</label>
                <select value={targetClassId} onChange={e => setTargetClassId(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold bg-white focus:ring-4 focus:ring-blue-50 outline-none">
                  <option value="">-- Choose Class --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <textarea value={bulkStudentInput} onChange={e => setBulkStudentInput(e.target.value)} placeholder="1001, John Doe&#10;1002, Jane Smith" className="w-full h-40 p-4 border border-slate-200 rounded-2xl text-sm font-mono focus:ring-4 focus:ring-blue-50 outline-none mb-6" />
            <button onClick={() => {
                if(!targetClassId) return;
                const lines = bulkStudentInput.split('\n');
                lines.forEach((line, i) => {
                    const parts = line.split(',').map(p => p.trim());
                    if(parts.length >= 2) addStudent({ id: `stu-${Date.now()}-${i}`, rollNumber: parts[0], name: parts[1], classId: targetClassId });
                });
                setBulkStudentInput('');
            }} disabled={!bulkStudentInput.trim() || !targetClassId} className="w-full sm:w-auto px-10 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50">Bulk Import</button>
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden text-center">
          {aiImportStatus === 'PROCESSING' && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-10 flex flex-col items-center justify-center animate-in fade-in">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Analyzing Documents</h3>
              </div>
          )}
          
          <div className="max-w-xl mx-auto space-y-8">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center justify-center"><Sparkles className="w-6 h-6 mr-3 text-blue-500" /> AI Document Scanner</h3>
            
            {aiImportStatus === 'ERROR' && aiImportErrorMessage && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex flex-col items-center gap-3 animate-in shake">
                    <div className="flex items-center gap-2 text-rose-600 font-black text-[10px] uppercase tracking-widest">
                        <AlertCircle className="w-4 h-4" /> {aiImportErrorMessage}
                    </div>
                    {(aiImportErrorMessage.includes("Quota") || aiImportErrorMessage.includes("API key")) && (
                        <div className="flex flex-col gap-2 w-full">
                            <button 
                                onClick={handleApiKeySelection}
                                className="w-full flex items-center justify-center px-4 py-2 bg-white border border-rose-200 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors shadow-sm"
                            >
                                <Key className="w-3.5 h-3.5 mr-2" /> Select Paid API Key
                            </button>
                            <a 
                                href="https://ai.google.dev/gemini-api/docs/billing" 
                                target="_blank" 
                                className="text-[9px] text-slate-400 hover:text-blue-500 flex items-center justify-center gap-1 font-bold"
                            >
                                Learn about billing <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                        </div>
                    )}
                </div>
            )}

            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 bg-slate-50/50 hover:bg-slate-100/50 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
              <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform"><FileUp className="w-8 h-8 text-blue-500" /></div>
              <h4 className="font-black text-slate-700 uppercase tracking-widest text-[10px] mb-4">Drop PDF or Image here</h4>
              <input type="file" ref={fileInputRef} onChange={async (e) => { const f = e.target.files?.[0]; if(f) await startAiImport(f); }} accept=".pdf,image/*" className="hidden" />
              <div className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg inline-block">Pick File</div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-100"></div>
                <span className="text-[10px] font-black text-slate-300">OR PASTE</span>
                <div className="flex-1 h-px bg-slate-100"></div>
            </div>
            
            <textarea value={aiTimetableInput} onChange={e => setAiTimetableInput(e.target.value)} placeholder="Paste plain text content here..." className="w-full h-40 p-4 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-50" />
            <button onClick={() => startAiImport(undefined, aiTimetableInput)} disabled={!aiTimetableInput.trim()} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50">Process Content</button>
          </div>
        </div>
      )}
    </div>
  );
};
