import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Users, Edit3, Clock, TrendingUp, Award, ChevronRight, GraduationCap, Calendar, Bell, MapPin } from 'lucide-react';
import StudentCourseService from '../student/StudentCourseService';

const KPICard = ({ title, value, icon: Icon, colorClass, bgColorClass, subtitle }) => (
  <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6 flex items-center space-x-5 transition-transform hover:translate-y-[-2px]">
    <div className={`w-14 h-14 rounded-[16px] ${bgColorClass} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-7 h-7 ${colorClass}`} strokeWidth={1.5} />
    </div>
    <div>
      <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <div className="flex items-end gap-2">
        <p className="text-[32px] font-extrabold text-gray-900 leading-none">{value}</p>
        {subtitle && <p className="text-[13px] font-medium text-gray-500 mb-1">{subtitle}</p>}
      </div>
    </div>
  </div>
);

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [courseCount, setCourseCount] = useState(null);
  
  // New State variables
  const [lateEntries, setLateEntries] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [profileData, coursesRes, lateRes, leavesRes, classRes, annRes] = await Promise.allSettled([
          StudentCourseService.getMyProfile(),
          StudentCourseService.getMyCourses(),
          axios.get('/api/late-entry/my-history'),
          axios.get('/api/student-portal/leaves'),
          axios.get('/api/student-portal/my-class'),
          axios.get('/api/announcements?limit=5')
        ]);

        if (profileData.status === 'fulfilled') setProfile(profileData.value);
        if (coursesRes.status === 'fulfilled') setCourseCount(coursesRes.value.length);
        if (lateRes.status === 'fulfilled') setLateEntries(lateRes.value.data);
        if (leavesRes.status === 'fulfilled') setLeaves(leavesRes.value.data);
        if (classRes.status === 'fulfilled') setTimetable(classRes.value.data.timetable || []);
        if (annRes.status === 'fulfilled') setAnnouncements(annRes.value.data);

      } catch (err) {
        console.error("Error fetching dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const studentName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : user?.name || user?.email?.split('@')[0] || 'Student';

  // Derived metrics
  const pendingLeaves = leaves.filter(l => l.status.startsWith('pending')).length;
  const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
  
  // Today's schedule
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = daysOfWeek[new Date().getDay()];
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

  return (
    <div className="space-y-8">
      {/* Welcome Header & Quick Actions */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold text-gray-900 tracking-tight mb-2">
            Welcome back, {studentName}! 👋
          </h1>
          <p className="text-[14px] sm:text-[15px] text-gray-500">
            {profile
              ? `Semester ${profile.current_semester} · ${profile.department?.name || ''} · Batch ${profile.batch}`
              : 'Here is your student portal overview.'}
          </p>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Link
            to="/student/leave"
            className="inline-flex items-center gap-2 text-[14px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-5 py-2.5 rounded-xl transition-all shadow-sm border border-indigo-100/50"
          >
            <Calendar className="w-4 h-4" />
            Apply Leave
          </Link>
          <Link
            to="/student/gatepass"
            className="inline-flex items-center gap-2 text-[14px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-5 py-2.5 rounded-xl transition-all shadow-sm border border-teal-100/50"
          >
            <MapPin className="w-4 h-4" />
            Gate Pass
          </Link>
          <Link
            to="/student/late-entry"
            className="inline-flex items-center gap-2 text-[14px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-5 py-2.5 rounded-xl transition-all shadow-sm border border-rose-100/50"
          >
            <Clock className="w-4 h-4" />
            Late Entry
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        <KPICard
          title="Enrolled Courses"
          value={loading ? '—' : String(courseCount ?? 0)}
          icon={BookOpen}
          colorClass="text-blue-600"
          bgColorClass="bg-blue-50"
        />
        <KPICard
          title="Late Entries"
          value={loading ? '—' : String(lateEntries.length)}
          subtitle="this semester"
          icon={Clock}
          colorClass="text-rose-600"
          bgColorClass="bg-rose-50"
        />
        <KPICard
          title="Pending Leaves"
          value={loading ? '—' : String(pendingLeaves)}
          icon={Calendar}
          colorClass="text-amber-600"
          bgColorClass="bg-amber-50"
        />
        <KPICard
          title="Approved Leaves"
          value={loading ? '—' : String(approvedLeaves)}
          icon={Award}
          colorClass="text-emerald-600"
          bgColorClass="bg-emerald-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Primary) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Schedule */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary-500" />
              <h3 className="text-[16px] font-bold text-gray-900">Today's Schedule</h3>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[1,2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
                </div>
              ) : todaysClasses.length > 0 ? (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {todaysClasses.map((slot, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary-100 text-primary-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border border-gray-100 shadow-sm p-4 rounded-xl group-hover:border-primary-200 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-900 text-sm">{slot.course_name}</span>
                          <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                            {formatTime(slot.start_time)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{slot.course_code}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {slot.faculty_name}</span>
                          {slot.room_number && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {slot.room_number}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">No classes scheduled for today.</p>
                  <p className="text-sm text-gray-400 mt-1">Enjoy your day!</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Secondary) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Student Info Card */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6">
            <h3 className="text-[16px] font-bold text-gray-900 mb-4">Student Info</h3>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-8 bg-gray-100 rounded-lg" />)}
              </div>
            ) : profile ? (
              <div className="space-y-3">
                {[
                  { label: 'Register No.', value: profile.register_number },
                  { label: 'Email', value: profile.college_email },
                  { label: 'Department', value: profile.department?.name },
                  { label: 'Section', value: profile.section || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
                    <span className="text-[13px] font-semibold text-gray-700 text-right truncate max-w-[60%]">{value || '—'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-gray-400">Unable to load profile data.</p>
            )}
          </div>

          {/* Announcements Feed */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
             <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="text-[16px] font-bold text-gray-900">Recent Announcements</h3>
              </div>
            </div>
            <div className="p-2">
              {loading ? (
                <div className="p-4 space-y-4 animate-pulse">
                  {[1,2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
                </div>
              ) : announcements.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {announcements.map(ann => (
                    <div key={ann.id} className="p-4 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{ann.title}</h4>
                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                          {new Date(ann.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{ann.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm">No new announcements.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
