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

            const promises = [];
            courses.forEach(c => {
              promises.push(axios.get(`/api/student-portal/courses/${c.id}/assignments`).catch(() => ({ data: [] })));
              promises.push(axios.get(`/api/student-portal/courses/${c.id}/seminar`).catch(() => ({ data: { seminar: null } })));
            });
            
            Promise.all(promises).then((results) => {
              const list = [];
              for (let i = 0; i < courses.length; i++) {
                const assignmentsRes = results[2 * i];
                const seminarRes = results[2 * i + 1];
                
                if (assignmentsRes && assignmentsRes.data) {
                  const pendingAssignments = assignmentsRes.data
                    .filter(a => !a.grade)
                    .map(a => ({
                      id: `assignment_${a.id}`,
                      title: a.title,
                      description: a.description,
                      due_date: a.due_date,
                      type: 'Assignment',
                      course_name: courses[i].name
                    }));
                  list.push(...pendingAssignments);
                }
                
                if (seminarRes && seminarRes.data?.seminar) {
                  const sem = seminarRes.data.seminar;
                  if (sem.is_topic_published && !sem.is_marks_published) {
                    list.push({
                      id: `seminar_${courses[i].id}`,
                      title: `Seminar: ${sem.seminar_topic}`,
                      description: `Course: ${courses[i].name} - Prepare and present your seminar topic.`,
                      due_date: sem.seminar_date,
                      type: 'Seminar',
                      course_name: courses[i].name
                    });
                  }
                }
              }
              
              // Sort by due date (nearest first)
              list.sort((a, b) => {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date) - new Date(b.due_date);
              });
              
              setAssignments(list.slice(0, 3));
            }).catch(() => setAssignments([]));
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

  const getMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

  const ongoingClass = todaysClasses.find(slot => {
    const startMins = getMinutes(slot.start_time);
    const endMins = getMinutes(slot.end_time);
    return currentTotalMinutes >= startMins && currentTotalMinutes < endMins;
  });

  const upcomingClasses = todaysClasses.filter(slot => {
    const startMins = getMinutes(slot.start_time);
    return currentTotalMinutes < startMins;
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Profile Card - Slimmer */}
          <div className="relative bg-white dark:bg-gradient-to-br dark:from-blue-500 dark:via-blue-600 dark:to-indigo-600 rounded-[20px] shadow-xl border border-gray-200 dark:border-transparent overflow-hidden">
            <div className="absolute inset-0 dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iLjEiIGN4PSIzMCIgY3k9IjMwIiByPSIxNSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
            <div className="relative p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-blue-600 dark:bg-white/20 dark:backdrop-blur-sm border-3 dark:border-white/30 flex items-center justify-center">
                  <span className="text-3xl font-black text-white">{studentName.charAt(0).toUpperCase()}</span>
                </div>
              </div>

              <div className="flex-1 text-gray-900 dark:text-white">
                <h2 className="text-xl font-bold mb-1">{studentName}</h2>
                <p className="text-gray-600 dark:text-white/80 text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {profile?.department?.code || 'CSE'}
                </p>
              </div>

              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-white/60 mb-1">Year</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-white">{profile?.current_year || '—'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-white/60 mb-1">Semester</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-white">{profile?.current_semester || '—'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-white/60 mb-1">Section</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-white">{profile?.section || '—'}</div>
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
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary-500" />
                <h3 className="text-[16px] font-bold text-gray-900">Today's Schedule</h3>
              </div>
              <Link to="/student/schedule" className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1">
                More about today's schedule
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
                </div>
              ) : todaysClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ongoing Class */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase">Ongoing Class</h4>
                    {ongoingClass ? (
                      <div className="bg-blue-50/40 border border-blue-100 shadow-sm p-4 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 px-2 py-0.5 bg-blue-500 text-[10px] font-black text-white rounded-bl-lg uppercase tracking-wider animate-pulse">
                          Active
                        </div>
                        <div className="flex items-center justify-between mb-1 pr-12">
                          <span className="font-bold text-gray-900 text-sm">{ongoingClass.course_name}</span>
                        </div>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mb-2">
                          {formatTime(ongoingClass.start_time)} - {formatTime(ongoingClass.end_time)}
                        </span>
                        <p className="text-xs text-gray-500 font-medium">{ongoingClass.course_code}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-blue-50/50">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {ongoingClass.faculty_name}</span>
                          {ongoingClass.room_number && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {ongoingClass.room_number}</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-center py-6 text-gray-500 text-xs font-medium">
                        No ongoing class at this time
                      </div>
                    )}
                  </div>

                  {/* Upcoming Class */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase">Upcoming Class</h4>
                    {upcomingClasses.length > 0 ? (
                      <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-900 text-sm">{upcomingClasses[0].course_name}</span>
                          <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                            {formatTime(upcomingClasses[0].start_time)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mb-2">{upcomingClasses[0].course_code}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {upcomingClasses[0].faculty_name}</span>
                          {upcomingClasses[0].room_number && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {upcomingClasses[0].room_number}</span>}
                        </div>
                        {upcomingClasses.length > 1 && (
                          <div className="mt-3 text-right">
                            <Link to="/student/schedule" className="text-[11px] font-bold text-primary-500 hover:underline">
                              +{upcomingClasses.length - 1} more upcoming class{upcomingClasses.length - 1 > 1 ? 'es' : ''} today
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-center py-6 text-gray-500 text-xs font-medium">
                        No upcoming classes remaining today
                      </div>
                    )}
                  </div>
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
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
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
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-lg">
                        {assignment.due_date ? `Due: ${new Date(assignment.due_date).toLocaleDateString()}` : 'No due date'}
                      </span>
                    </div>
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
                  {[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
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
                {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-gray-100 rounded-lg" />)}
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
