import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TimetableGrid } from './components/TimetableGrid';
import { AttendanceModal } from './components/AttendanceModal';
import { ScheduleEditorModal } from './components/ScheduleEditorModal';
import { Assistant } from './components/Assistant';
import { Settings } from './components/Settings';
import { AttendanceReport } from './components/AttendanceReport';
import { DashboardHome } from './components/DashboardHome';
import { PasswordModal } from './components/PasswordModal';
import { Menu, Search, Filter, Pencil, Eye, LayoutGrid, ChevronDown } from 'lucide-react';
import { TimetableEntry } from './types';
import { DataProvider, useData } from './contexts/DataContext';

const DashboardLayout: React.FC = () => {
  const { entities, updateSchedule, academicYear } = useData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  useEffect(() => {
    if ((activeTab === 'classes' || activeTab === 'teachers') && entities.length > 0) {
        const type = activeTab === 'classes' ? 'CLASS' : 'TEACHER';
        const filtered = entities.filter(e => e.type === type);
        const currentSelectionValid = filtered.find(e => e.id === selectedEntityId);
        if (!currentSelectionValid && filtered.length > 0) {
            setSelectedEntityId(filtered[0].id);
        }
    }
  }, [activeTab, entities, selectedEntityId]);

  const [attendanceModal, setAttendanceModal] = useState<{
    isOpen: boolean; day: string; period: number; entry: TimetableEntry | null;
  }>({ isOpen: false, day: '', period: 0, entry: null });

  const [editorModal, setEditorModal] = useState<{
    isOpen: boolean; day: string; period: number; entry: TimetableEntry | null;
  }>({ isOpen: false, day: '', period: 0, entry: null });

  const handleSlotClick = (day: string, period: number, entry: TimetableEntry | null) => {
    if (isEditMode) {
        setEditorModal({ isOpen: true, day, period, entry });
    } else if (entry) {
        setAttendanceModal({ isOpen: true, day, period, entry });
    }
  };

  const handleScheduleSave = (entry: TimetableEntry | null) => {
    if (selectedEntityId) {
        updateSchedule(selectedEntityId, editorModal.day, editorModal.period, entry);
    }
  };

  const selectedEntity = entities.find(d => d.id === selectedEntityId);
  const listData = entities.filter(d => 
    (activeTab === 'classes' ? d.type === 'CLASS' : d.type === 'TEACHER') &&
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPageTitle = () => {
      switch (activeTab) {
          case 'dashboard': return 'Live';
          case 'assistant': return 'Assistant';
          case 'settings': return 'Settings';
          case 'attendance': return 'Reports';
          default: return activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden text-gray-900 font-sans">
      <PasswordModal 
        isOpen={isPasswordOpen} 
        onClose={() => setIsPasswordOpen(false)} 
        onSuccess={() => setIsEditMode(true)}
        title="Admin Mode"
      />

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Responsive Navbar */}
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-40 shrink-0 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 -ml-1 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="flex flex-col">
                <h1 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-wider">
                  {getPageTitle()}
                </h1>
                {selectedEntity && (activeTab === 'classes' || activeTab === 'teachers') && (
                    <span className="text-[10px] font-bold text-blue-600 sm:hidden">
                        Viewing: {selectedEntity.name}
                    </span>
                )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="hidden sm:flex items-center text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-200">
                AY {academicYear}
             </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-hidden p-3 sm:p-4 lg:p-6 flex flex-col">
          {activeTab === 'dashboard' ? (
              <DashboardHome />
          ) : activeTab === 'assistant' ? (
            <Assistant />
          ) : activeTab === 'settings' ? (
            <div className="h-full overflow-y-auto scrollbar-hide">
                <Settings />
            </div>
          ) : activeTab === 'attendance' ? (
             <AttendanceReport />
          ) : (
            <div className="flex flex-col h-full gap-4 sm:gap-6 min-w-0">
              
              {/* Adaptive Controls Bar */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shrink-0 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        className="block w-full pl-9 pr-3 py-2 border-none rounded-xl text-sm bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none font-medium"
                        placeholder={`Search ${activeTab}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide md:max-w-[60%]">
                   {listData.length > 0 ? listData.map(item => (
                       <button
                         key={item.id}
                         onClick={() => setSelectedEntityId(item.id)}
                         className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                             selectedEntityId === item.id 
                             ? 'bg-slate-900 text-white shadow-md' 
                             : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                         }`}
                       >
                           {item.name}
                       </button>
                   )) : (
                       <div className="text-[10px] text-slate-400 py-2 uppercase font-black">Empty Registry</div>
                   )}
                </div>
              </div>

              {/* Responsive Timetable Area */}
              {selectedEntity ? (
                  <div className="flex-1 flex flex-col rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden min-h-0">
                      <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                        <div className="hidden sm:flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{selectedEntity.name} Schedule</span>
                        </div>
                        <button 
                            onClick={() => isEditMode ? setIsEditMode(false) : setIsPasswordOpen(true)}
                            className={`flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                isEditMode 
                                ? 'bg-orange-500 text-white shadow-sm' 
                                : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {isEditMode ? <><Pencil className="w-3 h-3 mr-2" /> Editing</> : <><Eye className="w-3 h-3 mr-2" /> View Only</>}
                        </button>
                      </div>
                      
                      <div className="flex-1 overflow-hidden">
                        <TimetableGrid 
                            data={selectedEntity} 
                            onSlotClick={handleSlotClick} 
                            isEditing={isEditMode}
                        />
                      </div>
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <Filter className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold text-sm">Select a profile to view timetable</p>
                  </div>
              )}
            </div>
          )}
        </main>
      </div>

      {attendanceModal.isOpen && attendanceModal.entry && selectedEntity && (
        <AttendanceModal
          isOpen={attendanceModal.isOpen}
          onClose={() => setAttendanceModal({ ...attendanceModal, isOpen: false })}
          day={attendanceModal.day}
          period={attendanceModal.period}
          entry={attendanceModal.entry}
          entityId={selectedEntity.id}
          classNameOrTeacherName={selectedEntity.name}
        />
      )}

      {editorModal.isOpen && selectedEntity && (
        <ScheduleEditorModal
          isOpen={editorModal.isOpen}
          onClose={() => setEditorModal({ ...editorModal, isOpen: false })}
          onSave={handleScheduleSave}
          day={editorModal.day}
          period={editorModal.period}
          currentEntry={editorModal.entry}
          entityName={selectedEntity.name}
          entityType={selectedEntity.type}
        />
      )}
    </div>
  );
};

const App: React.FC = () => <DataProvider><DashboardLayout /></DataProvider>;
export default App;