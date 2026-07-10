import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ClipboardList, Calendar as CalendarIcon, CalendarCheck, CalendarX, 
  Info, ChevronLeft, ChevronRight, Activity 
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
  parseISO,
  isToday
} from 'date-fns';

export default function MyAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/faculty/me/my-attendance', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to fetch attendance records');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="font-semibold text-sm">{error}</p>
      </div>
    );
  }

  const attendance = data?.attendance || [];
  const presentCount = attendance.filter(r => r.status === 'present').length;
  const leaveCount = attendance.filter(r => r.status === 'on_leave').length;

  // Helper to map leave types to Acronyms (e.g. Casual -> CL, On-Duty -> OD)
  const getLeaveAcronym = (leaveType) => {
    if (!leaveType) return 'L';
    const normalized = leaveType.toLowerCase().trim();
    if (normalized.includes('casual')) return 'CL';
    if (normalized.includes('sick') || normalized.includes('medical')) return 'ML';
    if (normalized.includes('earned')) return 'EL';
    if (normalized.includes('vacation')) return 'VL';
    if (normalized.includes('duty') || normalized.includes('od')) return 'OD';
    return 'L'; // Default leave acronym
  };

  // Build Calendar Days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStarts: 0 }); // Start on Sunday
  const endDate = endOfWeek(monthEnd, { weekStarts: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Determine the status block for a given calendar day
  const getDayStatusContent = (day) => {
    const record = attendance.find(r => isSameDay(parseISO(r.date), day));
    
    if (!record) return null;

    if (record.status === 'present') {
      return (
        <div className="flex flex-col items-center justify-center bg-green-50 text-green-700 w-8 h-8 md:w-10 md:h-10 rounded-xl shadow-sm border border-green-200 ring-2 ring-green-100 transition-all hover:scale-110">
          <span className="font-black text-sm md:text-lg">P</span>
        </div>
      );
    }

    if (record.status === 'on_leave') {
      const acronym = getLeaveAcronym(record.leave_type);
      return (
        <div 
          className="flex flex-col items-center justify-center bg-orange-50 text-orange-700 w-8 h-8 md:w-10 md:h-10 rounded-xl shadow-sm border border-orange-200 ring-2 ring-orange-100 transition-all hover:scale-110 cursor-help"
          title={record.leave_type || 'On Leave'}
        >
          <span className="font-black text-xs md:text-sm">{acronym}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-600" /> My Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track your daily presence and leave history.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Present (P)</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> Leave</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Present</p>
            <p className="text-2xl font-bold text-gray-900">{presentCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Days on Leave</p>
            <p className="text-2xl font-bold text-gray-900">{leaveCount}</p>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-2 rounded-xl text-primary-600">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={prevMonth}
              className="p-2 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all text-gray-500 hover:text-gray-900 shadow-sm hover:shadow"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={nextMonth}
              className="p-2 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all text-gray-500 hover:text-gray-900 shadow-sm hover:shadow"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid Header */}
        <div className="grid grid-cols-7 bg-gray-50/80 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
            <div key={day} className={`py-4 text-center ${idx < 6 ? 'border-r border-gray-200/60' : ''}`}>
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 bg-gray-200 gap-px">
          {calendarDays.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const statusContent = getDayStatusContent(day);
            
            return (
              <div 
                key={idx} 
                className={`min-h-[100px] md:min-h-[130px] bg-white flex flex-col p-2 sm:p-3 transition-colors relative group ${
                  !isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'hover:bg-primary-50/10'
                } ${isTodayDate ? 'bg-primary-50/30' : ''}`}
              >
                {/* Date Number Top Right */}
                <div className="flex justify-end w-full mb-2">
                   <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                     isTodayDate ? 'bg-primary-600 text-white shadow-md' : 
                     isCurrentMonth ? 'text-gray-700 group-hover:bg-gray-100' : 'text-gray-400'
                   }`}>
                     {format(day, 'd')}
                   </span>
                </div>
                
                {/* Status Indicator Centered */}
                <div className="flex-1 flex flex-col items-center justify-center w-full">
                  {statusContent ? statusContent : (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center w-full h-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
