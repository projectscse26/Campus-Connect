import React, { useState, useEffect, useCallback } from 'react';
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

export const CADailyAttendance = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const fetchAttendance = useCallback((dateStr) => {
    setLoading(true);
    setError(null);
    setSaved(false);
    axios.get(`/api/class-advisor/attendance?date=${dateStr}`)
      .then(r => setStudents(r.data))
      .catch(() => setError('Failed to load students'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAttendance(selectedDate); }, [selectedDate, fetchAttendance]);

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
    setSaving(true);
    try {
      await axios.post('/api/class-advisor/attendance', {
        date: selectedDate,
        records: students.filter(s => s.status).map(s => ({ student_id: s.student_id, status: s.status }))
      });
      setSaved(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const isToday = selectedDate === today;
  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount  = students.filter(s => s.status === 'absent').length;
  const unmarked     = students.filter(s => !s.status).length;
  const totalStudents = students.length;

  const handleWhatsAppShare = () => {
    const absentees = students.filter(s => s.status === 'absent');
    const parts = [
      '*Daily Attendance Report*',
      `Date: ${selectedDate.split('-').reverse().join('-')}`,
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

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Daily Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Select a date to manage student attendance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {!isToday && (
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
          {isToday && totalStudents > 0 && (
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
                  
                  {isToday ? (
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                      <button
                        onClick={() => setStatus(s.student_id, 'present')}
                        className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                          isPresent 
                            ? 'bg-white text-green-700 shadow-sm border border-gray-200' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => setStatus(s.student_id, 'absent')}
                        className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                          isAbsent 
                            ? 'bg-white text-red-700 shadow-sm border border-gray-200' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      isPresent ? 'bg-green-50 text-green-700 border-green-200' :
                      isAbsent  ? 'bg-red-50 text-red-700 border-red-200' :
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
      {isToday && totalStudents > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-sm text-gray-600 w-full sm:w-auto text-center sm:text-left">
              <span className="font-semibold text-gray-900">{unmarked}</span> students left to mark.
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
              {saved && (
                <>
                  <span className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-2 sm:px-3 py-1.5 rounded-md">
                    <CheckCircle2 className="w-4 h-4 mr-1 sm:mr-1.5" />
                    <span className="hidden sm:inline">Successfully saved</span>
                    <span className="sm:hidden">Saved</span>
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
