import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, Mail, User, BookOpen, Clock, Loader2, MapPin } from 'lucide-react';

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

  // Group timetable by day
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const scheduleByDay = {};
  
  daysOfWeek.forEach(day => {
    scheduleByDay[day] = timetable.filter(slot => slot.day === day).sort((a, b) => {
      return a.start_time.localeCompare(b.start_time);
    });
  });

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${minutes} ${ampm}`;
  };

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
            
            <div className="divide-y divide-gray-100">
              {daysOfWeek.map(day => {
                const daySlots = scheduleByDay[day];
                if (!daySlots || daySlots.length === 0) return null;
                
                return (
                  <div key={day} className="p-6">
                    <h3 className="text-md font-bold text-gray-900 mb-4">{day}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {daySlots.map(slot => (
                        <div key={slot.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-primary-200 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 leading-tight mb-1">{slot.course_name}</h4>
                          <p className="text-xs text-gray-500 font-medium mb-3">{slot.course_code}</p>
                          
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="truncate max-w-[120px]">{slot.faculty_name}</span>
                            </div>
                            {slot.room_number && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                                <MapPin className="w-3 h-3" />
                                {slot.room_number}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {timetable.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No timetable is available for this section yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
