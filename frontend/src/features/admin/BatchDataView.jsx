import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, BookOpen, Loader2, BookMarked, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';

export const BatchDataView = ({ batch, departmentName }) => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [selectedSem, setSelectedSem] = useState(1);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  const [batchData, setBatchData] = useState({ students: [], attendance: [], grades: [] });
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Gradebook State
  const [selectedAssessment, setSelectedAssessment] = useState('internal_1');

  useEffect(() => {
    if (batch && departmentName) {
      fetchCourses();
    }
  }, [batch, departmentName, selectedSem]);

  useEffect(() => {
    if (selectedCourse) {
      fetchBatchData();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const res = await axios.get('/api/admin/alumni/batch-courses', {
        params: { department_name: departmentName, semester: selectedSem },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCourses(res.data);
      if (res.data.length > 0) {
        setSelectedCourse(res.data[0].id);
      } else {
        setSelectedCourse(null);
        setBatchData({ students: [], attendance: [], grades: [] });
      }
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchBatchData = async () => {
    try {
      setLoadingData(true);
      const res = await axios.get('/api/admin/alumni/batch-course-data', {
        params: { batch, department_name: departmentName, course_id: selectedCourse },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setBatchData(res.data);
      
      // Focus calendar on earliest attendance record date
      if (res.data.attendance && res.data.attendance.length > 0) {
        const earliest = res.data.attendance.reduce((min, a) => {
          const d = new Date(a.date);
          return d < min ? d : min;
        }, new Date(res.data.attendance[0].date));
        setCurrentMonth(earliest);
        setSelectedDate(earliest);
      }
    } catch (err) {
      console.error("Failed to fetch batch data", err);
    } finally {
      setLoadingData(false);
    }
  };

  // Calendar Functions
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => (
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

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const hasRecords = batchData.attendance.some(a => isSameDay(new Date(a.date), cloneDay));
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day}
            onClick={() => setSelectedDate(cloneDay)}
            className={`relative flex items-center justify-center h-10 w-10 mx-auto rounded-full cursor-pointer transition-all text-sm
              ${!isCurrentMonth ? 'text-slate-300 dark:text-gray-600' : 'text-slate-700 dark:text-gray-300'}
              ${isSelected ? 'bg-primary-600 text-white font-bold shadow-md shadow-primary-500/30' : 'hover:bg-slate-100 dark:hover:bg-gray-800'}
              ${hasRecords && !isSelected ? 'font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' : ''}
            `}
          >
            <span>{format(day, "d")}</span>
            {hasRecords && !isSelected && <span className="absolute bottom-1.5 w-1 h-1 bg-primary-500 rounded-full"></span>}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7 gap-y-2" key={day}>{days}</div>);
      days = [];
    }
    return <div>{rows}</div>;
  };

  const getAttendanceForSelectedDate = () => {
    // Map each student to their attendance record on this day
    return batchData.students.map(student => {
      const record = batchData.attendance.find(a => 
        a.student_id === student.id && isSameDay(new Date(a.date), selectedDate)
      );
      return { student, record };
    });
  };

  const renderAttendanceTab = () => {
    const studentRecords = getAttendanceForSelectedDate();
    const recordsExist = studentRecords.some(r => r.record);

    return (
      <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
        <div className="w-full md:w-[360px] shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2 text-xl">
              <CalendarDays className="w-5 h-5 text-primary-500" /> Calendar
            </h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">Select a date to view attendance.</p>
            <div className="bg-slate-50 dark:bg-gray-900 p-5 rounded-2xl border border-slate-100 dark:border-gray-700">
              {renderHeader()}
              <div className="grid grid-cols-7 mb-2">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} className="text-center font-medium text-sm text-slate-400 py-2">{d}</div>
                ))}
              </div>
              {renderCells()}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col h-[600px]">
          <div className="p-6 border-b border-slate-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Records for {format(selectedDate, 'EEEE, d MMMM yyyy')}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!recordsExist ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Classes Recorded</h3>
                <p className="text-slate-500 dark:text-gray-400 mt-1">No attendance data exists for this batch on this date.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-gray-900/50 sticky top-0">
                  <tr className="text-slate-500 dark:text-gray-400 font-semibold border-b border-slate-200 dark:border-gray-700">
                    <th className="px-6 py-4 w-12">#</th>
                    <th className="px-6 py-4">Register No.</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                  {studentRecords.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{idx + 1}</td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-600 dark:text-gray-300">{item.student.register_number}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.student.first_name} {item.student.last_name}</td>
                      <td className="px-6 py-4">
                        {item.record ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                            ${item.record.status === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                              item.record.status === 'absent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}
                          >
                            {item.record.status}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGradebookTab = () => {
    const assessments = [
      { id: 'internal_1', label: 'CIA 1', max: 50 },
      { id: 'internal_2', label: 'CIA 2', max: 50 },
      { id: 'model_exam', label: 'Model Exam', max: 60 }
    ];
    const currentAssesment = assessments.find(a => a.id === selectedAssessment);
    const passMark = Math.ceil(currentAssesment.max / 2);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden flex flex-col h-[600px] animate-in fade-in duration-500">
        <div className="p-6 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50">
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
                {asmt.label} <span className="text-xs opacity-80">/{asmt.max}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-gray-900/50 sticky top-0 shadow-sm z-10">
              <tr className="text-slate-500 dark:text-gray-400 font-semibold border-b border-slate-200 dark:border-gray-700">
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-6 py-4">Register No.</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4 text-center border-l border-slate-200 dark:border-gray-700 bg-primary-50/30 dark:bg-primary-900/5">Marks / {currentAssesment.max}</th>
                <th className="px-6 py-4 text-center border-l border-slate-200 dark:border-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {batchData.students.map((student, idx) => {
                const record = batchData.grades.find(g => g.student_id === student.id && g.grade_type === selectedAssessment);
                const marks = record ? record.marks_obtained : undefined;
                const isAbsent = marks === null;
                const isPassed = !isAbsent && marks >= passMark;

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-600 dark:text-gray-300">{student.register_number}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{student.first_name} {student.last_name}</td>
                    <td className="px-6 py-4 text-center border-l border-slate-200 dark:border-gray-700 bg-primary-50/10 dark:bg-primary-900/5 font-bold text-slate-900 dark:text-white">
                      {isAbsent ? <span className="text-red-500">AB</span> : marks !== undefined ? marks : '-'}
                    </td>
                    <td className="px-6 py-4 text-center border-l border-slate-200 dark:border-gray-700">
                      {marks !== undefined ? (
                        isAbsent ? <span className="text-red-500 font-bold">FAIL</span> :
                        isPassed ? <span className="text-green-600 dark:text-green-400 font-bold">PASS</span> :
                        <span className="text-red-600 dark:text-red-400 font-bold">FAIL</span>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden mb-8">
      <div className="p-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex bg-slate-100 dark:bg-gray-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'attendance' ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-gray-400'}`}
          >
            Batch Attendance
          </button>
          <button
            onClick={() => setActiveTab('gradebook')}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'gradebook' ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-gray-400'}`}
          >
            Batch Gradebook
          </button>
        </div>

        <div className="flex gap-3">
          <select 
            value={selectedSem} 
            onChange={e => setSelectedSem(parseInt(e.target.value))}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl font-medium focus:ring-2 focus:ring-primary-500 outline-none text-slate-700 dark:text-gray-300"
          >
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>

          <select
            value={selectedCourse || ''}
            onChange={e => setSelectedCourse(parseInt(e.target.value))}
            disabled={loadingCourses || courses.length === 0}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl font-medium focus:ring-2 focus:ring-primary-500 outline-none text-slate-700 dark:text-gray-300 w-64 disabled:opacity-50"
          >
            {loadingCourses ? (
              <option>Loading courses...</option>
            ) : courses.length === 0 ? (
              <option>No courses found</option>
            ) : (
              courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)
            )}
          </select>
        </div>
      </div>

      <div className="p-6">
        {loadingData ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary-500" />
            <p>Fetching {batch} records...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Academic Records</h3>
            <p className="text-slate-500 dark:text-gray-400 mt-1">This batch does not have courses recorded for Semester {selectedSem}.</p>
          </div>
        ) : (
          activeTab === 'attendance' ? renderAttendanceTab() : renderGradebookTab()
        )}
      </div>
    </div>
  );
};
