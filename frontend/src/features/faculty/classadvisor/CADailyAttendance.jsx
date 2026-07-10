import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { CalendarDays, Save, CheckCircle2, AlertCircle, Users, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';

const CustomDatePicker = ({ selectedDate, onChange, maxDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const handlePrev = () => setCurrentMonth(new Date(year, month - 1, 1));
  const handleNext = () => setCurrentMonth(new Date(year, month + 1, 1));
  
  const handleSelect = (day) => {
    const d = new Date(year, month, day);
    const dateString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    if (maxDate && dateString > maxDate) return;
    onChange(dateString);
    setIsOpen(false);
  };
  
  const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
      >
        <CalendarDays className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-700">{selectedDate.split('-').reverse().join('-')}</span>
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-[280px] bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <button onClick={handlePrev} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
              <span className="text-sm font-bold text-gray-900">{monthName}</span>
              <button onClick={handleNext} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-[10px] uppercase font-bold text-gray-400">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const d = new Date(year, month, day);
                const dStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                const isSelected = dStr === selectedDate;
                const isToday = dStr === todayStr;
                const isFuture = maxDate && dStr > maxDate;
                
                return (
                  <button
                    key={day}
                    disabled={isFuture}
                    onClick={() => handleSelect(day)}
                    className={`h-8 w-full rounded-lg text-xs flex items-center justify-center transition-all ${
                      isSelected ? 'bg-primary-600 text-white font-bold shadow-md shadow-primary-500/30' :
                      isFuture ? 'text-gray-300 cursor-not-allowed' :
                      isToday ? 'bg-primary-50 text-primary-700 font-bold hover:bg-primary-100' :
                      'text-gray-700 hover:bg-gray-100 font-medium'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const PERIODS = [
  { id: 1, label: 'Period 1 (8.45 - 9.30am)' },
  { id: 2, label: 'Period 2 (9.30 - 10.20am)' },
  { id: 3, label: 'Period 3 (10.35 - 11.25am)' },
  { id: 4, label: 'Period 4 (11.25 - 12.15pm)' },
  { id: 5, label: 'Period 5 (1.00 - 1.50pm)' },
  { id: 6, label: 'Period 6 (1.50 - 2.40pm)' },
  { id: 7, label: 'Period 7 (2.50 - 3.40pm)' },
  { id: 8, label: 'Period 8 (3.40 - 4.30pm)' }
];

export const CADailyAttendance = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [attendanceLocked, setAttendanceLocked] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get('/api/class-advisor/attendance-settings');
      setAttendanceLocked(res.data.attendance_closed);
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Subject and Lesson Plan integration state
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState("1");
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");

  // Fetch advisor's section subjects on mount
  useEffect(() => {
    axios.get('/api/class-advisor/subjects')
      .then(r => {
        setSubjects(r.data);
        if (r.data.length > 0) {
          setSelectedSubject(r.data[0]);
        }
      })
      .catch(err => console.error("Failed to load section subjects", err));
  }, []);

  // Fetch syllabus/lesson plan topics when selected subject changes
  useEffect(() => {
    if (!selectedSubject || !selectedSubject.course_assignment_id) {
      setTopics([]);
      setSelectedTopicId("");
      return;
    }
    axios.get(`/api/course-plan/${selectedSubject.course_assignment_id}`)
      .then(r => {
        setTopics(r.data.topics || []);
        setSelectedTopicId("");
      })
      .catch(err => {
        console.error("Failed to load course plan topics", err);
        setTopics([]);
        setSelectedTopicId("");
      });
  }, [selectedSubject]);

  const fetchAttendance = useCallback((dateStr, courseId, hour) => {
    setLoading(true);
    setError(null);
    setSaved(false);
    let url = `/api/class-advisor/attendance?date=${dateStr}`;
    if (courseId) url += `&course_id=${courseId}`;
    if (hour) url += `&hour=${hour}`;
    
    axios.get(url)
      .then(r => setStudents(r.data))
      .catch(() => setError('Failed to load students'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const courseId = selectedSubject ? selectedSubject.course_id : null;
    fetchAttendance(selectedDate, courseId, selectedPeriod);
  }, [selectedDate, selectedSubject, selectedPeriod, fetchAttendance]);

  const setStatus = (studentId, status) => {
    setStudents(prev => prev.map(s => {
      if (s.student_id !== studentId) return s;
      return { ...s, status };
    }));
    setSaved(false);
  };

  const markAll = (status) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
    setSaved(false);
  };

  const handleSave = async () => {
    if (selectedDate !== today) { alert('Attendance can only be saved for today.'); return; }
    if (attendanceLocked) { alert('Attendance is locked for your department by the HOD.'); return; }
    setSaving(true);
    try {
      await axios.post('/api/class-advisor/attendance', {
        date: selectedDate,
        records: students.filter(s => s.status).map(s => ({ student_id: s.student_id, status: s.status })),
        course_id: selectedSubject ? selectedSubject.course_id : null,
        course_assignment_id: selectedSubject ? selectedSubject.course_assignment_id : null,
        unit: selectedUnit,
        topic_id: selectedTopicId ? parseInt(selectedTopicId) : null,
        hour: selectedPeriod
      });
      setSaved(true);
      
      // Refresh topics so that covered status (actual_date) gets updated visually in the dropdown
      if (selectedSubject && selectedSubject.course_assignment_id) {
        axios.get(`/api/course-plan/${selectedSubject.course_assignment_id}`)
          .then(r => setTopics(r.data.topics || []))
          .catch(err => console.error(err));
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const isToday = selectedDate === today;
  const canEdit = isToday && !attendanceLocked;
  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount  = students.filter(s => s.status === 'absent').length;
  const unmarked     = students.filter(s => !s.status).length;
  const totalStudents = students.length;

  const handleWhatsAppShare = () => {
    const absentees = students.filter(s => s.status === 'absent');
    const parts = [
      '*Daily Attendance Report*',
      `Date: ${selectedDate.split('-').reverse().join('-')}`,
      `Subject: ${selectedSubject ? selectedSubject.name : ''}`,
      `Period: ${selectedPeriod}`,
      '',
      `Total Students: ${totalStudents}`,
      `Present: ${presentCount}`,
      `Absent: ${absentCount}`,
      ''
    ];

    if (absentees.length > 0) {
      parts.push('*Absentees:*');
      absentees.forEach((s, idx) => {
        parts.push(`${idx + 1}. ${s.first_name} ${s.last_name} (${s.register_number})`);
      });
    } else {
      parts.push('No absentees today! 🎉');
    }

    const message = parts.join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  // Filter topics based on unit (supports "1" vs "Unit 1", "UNIT I" etc.)
  const filteredTopics = topics.filter(t => {
    const unitStr = String(t.unit).trim().toLowerCase();
    const selUnit = String(selectedUnit).trim().toLowerCase();
    return unitStr === selUnit || 
           unitStr === `unit ${selUnit}` || 
           (selUnit === '1' && unitStr === 'unit i') ||
           (selUnit === '2' && unitStr === 'unit ii') ||
           (selUnit === '3' && unitStr === 'unit iii') ||
           (selUnit === '4' && unitStr === 'unit iv') ||
           (selUnit === '5' && unitStr === 'unit v');
  });

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Daily Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Select a date to manage student attendance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {attendanceLocked && (
            <span className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200 shadow-sm animate-pulse">
              Locked by HOD
            </span>
          )}
          {!isToday && !attendanceLocked && (
            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200">
              Read Only Mode
            </span>
          )}
          <CustomDatePicker 
            selectedDate={selectedDate} 
            onChange={setSelectedDate} 
            maxDate={today} 
          />
        </div>
      </div>

      {/* Subject and Lesson Plan Integration Controls */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary-600" /> Subject & Lesson Plan Coverage
          </h3>
          {selectedSubject && (
            <span className="text-[11px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
              Faculty: {selectedSubject.faculty_name}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Subject Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject / Course</label>
            <select
              value={selectedSubject ? selectedSubject.course_id : ""}
              onChange={(e) => {
                const sub = subjects.find(s => s.course_id === parseInt(e.target.value));
                setSelectedSubject(sub || null);
              }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              {subjects.map(s => (
                <option key={s.course_id} value={s.course_id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period/Hour Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hour / Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              {PERIODS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Unit Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</label>
            <select
              value={selectedUnit}
              onChange={(e) => {
                setSelectedUnit(e.target.value);
                setSelectedTopicId("");
              }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="1">Unit 1</option>
              <option value="2">Unit 2</option>
              <option value="3">Unit 3</option>
              <option value="4">Unit 4</option>
              <option value="5">Unit 5</option>
            </select>
          </div>

          {/* Topic Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Topic to Cover</label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">-- None / Select Topic --</option>
              {filteredTopics.map(t => {
                const isCovered = t.actual_date !== null;
                return (
                  <option key={t.id} value={t.id}>
                    {isCovered ? "✓ (Covered) " : ""}S.No {t.sequence_no}: {t.topic}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {totalStudents > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{totalStudents}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Present</p>
              <p className="text-2xl font-semibold text-green-600 mt-1">{presentCount}</p>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Absent</p>
              <p className="text-2xl font-semibold text-red-600 mt-1">{absentCount}</p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unmarked</p>
              <p className="text-2xl font-semibold text-gray-600 mt-1">{unmarked}</p>
            </div>
            <div className="p-3 bg-gray-50 text-gray-500 rounded-lg">
              <span className="w-5 h-5 flex items-center justify-center font-bold">—</span>
            </div>
          </div>
        </div>
      )}

      {/* Main List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Student List</h2>
          {canEdit && totalStudents > 0 && (
            <div className="flex gap-2">
              <button onClick={() => markAll('present')} className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                Mark All Present
              </button>
              <button onClick={() => markAll('absent')} className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                Mark All Absent
              </button>
            </div>
          )}
        </div>

        {/* List Content */}
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading attendance data...</div>
        ) : error ? (
          <div className="p-12 text-center text-sm text-red-600 bg-red-50">{error}</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No students registered in this class.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {students.map((s, idx) => {
              const isPresent = s.status === 'present';
              const isAbsent = s.status === 'absent';

              return (
                <div key={s.student_id} className="flex items-center px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-8 sm:w-12 text-xs sm:text-sm text-gray-400 font-medium">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{s.first_name} {s.last_name}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{s.register_number}</p>
                  </div>
                  
                  {canEdit ? (
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                      <button
                        onClick={() => setStatus(s.student_id, 'present')}
                        className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                          isPresent 
                            ? 'bg-green-600 text-white dark:text-gray-900 shadow-sm border border-transparent' 
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => setStatus(s.student_id, 'absent')}
                        className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                          isAbsent 
                            ? 'bg-red-600 text-white dark:text-gray-900 shadow-sm border border-transparent' 
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      isPresent ? 'bg-green-50 dark:bg-gray-100 text-green-700 dark:text-green-400 border-green-200 dark:border-gray-200' :
                      isAbsent  ? 'bg-red-50 dark:bg-gray-100 text-red-700 dark:text-red-400 border-red-200 dark:border-gray-200' :
                      'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                      {s.status ? (isPresent ? 'Present' : 'Absent') : 'Not Marked'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Footer */}
      {canEdit && totalStudents > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-sm text-gray-600 w-full sm:w-auto text-center sm:text-left">
              <span className="font-semibold text-gray-900">{unmarked}</span> students left to mark.
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
              {saved && (
                <>
                  <span className="flex flex-col sm:flex-row items-center text-sm font-medium text-green-600 bg-green-50 px-2 sm:px-3 py-1.5 rounded-md gap-1">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1 sm:mr-1.5" />
                      <span className="hidden sm:inline">Successfully saved</span>
                      <span className="sm:hidden">Saved</span>
                    </div>
                    {selectedSubject && (
                      <Link
                        to={`/faculty/courses/${selectedSubject.course_assignment_id}/lms/syllabus`}
                        state={{ mode: 'record' }}
                        className="text-xs font-bold text-primary-600 hover:text-primary-700 underline sm:ml-2"
                      >
                        Verify Record →
                      </Link>
                    )}
                  </span>
                  <button
                    onClick={handleWhatsAppShare}
                    className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium bg-[#25D366] text-white hover:bg-[#20bd5a] transition-all shadow-sm flex-1 sm:flex-none justify-center"
                  >
                    <MessageCircle className="w-4 h-4 mr-1.5 fill-current" />
                    <span className="hidden sm:inline">Share to WhatsApp</span>
                    <span className="sm:hidden">WhatsApp</span>
                  </button>
                </>
              )}
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className={`flex items-center px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all flex-1 sm:flex-none justify-center ${
                  saved 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                }`}
              >
                <Save className="w-4 h-4 mr-1.5 sm:mr-2" />
                {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
