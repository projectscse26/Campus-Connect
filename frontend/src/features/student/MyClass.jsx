import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, Mail, User, BookOpen, Clock, Loader2, MapPin } from 'lucide-react';

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
  { id: 'Monday', label: 'MON' },
  { id: 'Tuesday', label: 'TUE' },
  { id: 'Wednesday', label: 'WED' },
  { id: 'Thursday', label: 'THU' },
  { id: 'Friday', label: 'FRI' }
];

export default function MyClass() {
  const { user } = useAuth();
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClassInfo = async () => {
      try {
        const response = await axios.get('/api/student-portal/my-class');
        setClassInfo(response.data);
        setError('');
      } catch (err) {
        console.error('Failed to fetch class info', err);
        if (err.response && err.response.data && err.response.data.detail) {
          setError(err.response.data.detail);
        } else {
          setError('Failed to load class information. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClassInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl shadow-sm border border-red-100 flex items-center">
        <Users className="w-6 h-6 mr-3" />
        {error}
      </div>
    );
  }

  if (!classInfo) return null;

  const { section, advisor, mentor, classmates, timetable } = classInfo;

  // Group timetable by day and period for 2D grid
  const grid = {};
  DAYS.forEach(d => {
    grid[d.id] = {};
  });

  timetable.forEach(slot => {
    const period = PERIODS.find(p => slot.start_time && slot.start_time.startsWith(p.start));
    if (period && grid[slot.day]) {
      grid[slot.day][period.id] = slot;
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-50 to-primary-100 rounded-bl-full -z-10 opacity-50"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {section.department} - {section.name}
            </h1>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">Batch {section.batch}</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">Year {section.year}</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {advisor && (
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Class Advisor</p>
                  <p className="font-medium text-gray-900">{advisor.name}</p>
                </div>
              </div>
            )}
            
            {mentor && (
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Mentor</p>
                  <p className="font-medium text-gray-900">{mentor.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Timetable Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Class Timetable</h2>
            </div>
            
            <div className="overflow-x-auto">
              <div className="min-w-[1000px]">
                {/* Header Row */}
                <div className="flex bg-slate-50 border-b border-slate-200">
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

                      const slot = grid[day.id]?.[period.id];
                      
                      return (
                        <div 
                          key={`${day.id}-${period.id}`}
                          className={`w-[120px] shrink-0 border-r border-slate-200 p-2 relative group transition-colors ${
                            slot ? 'bg-indigo-50/50' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          {slot ? (
                            <div className="h-full bg-white border border-indigo-200 rounded-lg p-2 shadow-sm relative group-hover:border-indigo-400 group-hover:shadow-md transition-all cursor-pointer">
                              <div className="font-bold text-indigo-700 text-xs truncate" title={slot.course_name}>
                                {slot.course_code || slot.course_name}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1 truncate">
                                {slot.faculty_name}
                              </div>
                              {slot.room_number && (
                                <div className="text-[10px] text-slate-400 mt-1 truncate flex items-center">
                                  <MapPin className="w-2.5 h-2.5 mr-1" />
                                  {slot.room_number}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-full border border-dashed border-transparent group-hover:border-slate-300 rounded-lg flex items-center justify-center transition-colors">
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
        </div>

      </div>
    </div>
  );
}
