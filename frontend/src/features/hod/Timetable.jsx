import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Save, Trash2, Check, BookOpen, Clock, Eraser } from 'lucide-react';

const PERIODS = [
  { id: 1, label: '1', time: '8.45 - 9.30am', type: 'period', start: '08:45', end: '09:30' },
  { id: 2, label: '2', time: '9.30 - 10.20am', type: 'period', start: '09:30', end: '10:20' },
  { id: 'b1', label: 'BREAK', time: '10.20 - 10.35 am', type: 'break' },
  { id: 3, label: '3', time: '10.35 - 11.25am', type: 'period', start: '10:35', end: '11:25' },
  { id: 4, label: '4', time: '11.25 - 12.15pm', type: 'period', start: '11:25', end: '12:15' },
  { id: 'l1', label: 'LUNCH', time: '12.15 - 1.00 PM', type: 'break' },
  { id: 5, label: '5', time: '1.00 - 1.50pm', type: 'period', start: '13:00', end: '13:50' },
  { id: 6, label: '6', time: '1.50 - 2.40pm', type: 'period', start: '13:50', end: '14:40' },
  { id: 'b2', label: 'BREAK', time: '2.40 - 2.50 PM', type: 'break' },
  { id: 7, label: '7', time: '2.50 - 3.40pm', type: 'period', start: '14:50', end: '15:40' },
  { id: 8, label: '8', time: '3.40 - 4.30pm', type: 'period', start: '15:40', end: '16:30' }
];

const DAYS = [
  { id: 'mon', label: 'MON' },
  { id: 'tue', label: 'TUE' },
  { id: 'wed', label: 'WED' },
  { id: 'thu', label: 'THU' },
  { id: 'fri', label: 'FRI' }
];

const emptyGrid = () => {
  const g = {};
  DAYS.forEach(d => {
    g[d.id] = {};
    PERIODS.filter(p => p.type === 'period').forEach(p => {
      g[d.id][p.id] = null;
    });
  });
  return g;
};

export function Timetable() {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [grid, setGrid] = useState(emptyGrid());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const secRes = await axios.get('/api/hod/sections');
        setSections(secRes.data);
        if (secRes.data.length > 0) {
          setSelectedSection(secRes.data[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to load sections", err);
      }
    };
    fetchSections();
  }, []);

  useEffect(() => {
    if (!selectedSection) return;
    
    const fetchTimetableData = async () => {
      setLoading(true);
      try {
        // Fetch assignments for this section
        const assignRes = await axios.get(`/api/hod/assignments?section_id=${selectedSection}`);
        setAssignments(assignRes.data);
        
        // Fetch existing timetable
        const timeRes = await axios.get(`/api/hod/timetable?section_id=${selectedSection}`);
        const newGrid = emptyGrid();
        
        timeRes.data.forEach(slot => {
          // Find matching period based on start_time
          const period = PERIODS.find(p => p.start === slot.start_time);
          if (period && newGrid[slot.day]) {
            const assignment = assignRes.data.find(a => a.id === slot.course_assignment_id);
            if (assignment) {
              newGrid[slot.day][period.id] = assignment;
            }
          }
        });
        
        setGrid(newGrid);
      } catch (err) {
        console.error("Failed to load timetable", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetableData();
  }, [selectedSection]);

  const handleDragStart = (e, assignmentId) => {
    e.dataTransfer.setData("assignmentId", assignmentId);
  };

  const handleDrop = (e, dayId, periodId) => {
    e.preventDefault();
    const assignmentId = e.dataTransfer.getData("assignmentId");
    if (!assignmentId) return;

    const assignment = assignments.find(a => a.id.toString() === assignmentId);
    if (assignment) {
      setGrid(prev => ({
        ...prev,
        [dayId]: {
          ...prev[dayId],
          [periodId]: assignment
        }
      }));
      setSaved(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const clearSlot = (dayId, periodId) => {
    setGrid(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [periodId]: null
      }
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const slots = [];
      DAYS.forEach(day => {
        PERIODS.filter(p => p.type === 'period').forEach(period => {
          const assignment = grid[day.id][period.id];
          if (assignment) {
            slots.push({
              course_assignment_id: assignment.id,
              day: day.id,
              start_time: period.start,
              end_time: period.end,
              room: '' // Room can be added later if needed
            });
          }
        });
      });
      
      await axios.post('/api/hod/timetable/bulk', {
        section_id: parseInt(selectedSection),
        slots
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save timetable", err);
      alert("Failed to save timetable");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Timetable Builder</h1>
            <p className="text-slate-500 text-sm">Drag and drop courses to schedule</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-sm px-4 py-2"
          >
            {sections.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} (Year {s.year})
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to erase the entire timetable for this section? You will need to click Save to apply changes.")) {
                setGrid(emptyGrid());
                setSaved(false);
              }
            }}
            disabled={saving || !selectedSection}
            className="flex items-center px-4 py-2 rounded-xl text-red-600 bg-red-50 font-medium hover:bg-red-100 transition-all shadow-sm"
          >
            <Eraser className="w-5 h-5 mr-2" />
            Erase All
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || !selectedSection}
            className={`flex items-center px-4 py-2 rounded-xl text-white font-medium shadow-sm transition-all ${
              saved 
                ? 'bg-emerald-500 hover:bg-emerald-600' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
            ) : saved ? (
              <Check className="w-5 h-5 mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {saved ? 'Saved Successfully' : 'Save Timetable'}
          </button>
        </div>
      </div>

      {selectedSection ? (
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Sidebar - Available Courses */}
          <div className="w-72 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden shrink-0">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-indigo-500" />
                Available Courses
              </h3>
              <p className="text-xs text-slate-500 mt-1">Drag courses onto the grid</p>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
              {loading ? (
                <div className="text-center text-slate-400 text-sm py-4">Loading courses...</div>
              ) : assignments.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-4 border-2 border-dashed border-slate-200 rounded-xl">
                  No courses assigned to this section yet.
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, assignment.id.toString())}
                    className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md transition-all group"
                  >
                    <div className="font-semibold text-slate-800 text-sm">
                      {assignment.course?.name || "Course"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 mr-2"></div>
                      {assignment.faculty?.first_name} {assignment.faculty?.last_name}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Main Grid */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Header Row */}
              <div className="flex bg-slate-50 border-b border-slate-200 rounded-t-2xl">
                <div className="w-20 shrink-0 border-r border-slate-200 p-3 flex flex-col justify-center items-center font-bold text-slate-500 text-xs">
                  DAY / TIME
                </div>
                {PERIODS.map(period => (
                  <div 
                    key={period.id} 
                    className={`flex flex-col justify-center items-center p-2 text-xs border-r border-slate-200 shrink-0 ${
                      period.type === 'break' ? 'w-16 bg-slate-100 text-slate-400 font-medium' : 'w-[120px] bg-white font-bold text-slate-600'
                    }`}
                  >
                    {period.type === 'period' ? (
                      <>
                        <span className="text-indigo-600 mb-1">Period {period.label}</span>
                        <span className="font-normal text-[10px] text-slate-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {period.time}
                        </span>
                      </>
                    ) : (
                      <div className="[writing-mode:vertical-rl] tracking-widest uppercase">
                        {period.label}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Body Rows */}
              {DAYS.map(day => (
                <div key={day.id} className="flex border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                  <div className="w-20 shrink-0 border-r border-slate-200 bg-slate-50 p-3 flex items-center justify-center font-bold text-slate-600">
                    {day.label}
                  </div>
                  
                  {PERIODS.map(period => {
                    if (period.type === 'break') {
                      return (
                        <div key={`${day.id}-${period.id}`} className="w-16 shrink-0 border-r border-slate-200 bg-slate-100/50">
                          {/* Empty break cell */}
                        </div>
                      );
                    }

                    const assignment = grid[day.id]?.[period.id];
                    
                    return (
                      <div 
                        key={`${day.id}-${period.id}`}
                        onDrop={(e) => handleDrop(e, day.id, period.id)}
                        onDragOver={handleDragOver}
                        className={`w-[120px] shrink-0 border-r border-slate-200 p-2 relative group transition-colors ${
                          assignment ? 'bg-indigo-50/50' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        {assignment ? (
                          <div className="h-full bg-white border border-indigo-200 rounded-lg p-2 shadow-sm relative group-hover:border-indigo-400 group-hover:shadow-md transition-all cursor-pointer">
                            <div className="font-bold text-indigo-700 text-xs truncate" title={assignment.course?.name}>
                              {assignment.course?.code}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 truncate">
                              {assignment.faculty?.first_name} {assignment.faculty?.last_name}
                            </div>
                            <button 
                              onClick={() => clearSlot(day.id, period.id)}
                              className="absolute -top-2 -right-2 bg-rose-100 text-rose-600 rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="h-full border-2 border-dashed border-transparent group-hover:border-slate-300 rounded-lg flex items-center justify-center transition-colors">
                            <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100">Drop here</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400">
          <Calendar className="w-16 h-16 mb-4 text-slate-200" />
          <h2 className="text-xl font-bold text-slate-600 mb-2">No Section Selected</h2>
          <p>Please select a section from the dropdown above to manage its timetable.</p>
        </div>
      )}
    </div>
  );
}
