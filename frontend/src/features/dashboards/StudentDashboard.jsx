import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Users, Clock, Award, ChevronRight, GraduationCap, Calendar, Bell, MapPin, FileText, CheckCircle } from 'lucide-react';
import StudentCourseService from '../student/StudentCourseService';

// Circular Progress Component for Attendance
const CircularProgress = ({ percentage, size = 120, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  const getColor = (pct) => {
    if (pct >= 75) return '#10b981'; // green
    if (pct >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={getColor(percentage)} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-black text-gray-900">{percentage}%</div>
        <div className="text-xs text-gray-500 font-medium">Present</div>
      </div>
    </div>
  );
};

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [courseCount, setCourseCount] = useState(null);
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState({ percentage: 0, present: 0, total: 0 });
  const [lateEntries, setLateEntries] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
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
        
        if (coursesRes.status === 'fulfilled') {
          const courses = coursesRes.value;
          setCourses(courses);
          setCourseCount(courses.length);
          
          if (courses.length > 0) {
            const attendancePromises = courses.map(c => 
              axios.get(`/api/student-portal/courses/${c.id}/attendance`).catch(() => null)
            );
            const attendanceResults = await Promise.all(attendancePromises);
            
            let totalPresent = 0;
            let totalClasses = 0;
            attendanceResults.forEach(res => {
              if (res?.data?.summary) {
                totalPresent += res.data.summary.classes_attended || 0;
                totalClasses += res.data.summary.total_classes || 0;
              }
            });
            
            const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
            setAttendance({ percentage: overallPercentage, present: totalPresent, total: totalClasses });

            if (courses[0]) {
              axios.get(`/api/student-portal/courses/${courses[0].id}/assignments`)
                .then(res => setAssignments(res.data.slice(0, 3)))
                .catch(() => setAssignments([]));
            }
          }
        }
        
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

  const studentName = profile ? `${profile.first_name} ${profile.last_name}` : user?.name || user?.email?.split('@')[0] || 'Student';
  const pendingLeaves = leaves.filter(l => l.status.startsWith('pending')).length;
  const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
  
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = daysOfWeek[new Date().getDay()];
  const todaysClasses = timetable.filter(t => t.day === currentDay).sort((a, b) => a.start_time.localeCompare(b.start_time));

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Card - Slimmer */}
          <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-[20px] shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iLjEiIGN4PSIzMCIgY3k9IjMwIiByPSIxNSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
            
            <div className="relative p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-3 border-white/30 flex items-center justify-center">
                  <span className="text-3xl font-black text-white">{studentName.charAt(0).toUpperCase()}</span>
                </div>
              </div>

              <div className="flex-1 text-white">
                <h2 className="text-xl font-bold mb-1">{studentName}</h2>
                <p className="text-white/80 text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {profile?.department?.code || 'CSE'}
                </p>
              </div>

              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-xs text-white/60 mb-1">Year</div>
                  <div className="text-lg font-bold text-white">{profile?.current_year || '—'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/60 mb-1">Semester</div>
                  <div className="text-lg font-bold text-white">{profile?.current_semester || '—'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/60 mb-1">Section</div>
                  <div className="text-lg font-bold text-white">{profile?.section || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/student/leave" className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm mb-1">Apply Leave</h3>
                  <p className="text-xs text-gray-500">Request time off</p>
                  <div className="mt-2 flex items-center text-xs text-blue-600 font-semibold">
                    <span>Apply now</span>
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/student/gatepass" className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                  <MapPin className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm mb-1">Gate Pass</h3>
                  <p className="text-xs text-gray-500">Request campus exit</p>
                  <div className="mt-2 flex items-center text-xs text-teal-600 font-semibold">
                    <span>Request pass</span>
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/student/late-entry" className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-rose-200 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                  <Clock className="w-6 h-6 text-rose-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm mb-1">Late Entry</h3>
                  <p className="text-xs text-gray-500">Mark late arrival</p>
                  <div className="mt-2 flex items-center text-xs text-rose-600 font-semibold">
                    <span>Mark entry</span>
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
          
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
                <div className="space-y-4">
                  {todaysClasses.map((slot, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 shadow-sm p-4 rounded-xl">
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
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-600 font-semibold">No classes scheduled for today.</p>
                  <p className="text-sm text-gray-400 mt-1">Enjoy your day!</p>
                </div>
              )}
            </div>
          </div>

          {/* Course Progress Tracker */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <h3 className="text-[16px] font-bold text-gray-900">Course Progress</h3>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
                </div>
              ) : courses.length > 0 ? (
                <div className="space-y-4">
                  {courses.slice(0, 4).map((course, idx) => {
                    // Calculate progress based on attendance or random for now
                    const progress = Math.floor(50 + Math.random() * 40); // 50-90% range
                    const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-indigo-600', 'bg-teal-600'];
                    const color = colors[idx % colors.length];
                    
                    return (
                      <div key={course.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-sm">{course.name}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{course.code}</p>
                            {course.faculty_name && (
                              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {course.faculty_name}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-bold text-gray-700">{progress}%</span>
                        </div>
                        
                        <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`absolute left-0 top-0 h-full ${color} rounded-full transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {Math.floor(progress / 10)} of 10 modules
                          </span>
                          <span className={`font-semibold ${progress >= 75 ? 'text-green-600' : progress >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                            {progress >= 75 ? 'On Track' : progress >= 50 ? 'In Progress' : 'Behind'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  <Link 
                    to="/student/courses"
                    className="block text-center text-sm font-semibold text-blue-600 hover:text-blue-700 py-2 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    View All Courses →
                  </Link>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-600 font-semibold">No courses enrolled</p>
                  <p className="text-sm text-gray-400 mt-1">Check back later</p>
                </div>
              )}
            </div>
          </div>

          {/* Next Submission */}
          {!loading && assignments.length > 0 && (
            <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-amber-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <h3 className="text-[16px] font-bold text-gray-900">Next Submission</h3>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">NEW</span>
              </div>
              
              <div className="p-6">
                {assignments.slice(0, 1).map(assignment => (
                  <div key={assignment.id} className="space-y-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg mb-1">{assignment.title}</h4>
                      <p className="text-sm text-gray-500">{assignment.description || 'Complete the assignment and submit on time'}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Due in 2 days</span>
                      <span className="text-xs font-semibold text-gray-600">Progress: 0%</span>
                    </div>
                    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="absolute left-0 top-0 h-full bg-blue-600 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                    <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-200">
                      Submit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Recent Announcements - Moved to Top */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="text-[16px] font-bold text-gray-900">Recent Announcements</h3>
              </div>
              {announcements.length > 0 && (
                <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {announcements.length}
                </span>
              )}
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
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Bell className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No new announcements</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Attendance Card */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6">
            <h3 className="text-[16px] font-bold text-gray-900 mb-5">Academic Standing & Attendance</h3>
            <div className="flex flex-col items-center mb-6">
              <CircularProgress percentage={attendance.percentage} />
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Overall Attendance:</p>
                <p className="text-xs text-gray-400">
                  Status: <span className={`font-bold ${attendance.percentage >= 75 ? 'text-green-600' : 'text-amber-600'}`}>
                    {attendance.percentage >= 75 ? 'On Track' : 'Below Threshold'}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">({attendance.present}/{attendance.total} days)</p>
                {attendance.percentage < 75 && <p className="text-xs text-red-500 mt-1">Current Threshold: 75%</p>}
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Summary Stats</h4>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Enrolled Courses</span>
                <span className="font-bold text-gray-900">{courseCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Late Entries</span>
                <span className="font-bold text-gray-900">{lateEntries.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Pending Leaves</span>
                <span className="font-bold text-gray-900">{pendingLeaves}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Approved Leaves</span>
                <span className="font-bold text-gray-900">{approvedLeaves}</span>
              </div>
            </div>
          </div>
          
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
        </div>
      </div>
    </div>
  );
};
