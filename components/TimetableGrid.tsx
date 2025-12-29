import React from 'react';
import { DAYS } from '../constants';
import { useData } from '../contexts/DataContext';
import { EntityProfile, TimetableEntry } from '../types';
import { MapPin, Plus } from 'lucide-react';

interface TimetableGridProps {
  data: EntityProfile;
  onSlotClick: (day: string, period: number, entry: TimetableEntry | null) => void;
  isEditing?: boolean;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({ data, onSlotClick, isEditing = false }) => {
  const { timeSlots, entities } = useData();
  const isTeacher = data.type === 'TEACHER';

  // Find full name from code
  const resolveNameFromCode = (code: string | undefined): string | undefined => {
      if (!code) return undefined;
      const matched = entities.find(e => e.shortCode === code || e.name === code);
      return matched ? matched.name : code;
  };

  return (
    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm select-none">
      <div className="min-w-[1000px]">
        {/* Header Row */}
        <div className="grid grid-cols-[100px_repeat(9,1fr)] border-b border-slate-200 bg-slate-50/50">
          <div className="p-4 flex items-center justify-center border-r border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Day / Per</span>
          </div>
          {timeSlots.map((slot) => (
            <div key={slot.period} className="p-3 border-r border-slate-200 last:border-r-0 flex flex-col items-center justify-center text-center relative group">
              <span className="text-2xl font-black text-slate-600 leading-none mb-1 group-hover:text-blue-600 transition-colors">{slot.period}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{slot.timeRange}</span>
            </div>
          ))}
        </div>

        {/* Data Rows */}
        {DAYS.map((day) => (
          <div key={day} className="grid grid-cols-[100px_repeat(9,1fr)] border-b border-slate-100 last:border-b-0 hover:bg-slate-50/30 transition-colors">
            {/* Day Column */}
            <div className="p-4 border-r border-slate-200 bg-white flex items-center justify-center">
              <span className="text-xl font-bold text-slate-500 uppercase tracking-tight">{day}</span>
            </div>

            {/* Period Columns */}
            {timeSlots.map((slot) => {
              const entry = data.schedule && data.schedule[day] ? data.schedule[day][slot.period] : null;
              const isClickable = isEditing || entry;

              const mainText = isTeacher 
                ? entry?.teacherOrClass 
                : entry?.subject;

              const subText = isTeacher 
                ? entry?.subject 
                : entry?.teacherOrClass;

              const room = entry?.room;
              
              const tooltipName = resolveNameFromCode(entry?.teacherOrClass);
              const tooltipTitle = entry ? `${tooltipName || ''} - ${entry.subject}` : '';

              return (
                <div 
                  key={`${day}-${slot.period}`}
                  title={tooltipTitle}
                  className={`border-r border-slate-100 last:border-r-0 relative min-h-[110px] flex flex-col transition-all group ${
                    isClickable 
                      ? 'cursor-pointer hover:bg-blue-50/40' 
                      : ''
                  } ${isEditing ? 'hover:ring-2 ring-inset ring-blue-200 bg-blue-50/5' : ''}`}
                  onClick={() => isClickable && onSlotClick(day, slot.period, entry || null)}
                >
                  {entry ? (
                    <div className="flex-1 w-full h-full p-3 flex flex-col relative z-10">
                        
                        {/* Layout for TEACHER View */}
                        {isTeacher && (
                          <>
                            <div className="absolute top-2 left-3">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                                 {subText || '-'}
                               </span>
                            </div>
                            {room && (
                                 <div className="absolute top-2 right-3 flex items-center text-[9px] text-slate-300 font-bold uppercase">
                                    <MapPin className="w-2.5 h-2.5 mr-0.5" />
                                    {room}
                                 </div>
                            )}
                          </>
                        )}

                        {/* Layout for CLASS View */}
                        {!isTeacher && (
                          <>
                            <div className="absolute bottom-2 right-3">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                                 {subText || '-'}
                               </span>
                            </div>
                            {room && (
                                <div className="absolute bottom-2 left-3 flex items-center text-[9px] text-slate-300 font-bold uppercase">
                                   {room}
                                </div>
                            )}
                          </>
                        )}

                        {/* Center Main Text */}
                        <div className="flex-1 flex items-center justify-center text-center px-1">
                             <span className={`font-black text-slate-700 leading-tight transition-transform group-hover:scale-110 ${
                                 (mainText?.length || 0) > 6 ? 'text-base' : 'text-2xl'
                             }`}>
                                 {mainText || <span className="text-slate-200">?</span>}
                             </span>
                        </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {isEditing && (
                          <div className="w-8 h-8 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center group-hover:border-blue-300 group-hover:bg-blue-50 transition-all">
                              <Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-400" />
                          </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};