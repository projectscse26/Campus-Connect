import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Calendar as CalendarIcon, BookOpen, Loader2, ShieldAlert, ChevronLeft, ChevronRight, CalendarDays, BookMarked } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';

export const AlumniProfileModal = ({ student, onClose }) => {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' or 'gradebook'
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState(1);
  const [selectedSem, setSelectedSem] = useState(1);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Gradebook State
  const [selectedAssessment, setSelectedAssessment] = useState('internal_1'); // internal_1, internal_2, model_exam

  const years = [
    { year: 1, label: "1st Year", sems: [1, 2] },
    { year: 2, label: "2nd Year", sems: [3, 4] },
    { year: 3, label: "3rd Year", sems: [5, 6] },
    { year: 4, label: "4th Year", sems: [7, 8] },
  ];

  useEffect(() => {
    fetchRecords();
  }, [student.id]);

  useEffect(() => {
    // When semester changes, if there are attendance records, focus the calendar on the first record of that semester
    if (records?.attendance && records.attendance.length > 0) {
      const semAtt = records.attendance.filter(a => a.course?.semester === selectedSem);
      if (semAtt.length > 0) {
        // Find earliest date
        const earliest = semAtt.reduce((min, a) => {
          const date = new Date(a.date);
          return date < min ? date : min;
        }, new Date(semAtt[0].date));
        
        setCurrentMonth(earliest);
        setSelectedDate(earliest);
      } else {
        setCurrentMonth(new Date());
        setSelectedDate(new Date());
      }
    }
  }, [selectedSem, records]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/alumni/${student.id}/records`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRecords(res.data);
    } catch (err) {
      console.error("Failed to fetch records", err);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const onDateClick = day => setSelectedDate(day);

  // Calendar render functions
  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-gray-300" />
          </button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = "EE"; // Mon, Tue, etc
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-medium text-sm text-slate-400 py-2">
          {format(addDays(startDate, i), dateFormat).substring(0, 2)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    // Filter attendance for the selected semester
    const semAtt = records?.attendance?.filter(a => a.course?.semester === selectedSem) || [];

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        // Check if student has records on this day
        const hasRecords = semAtt.some(a => isSameDay(new Date(a.date), cloneDay));
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day}
            onClick={() => onDateClick(cloneDay)}
            className={`
              relative flex items-center justify-center h-10 w-10 mx-auto rounded-full cursor-pointer transition-all text-sm
              ${!isCurrentMonth ? 'text-slate-300 dark:text-gray-600' : 'text-slate-700 dark:text-gray-300'}
              ${isSelected ? 'bg-primary-600 text-white font-bold shadow-md shadow-primary-500/30' : 'hover:bg-slate-100 dark:hover:bg-gray-800'}
              ${hasRecords && !isSelected ? 'font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' : ''}
            `}
          >
            <span>{formattedDate}</span>
            {hasRecords && !isSelected && (
              <span className="absolute bottom-1.5 w-1 h-1 bg-primary-500 rounded-full"></span>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-y-2" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  const getAttendanceForSelectedDate = () => {
    return records?.attendance?.filter(a => 
      a.course?.semester === selectedSem && 
      isSameDay(new Date(a.date), selectedDate)
    ) || [];
  };

  const getGradesForSem = () => {
    const semGrades = records?.grades?.filter(g => g.course?.semester === selectedSem) || [];
    const coursesMap = {};
    semGrades.forEach(g => {
      if (!coursesMap[g.course_id]) {
        coursesMap[g.course_id] = { course: g.course, grades: {} };
      }
      coursesMap[g.course_id].grades[g.grade_type] = g.marks_obtained;
    });
    return Object.values(coursesMap);
  };

  const renderAttendanceTab = () => {
    const dateRecords = getAttendanceForSelectedDate();
    
    return (
      <div className="flex flex-col md:flex-row gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-full md:w-[360px] shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 mb-6 h-full">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2 text-xl">
              <CalendarDays className="w-5 h-5 text-primary-500" />
              Semester {selectedSem} Calendar
            </h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">Select a date from the calendar to view daily attendance records.</p>
            
            <div className="bg-slate-50 dark:bg-gray-900 p-5 rounded-2xl border border-slate-100 dark:border-gray-700">
              {renderHeader()}
              {renderDays()}
              {renderCells()}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-6 flex flex-col h-full">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-gray-700 pb-4">
            Records for {format(selectedDate, 'EEEE, d MMMM yyyy')}
          </h3>

          <div className="flex-1 overflow-y-auto pr-2">
            {dateRecords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
                  <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Classes Recorded</h3>
                <p className="text-slate-500 dark:text-gray-400 mt-1">There is no attendance data for this specific date.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dateRecords.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-900/50 rounded-xl border border-slate-100 dark:border-gray-700">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-gray-200">{att.course?.name}</h4>
                      <p className="text-sm text-slate-500 font-mono mt-0.5">{att.course?.code}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {att.hour && <span className="text-xs font-medium text-slate-400 bg-slate-200 dark:bg-gray-800 px-2 py-1 rounded-md">Period {att.hour}</span>}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${att.status === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                          att.status === 'absent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}
                      >
                        {att.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGradebookTab = () => {
    const courses = getGradesForSem();
    
    // Mapping assessment types to friendly names and max marks
    const assessments = [
      { id: 'internal_1', label: 'CIA 1', max: 50 },
      { id: 'internal_2', label: 'CIA 2', max: 50 },
      { id: 'model_exam', label: 'Model Exam', max: 60 }
    ];

    const currentAssesment = assessments.find(a => a.id === selectedAssessment);
    const passMark = Math.ceil(currentAssesment.max / 2); // 50% pass mark

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-6 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl flex items-center justify-center">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Academic Gradebook</h3>
              <p className="text-sm text-slate-500 dark:text-gray-400">Year {selectedYear} • Semester {selectedSem}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Select Assessment</p>
            <div className="flex flex-wrap gap-3">
              {assessments.map(asmt => (
                <button
                  key={asmt.id}
                  onClick={() => setSelectedAssessment(asmt.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                    selectedAssessment === asmt.id 
                      ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/30' 
                      : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                >
                  {asmt.label}
                  <span className={`px-1.5 py-0.5 rounded-md text-xs ${
                    selectedAssessment === asmt.id ? 'bg-primary-700 text-primary-100' : 'bg-slate-100 dark:bg-gray-700 text-slate-400'
                  }`}>
                    /{asmt.max}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="px-6 py-3 bg-slate-50 dark:bg-gray-900/80 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center text-sm text-slate-500">
          <span>{courses.length} courses</span>
          <div className="flex gap-4 font-medium">
            <span>Max marks: <span className="text-slate-900 dark:text-white">{currentAssesment.max}</span></span>
            <span>Pass: <span className="text-slate-900 dark:text-white">{passMark}</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {courses.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-slate-300 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Grades Recorded</h3>
              <p className="text-slate-500 dark:text-gray-400 mt-1">There is no gradebook data for this semester.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 dark:bg-gray-900/50 text-slate-500 dark:text-gray-400 font-semibold border-b border-slate-200 dark:border-gray-700">
                    <th className="px-6 py-4 w-12">#</th>
                    <th className="px-6 py-4">Course Name</th>
                    <th className="px-6 py-4">Course Code</th>
                    <th className="px-6 py-4 text-center border-l border-slate-200 dark:border-gray-700 bg-primary-50/30 dark:bg-primary-900/5 text-primary-700 dark:text-primary-300">Marks / {currentAssesment.max}</th>
                    <th className="px-6 py-4 text-center border-l border-slate-200 dark:border-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                  {courses.map((c, idx) => {
                    const marks = c.grades[selectedAssessment];
                    const isAbsent = marks === null;
                    const isPassed = !isAbsent && marks >= passMark;
                    
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white max-w-sm truncate" title={c.course?.name}>{c.course?.name}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-gray-400">{c.course?.code}</td>
                        
                        <td className="px-6 py-4 text-center border-l border-slate-200 dark:border-gray-700 bg-primary-50/10 dark:bg-primary-900/5 font-bold text-slate-900 dark:text-white">
                          {isAbsent ? <span className="text-red-500">AB</span> : marks !== undefined ? marks : '-'}
                        </td>
                        
                        <td className="px-6 py-4 text-center border-l border-slate-200 dark:border-gray-700">
                          {marks !== undefined ? (
                            isAbsent ? (
                              <span className="text-red-500 font-bold">FAIL</span>
                            ) : isPassed ? (
                              <span className="text-green-600 dark:text-green-400 font-bold">PASS</span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400 font-bold">FAIL</span>
                            )
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-7xl bg-slate-50 dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex-none p-6 border-b border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 flex justify-between items-start z-20">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-2xl shadow-sm border border-primary-200 dark:border-primary-800/50">
              {student.first_name[0]}{student.last_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {student.first_name} {student.last_name}
                </h2>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wider border border-green-200 dark:border-green-500/30">
                  Alumni Record
                </span>
              </div>
              <p className="text-slate-500 dark:text-gray-400 font-mono mb-2">{student.register_number}</p>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-gray-300">
                <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-slate-400" /> Batch {student.batch}</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-slate-400" /> {student.department?.name}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 bg-slate-50 dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar Navigation */}
          <div className="w-72 flex-none bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 flex flex-col z-10">
            <div className="p-4 border-b border-slate-200 dark:border-gray-800">
              <div className="flex bg-slate-100 dark:bg-gray-800 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'attendance' ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-gray-400'}`}
                >
                  Attendance
                </button>
                <button
                  onClick={() => setActiveTab('gradebook')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'gradebook' ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-gray-400'}`}
                >
                  Gradebook
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {years.map(yr => (
                <div key={yr.year}>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-2">{yr.label}</h4>
                  <div className="space-y-1">
                    {yr.sems.map(sem => (
                      <button
                        key={sem}
                        onClick={() => {
                          setSelectedYear(yr.year);
                          setSelectedSem(sem);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                          selectedSem === sem 
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-bold border border-primary-100 dark:border-primary-900/30' 
                            : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 border border-transparent'
                        }`}
                      >
                        Semester {sem}
                        {selectedSem === sem && <ChevronRight className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-gray-900">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary-500" />
                <p>Fetching historical data for Semester {selectedSem}...</p>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto h-full">
                {String(student.id).startsWith("old_") && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 flex gap-4 mb-6">
                    <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0" />
                    <div>
                      <h4 className="font-bold text-amber-800 dark:text-amber-500 mb-1">Legacy Alumni Record</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-600/80">
                        This student graduated before detailed tracking was implemented. Their day-to-day relational data was purged upon graduation.
                      </p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'attendance' ? renderAttendanceTab() : renderGradebookTab()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
