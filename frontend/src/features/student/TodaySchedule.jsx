import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, MapPin, User, Users, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export default function TodaySchedule() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClassInfo = async () => {
      try {
        const response = await axios.get('/api/student-portal/my-class');
        setTimetable(response.data.timetable || []);
      } catch (err) {
        console.error('Failed to fetch timetable info', err);
        setError('Failed to load schedule. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchClassInfo();
  }, []);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = daysOfWeek[new Date().getDay()];
  
  // Sort today's classes by start_time
  const todaysClasses = timetable
    .filter(t => t.day === currentDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${minutes} ${ampm}`;
  };

  const getMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

  const getClassStatus = (slot) => {
    const startMins = getMinutes(slot.start_time);
    const endMins = getMinutes(slot.end_time);

    if (currentTotalMinutes >= startMins && currentTotalMinutes < endMins) {
      return 'ongoing';
    } else if (currentTotalMinutes < startMins) {
      return 'upcoming';
    } else {
      return 'completed';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  const ongoingClasses = todaysClasses.filter(c => getClassStatus(c) === 'ongoing');
  const upcomingClasses = todaysClasses.filter(c => getClassStatus(c) === 'upcoming');
  const completedClasses = todaysClasses.filter(c => getClassStatus(c) === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-50 to-primary-100 rounded-bl-full -z-10 opacity-50"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">Today's Schedule</h1>
            <p className="text-gray-500 font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-500" />
              {currentDay}, {now.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-100 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Timeline (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                Class Timeline
              </h3>
              <span className="text-xs text-gray-500 font-medium">{todaysClasses.length} Scheduled classes</span>
            </div>

            <div className="p-6">
              {todaysClasses.length > 0 ? (
                <div className="relative border-l border-gray-100 pl-6 ml-3 space-y-8">
                  {todaysClasses.map((slot, index) => {
                    const status = getClassStatus(slot);
                    
                    return (
                      <div key={index} className="relative">
                        {/* Status Marker Dot */}
                        <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white transition-colors duration-300 ${
                          status === 'ongoing' ? 'border-blue-500 ring-4 ring-blue-100' :
                          status === 'completed' ? 'border-green-500 bg-green-500' :
                          'border-gray-300'
                        }`} />

                        {/* Class Details Card */}
                        <div className={`p-5 rounded-xl border transition-all duration-300 ${
                          status === 'ongoing' 
                            ? 'bg-blue-50/40 border-blue-200 shadow-md shadow-blue-50' 
                            : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div>
                              <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">{slot.course_code}</span>
                              <h4 className="font-bold text-gray-900 text-base">{slot.course_name}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              {status === 'ongoing' && (
                                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 bg-blue-500 text-white rounded-full animate-pulse">
                                  Ongoing
                                </span>
                              )}
                              {status === 'completed' && (
                                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Done
                                </span>
                              )}
                              <span className="text-xs font-bold text-gray-600 bg-gray-100/80 px-2.5 py-1 rounded-lg">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-50 text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                              </div>
                              <span className="font-semibold text-gray-600">{slot.faculty_name}</span>
                            </div>
                            {slot.room_number && (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center">
                                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <span className="font-semibold text-gray-600">Room {slot.room_number}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-10 h-10 text-gray-300" />
                  </div>
                  <h4 className="font-bold text-gray-700 text-lg">No classes today</h4>
                  <p className="text-gray-400 text-sm mt-1">You have no classes scheduled for {currentDay}.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Summary Panels (Right 1 Column) */}
        <div className="space-y-6">
          {/* Status Breakdown Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-gray-900 text-lg">Day's Summary</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/40 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm font-bold text-blue-900">Ongoing Class</span>
                </div>
                <span className="text-base font-black text-blue-600">{ongoingClasses.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/40 border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-bold text-amber-900">Upcoming Classes</span>
                </div>
                <span className="text-base font-black text-amber-600">{upcomingClasses.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-green-50/40 border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-bold text-green-900">Completed Classes</span>
                </div>
                <span className="text-base font-black text-green-600">{completedClasses.length}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
