import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Users, Edit3, TrendingUp, Clock, Bell, Calendar, AlertCircle } from 'lucide-react';
import axios from 'axios';

const KPICard = ({ title, value, icon: Icon, colorClass, bgColorClass, loading }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-md animate-fade-in">
    <div className={`w-14 h-14 rounded-xl ${bgColorClass} flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110`}>
      <Icon className={`w-7 h-7 ${colorClass}`} strokeWidth={2} />
    </div>
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
      <p className="text-3xl font-extrabold text-gray-900 leading-none">
        {loading ? (
          <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded"></span>
        ) : (
          <span className="animate-count-up">{value}</span>
        )}
      </p>
    </div>
  </div>
);

export const FacultyDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('/api/faculty/me/dashboard');
        setDashboardData(response.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2 animate-slide-in-left">
            Welcome back, {user?.name || 'Faculty'}! 👋
          </h1>
          <p className="text-sm text-gray-600">
            Here's your academic overview and schedule for today.
          </p>
        </div>
        {!loading && dashboardData?.courses && dashboardData.courses.length > 0 && (
          <div className="flex items-center space-x-3 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm animate-slide-in-right">
            <span className="text-sm font-medium text-gray-600">Course Focus:</span>
            <select 
              className="text-sm font-semibold text-gray-900 outline-none cursor-pointer bg-transparent"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(Number(e.target.value))}
            >
              {dashboardData.courses.map((course, idx) => (
                <option key={course.id} value={idx}>
                  {course.course_code} - {course.course_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Assigned Courses" 
          value={dashboardData?.assigned_courses || 0}
          icon={BookOpen} 
          colorClass="text-blue-600" 
          bgColorClass="bg-blue-50" 
          loading={loading}
        />
        <KPICard 
          title="Total Students" 
          value={dashboardData?.total_students || 0}
          icon={Users} 
          colorClass="text-emerald-600" 
          bgColorClass="bg-emerald-50" 
          loading={loading}
        />
        <KPICard 
          title="Pending Evaluations" 
          value={dashboardData?.pending_evaluations || 0}
          icon={Edit3} 
          colorClass="text-amber-600" 
          bgColorClass="bg-amber-50" 
          loading={loading}
        />
        <KPICard 
          title="Class Performance" 
          value={`${dashboardData?.class_performance || 0}%`}
          icon={TrendingUp} 
          colorClass="text-purple-600" 
          bgColorClass="bg-purple-50" 
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trajectory Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Attendance Trajectory</h3>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Last 7 Days</span>
          </div>
          
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="relative h-64">
              {/* Simple Bar Chart */}
              <div className="h-full flex items-end justify-around gap-2">
                {dashboardData?.attendance_trajectory?.map((day, idx) => {
                  const maxCount = Math.max(...dashboardData.attendance_trajectory.map(d => d.count), 1);
                  const height = (day.count / maxCount) * 100;
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group">
                      <div className="relative w-full flex items-end justify-center h-48">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-600 hover:to-blue-500 animate-grow-up cursor-pointer"
                          style={{ 
                            height: `${height}%`,
                            animationDelay: `${idx * 100}ms`
                          }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {day.count} students
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 font-medium mt-2">{day.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 text-blue-500 mr-2"/> Today's Schedule
            </h3>
            <a href="/faculty/courses" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              View All →
            </a>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 rounded-xl border border-gray-100 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : dashboardData?.today_classes && dashboardData.today_classes.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {dashboardData.today_classes.map((classItem, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md animate-slide-in-right ${
                    classItem.is_current 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                  }`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {classItem.is_current && (
                    <span className="inline-block text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full mb-2 animate-pulse-slow">
                      ● Live Now
                    </span>
                  )}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{classItem.course_name}</p>
                      <p className="text-xs text-gray-500 mt-1">{classItem.course_code}</p>
                      <p className="text-xs text-gray-600 mt-2 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {classItem.start_time} - {classItem.end_time}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {classItem.room} • {classItem.section}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No classes scheduled today</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a 
          href="/faculty/courses"
          className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group"
        >
          <BookOpen className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-gray-900 mb-1">My Courses</h4>
          <p className="text-xs text-gray-600">Manage course content & resources</p>
        </a>
        
        <a 
          href="/faculty/courses"
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group"
        >
          <Edit3 className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-gray-900 mb-1">Grade Book</h4>
          <p className="text-xs text-gray-600">Review & submit evaluations</p>
        </a>
        
        <a 
          href="/faculty/courses"
          className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group"
        >
          <Bell className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-gray-900 mb-1">Announcements</h4>
          <p className="text-xs text-gray-600">Post updates to students</p>
        </a>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes grow-up {
          from {
            height: 0;
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out;
        }
        
        .animate-grow-up {
          animation: grow-up 0.8s ease-out forwards;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};
