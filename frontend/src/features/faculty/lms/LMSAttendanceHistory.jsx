import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FileText, ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export const LMSAttendanceHistory = () => {
  const { assignmentId } = useParams();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for Calendar & History
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    axios.get(`/api/faculty/courses/${assignmentId}/attendance-history`)
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load attendance history'))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <p className="font-semibold">{error}</p>
        <Link to={`/faculty/courses/${assignmentId}/lms`} className="mt-4 text-blue-600 underline">Return to Dashboard</Link>
      </div>
    );
  }

  const { history, course_code, course_name, section, total_students } = data;

  // --- Calendar Logic ---
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day) => {
    setSelectedDate(new Date(year, month, day));
    setExpanded(null); // Reset expanded record
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day) => {
    return selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  };

  // Create a map of dates that have attendance history
  const historyDates = new Set(history.map(entry => entry.date)); // Format expected: 'YYYY-MM-DD'
  
  const hasHistory = (day) => {
    // Format current cell to YYYY-MM-DD
    const localStr = new Date(year, month, day).toLocaleDateString('en-CA'); // 'YYYY-MM-DD' depending on timezone
    // Better manual format:
    const fmt = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return historyDates.has(fmt);
  };

  // Filter history for the selected date
  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const filteredHistory = history.filter(entry => entry.date === selectedDateStr);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link 
            to={`/faculty/courses/${assignmentId}/lms`} 
            className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-600" /> Attendance History
          </h1>
          <p className="text-sm text-gray-500 mt-1">Select a date from the calendar to view attendance records.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Calendar & Course Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Course Info Header */}
          <div className="bg-indigo-50/50 dark:bg-gray-50 rounded-2xl border border-indigo-100 dark:border-gray-100 p-6 shadow-sm">
            <p className="text-lg font-bold text-gray-900">{course_code} — {course_name}</p>
            <p className="text-sm text-gray-600 mt-1 font-medium">Section: {section}</p>
            <div className="mt-4 inline-block px-3 py-1.5 bg-white dark:bg-gray-100 text-indigo-800 dark:text-indigo-300 text-sm font-bold rounded-lg border border-indigo-200 dark:border-gray-200">
              {total_students} Enrolled
            </div>
            <div className="mt-2 text-xs font-semibold text-gray-500">
              {new Set(history.map(h => h.date)).size} total class day{new Set(history.map(h => h.date)).size !== 1 ? 's' : ''} recorded
            </div>
          </div>

          {/* Modern Calendar UI */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-gray-50 rounded-bl-full -z-10"></div>
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {currentMonth.toLocaleString('default', { month: 'long' })} {year}
              </h2>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs font-bold text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const today = isToday(day);
                const selected = isSelected(day);
                const recorded = hasHistory(day);

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`
                      w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-semibold transition-all relative
                      ${selected ? 'bg-indigo-600 text-white dark:text-gray-900 shadow-md shadow-indigo-200 dark:shadow-none scale-110 z-10' : 'text-gray-700 hover:bg-gray-100'}
                      ${today && !selected ? 'ring-2 ring-indigo-200 dark:ring-indigo-700 text-indigo-700 dark:text-indigo-400 font-bold' : ''}
                    `}
                  >
                    {day}
                    {/* Dot indicator if there's history on this day */}
                    {recorded && !selected && (
                      <span className="absolute bottom-1 w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    )}
                    {recorded && selected && (
                      <span className="absolute bottom-1 w-1.5 h-1.5 bg-white rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Attendance Records for Selected Date */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 min-h-[500px]">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 flex flex-col sm:flex-row sm:items-center gap-2 border-b border-gray-100 pb-4">
              <span className="hidden sm:inline">Records for</span> {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>

            {filteredHistory.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <CalendarIcon className="w-8 h-8 text-gray-300" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">No Classes Recorded</h4>
                <p className="text-sm font-medium text-gray-500">There is no attendance data for this specific date.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map(entry => {
                  const pct = total_students > 0 ? Math.round((entry.present / total_students) * 100) : 0;
                  const entryKey = `${entry.date}-${entry.hour}`;
                  const isExpanded = expanded === entryKey;
                  const barColor = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';

                  return (
                    <div key={entryKey} className="bg-white rounded-2xl border border-gray-200 dark:border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Summary row — click to expand */}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : entryKey)}
                        className="w-full p-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:bg-gray-50 dark:hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-center justify-between sm:justify-start gap-3">
                            <span className="px-3 py-1 bg-indigo-50 dark:bg-gray-100 text-indigo-700 dark:text-indigo-300 text-[13px] font-bold rounded-lg border border-indigo-100 dark:border-gray-200">
                              {entry.hour_label}
                            </span>
                            {/* Show dropdown icon on mobile in header line instead of at the bottom */}
                            <span className={`sm:hidden text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-3 w-full sm:max-w-md">
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-sm font-bold flex-shrink-0 w-10 ${pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 mt-1 sm:mt-0 w-full sm:w-auto">
                          <span className="flex-1 sm:flex-none text-center px-3 py-1.5 bg-green-50 dark:bg-gray-100 text-green-700 dark:text-green-400 text-[13px] font-bold rounded-xl border border-green-100 dark:border-gray-200 shadow-sm">{entry.present} Present</span>
                          <span className="flex-1 sm:flex-none text-center px-3 py-1.5 bg-red-50 dark:bg-gray-100 text-red-700 dark:text-red-400 text-[13px] font-bold rounded-xl border border-red-100 dark:border-gray-200 shadow-sm">{entry.absent} Absent</span>
                          <span className="flex-1 sm:flex-none text-center px-3 py-1.5 bg-blue-50 dark:bg-gray-100 text-blue-700 dark:text-blue-400 text-[13px] font-bold rounded-xl border border-blue-100 dark:border-gray-200 shadow-sm">{entry.present + entry.absent} Total</span>
                          <span className={`hidden sm:block text-gray-400 text-sm transition-transform ml-1 ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </span>
                        </div>
                      </button>

                      {/* Expanded student list */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 dark:border-gray-200 divide-y divide-gray-50 dark:divide-gray-100 bg-gray-50/50 dark:bg-gray-50 p-2 sm:p-4">
                          <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-100 overflow-hidden shadow-sm">
                            {entry.records.map(r => (
                              <div key={r.student_id} className="flex items-center justify-between px-4 sm:px-5 py-3 gap-3 border-b border-gray-50 dark:border-gray-100 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[13px] sm:text-sm font-bold text-gray-900 truncate">{r.name}</span>
                                  <span className="text-[11px] sm:text-xs font-mono text-gray-500">{r.register_number}</span>
                                </div>
                                <span className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex-shrink-0 text-center uppercase tracking-wider ${
                                  r.status === 'present' ? 'bg-green-100 dark:bg-gray-100 text-green-700 dark:text-green-400' :
                                  r.status === 'absent'  ? 'bg-red-100 dark:bg-gray-100 text-red-700 dark:text-red-400'    :
                                  'bg-gray-100 dark:bg-gray-200 text-gray-500 dark:text-gray-400'
                                }`}>
                                  {r.status === 'present' ? 'Present' : r.status === 'absent' ? 'Absent' : r.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
