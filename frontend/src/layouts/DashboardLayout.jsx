import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, BookOpen, GraduationCap, Settings, LogOut, Bell, Search, Moon, Home, Calendar, ShieldAlert, Clock, Menu, X, ChevronDown, ChevronRight, ClipboardList, BarChart2, TrendingUp, Info, User, Shield, Award
} from 'lucide-react';

const ROLE_NAV_LINKS = {
  admin: [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Departments', path: '/admin/departments', icon: Settings },
    { name: 'Faculty', path: '/admin/faculty', icon: Users },
    { name: 'Students', path: '/admin/students', icon: GraduationCap },
    { name: 'Authorities', path: '/admin/authorities', icon: Home },
    { name: 'Courses', path: '/admin/courses', icon: BookOpen },
    { name: 'Discipline', path: '/admin/discipline', icon: ShieldAlert },
    { name: 'Late Tracker', path: '/admin/latetracker', icon: Clock },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: Shield },
    { name: 'Announcements', path: '/admin/announcements', icon: Bell },
  ],
  hod: [
    { name: 'Dashboard', path: '/hod', icon: LayoutDashboard },
    { name: 'Faculty', path: '/hod/faculty', icon: Users },
    { name: 'Students', path: '/hod/students', icon: GraduationCap },
    { name: 'Sections', path: '/hod/sections', icon: Settings },
    { name: 'Timetable', path: '/hod/timetable', icon: Calendar },
    { name: 'Course Assignment', path: '/hod/assignments', icon: BookOpen },
    { name: 'Mentor Assignment', path: '/hod/mentors', icon: Users },
    { name: 'Attendance', path: '/hod/attendance', icon: Search },
    { name: 'Results', path: '/hod/results', icon: Search },
    { name: 'Announcements', path: '/hod/announcements', icon: Bell },
    { name: 'Reports', path: '/hod/reports', icon: Home },
    { name: 'Leave Approvals', path: '/hod/leave', icon: Calendar },
    { name: 'Discipline', path: '/hod/discipline', icon: ShieldAlert },
    { name: 'Late Tracker', path: '/hod/latetracker', icon: Clock },
    { name: 'Gate Pass Approvals', path: '/hod/gatepass', icon: Clock },
  ],
  faculty: [
    { name: 'Dashboard', path: '/faculty', icon: LayoutDashboard },
    { name: 'My Courses', path: '/faculty/courses', icon: BookOpen },
    { name: 'Leave Requests', path: '/faculty/leave', icon: Calendar },
    { name: 'Mentorship', path: '/faculty/mentorship', icon: GraduationCap },
    { name: 'Report Incident', path: '/faculty/discipline', icon: ShieldAlert },
    { name: 'Gate Pass Approvals', path: '/faculty/gatepass', icon: Clock },
    { name: 'Late Entry Notifications', path: '/faculty/late-entry', icon: Bell },
    { name: 'Announcements', path: '/faculty/announcements', icon: Bell },
  ],
  student: [
    { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
    { name: 'My Courses', path: '/student/courses', icon: BookOpen },
    { name: 'My Marks', path: '/student/marks', icon: Award },
    { name: 'Leave Tracker', path: '/student/leave', icon: Calendar },
    { name: 'Gate Pass', path: '/student/gatepass', icon: Clock },
    { name: 'Late Entry Notification', path: '/student/late-entry', icon: Bell },
    { name: 'Announcements', path: '/student/announcements', icon: Bell },
  ],
  authority: [
    { name: 'Dashboard', path: '/authority', icon: LayoutDashboard },
    { name: 'Analytics', path: '/authority/analytics', icon: BookOpen },
    { name: 'Discipline', path: '/authority/discipline', icon: ShieldAlert },
    { name: 'Late Tracker', path: '/authority/latetracker', icon: Clock },
    { name: 'Gate Pass Approvals', path: '/authority/gatepass', icon: Clock },
    { name: 'Announcements', path: '/authority/announcements', icon: Bell },
  ]
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCAOpen, setIsCAOpen] = useState(location.pathname.startsWith('/faculty/class-advisor'));
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync visibility with open state for animation
  useEffect(() => {
    if (isUserMenuOpen) {
      setUserMenuVisible(true);
    } else {
      const t = setTimeout(() => setUserMenuVisible(false), 150);
      return () => clearTimeout(t);
    }
  }, [isUserMenuOpen]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/announcements?limit=10');
      setNotifications(res.data);
      const lastRead = localStorage.getItem(`last_read_announcement_${user.id}`);
      if (res.data.length > 0) {
        const newestTime = new Date(res.data[0].created_at).getTime();
        setHasUnread(!lastRead || newestTime > parseInt(lastRead, 10));
      } else {
        setHasUnread(false);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setIsNotificationsOpen(prev => !prev);
    if (!isNotificationsOpen && notifications.length > 0) {
      const newestTime = new Date(notifications[0].created_at).getTime();
      localStorage.setItem(`last_read_announcement_${user.id}`, newestTime.toString());
      setHasUnread(false);
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  const navLinks = ROLE_NAV_LINKS[user.role] || [];
  const currentLink = navLinks.find(link => link.path === location.pathname);

  // For Class Advisor sub-pages, find a label
  const CA_SUB_LABELS = {
    '/faculty/class-advisor': 'Class Advisor',
    '/faculty/class-advisor/students': 'Student List',
    '/faculty/class-advisor/attendance': 'Daily Attendance',
    '/faculty/class-advisor/attendance-summary': 'Attendance Summary',
    '/faculty/class-advisor/timetable': 'Class Timetable',
    '/faculty/class-advisor/subjects': 'Class Subjects',
    '/faculty/class-advisor/progress': 'Course Progress',
    '/faculty/class-advisor/info': 'Class Information',
    '/faculty/class-advisor/leave': 'Leave Requests',
  };
  const caLabel = CA_SUB_LABELS[location.pathname];
  const pageName = currentLink ? currentLink.name : (caLabel || 'Dashboard');

  const CA_SUB_LINKS = [
    { name: 'Dashboard',          path: '/faculty/class-advisor',                    icon: LayoutDashboard },
    { name: 'Student List',       path: '/faculty/class-advisor/students',            icon: GraduationCap },
    { name: 'Daily Attendance',   path: '/faculty/class-advisor/attendance',          icon: ClipboardList },
    { name: 'Attendance Summary', path: '/faculty/class-advisor/attendance-summary',  icon: BarChart2 },
    { name: 'Class Timetable',    path: '/faculty/class-advisor/timetable',           icon: Calendar },
    { name: 'Class Subjects',     path: '/faculty/class-advisor/subjects',            icon: BookOpen },
    { name: 'Course Progress',    path: '/faculty/class-advisor/progress',            icon: TrendingUp },
    { name: 'Class Information',  path: '/faculty/class-advisor/info',                icon: Info },
    { name: 'Leave Requests',     path: '/faculty/class-advisor/leave',               icon: Calendar },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans w-full relative">
      
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden transition-opacity backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 w-[260px] bg-white border-r border-gray-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex-shrink-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="h-20 flex flex-col justify-center px-6 border-b border-gray-100 relative">
          <div className="text-primary-600 font-extrabold text-2xl tracking-tight flex items-center">
            <span className="text-3xl mr-1.5">^</span>CampusConnect
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 ml-1.5">
            {user.role} Portal
          </p>
          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 lg:hidden text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            const renderLink = (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600 font-bold' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                <span className="text-[15px]">{link.name}</span>
              </Link>
            );

            if (link.name === 'Dashboard' && user.role === 'faculty' && user.is_class_advisor) {
              return (
                <React.Fragment key={link.name}>
                  {renderLink}
                  <div>
                    <button
                      onClick={() => setIsCAOpen(prev => !prev)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium ${
                        location.pathname.startsWith('/faculty/class-advisor')
                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <GraduationCap className={`w-5 h-5 ${location.pathname.startsWith('/faculty/class-advisor') ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <span className="text-[15px]">Class Advisor</span>
                      </div>
                      {isCAOpen
                        ? <ChevronDown className="w-4 h-4 text-gray-400" />
                        : <ChevronRight className="w-4 h-4 text-gray-400" />
                      }
                    </button>

                    {isCAOpen && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-indigo-100 pl-3">
                        {CA_SUB_LINKS.map(sublink => {
                          const SubIcon = sublink.icon;
                          const isSubActive = location.pathname === sublink.path;
                          return (
                            <Link
                              key={sublink.path}
                              to={sublink.path}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-all text-[14px] ${
                                isSubActive
                                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium'
                              }`}
                            >
                              <SubIcon className={`w-4 h-4 ${isSubActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                              <span>{sublink.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            }

            return renderLink;
          })}
        </nav>
        
        <div className="p-4 mt-auto border-t border-gray-100">
          <button
            onClick={() => { setIsMobileMenuOpen(false); navigate(`/${user.role}/profile`); }}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold transition-colors mb-1"
          >
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-[15px]">Profile</span>
          </button>
          <button 
            onClick={logout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-bold transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[15px]">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-[72px] bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 z-10 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button 
              className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center text-gray-700 font-bold text-[14px] bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
              <Home className="w-4 h-4 mr-2 text-gray-400" />
              {pageName}
            </div>
            
            <div className="ml-4 sm:ml-8 relative hidden md:block w-48 lg:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search pages, courses..."
                className="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-[14px] font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-gray-50 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <Moon className="w-5 h-5" />
            </button>
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={handleBellClick}
                className="relative text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-xl hover:bg-gray-50 focus:outline-none"
              >
                <Bell className="w-5 h-5" />
                {hasUnread && (
                  <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
                )}
              </button>
              
              {isNotificationsOpen && (
                <div className="fixed inset-x-2 sm:absolute sm:inset-x-auto sm:right-0 mt-3 sm:w-96 max-w-md bg-white rounded-[20px] shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-100 z-50 overflow-hidden transform sm:origin-top-right transition-all">
                  <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">Notifications</h3>
                    <span className="text-[9px] sm:text-[10px] bg-primary-50 text-primary-600 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
                      Announcements
                    </span>
                  </div>
                  
                  <div className="max-h-[50vh] sm:max-h-[300px] overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="p-6 sm:p-8 text-center text-gray-400">
                        <Bell className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-xs font-semibold">No announcements posted</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const categoryColors = {
                          Urgent: "bg-red-50 text-red-600 border-red-100",
                          Event: "bg-purple-50 text-purple-600 border-purple-100",
                          Academic: "bg-blue-50 text-blue-600 border-blue-100",
                          General: "bg-gray-50 text-gray-600 border-gray-100"
                        };
                        const badgeClass = categoryColors[notif.category] || categoryColors.General;
                        
                        return (
                          <div 
                            key={notif.id}
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              navigate(`/${user.role}/announcements?id=${notif.id}`);
                            }}
                            className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors text-left"
                          >
                            <div className="flex justify-between items-start mb-1 gap-2">
                              <span className="font-bold text-gray-900 text-xs line-clamp-1 flex-1 leading-snug">
                                {notif.title}
                              </span>
                              <span className={`text-[9px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded border ${badgeClass} shrink-0`}>
                                {notif.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-2">
                              {notif.content}
                            </p>
                            <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                              <span className="truncate">By {notif.author?.name || "System"}</span>
                              <span className="ml-2 whitespace-nowrap">{new Date(notif.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  <div className="p-2.5 sm:p-3 bg-gray-50/50 border-t border-gray-50 text-center">
                    <button 
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        navigate(`/${user.role}/announcements`);
                      }}
                      className="text-[11px] text-primary-600 hover:text-primary-700 font-bold transition-colors"
                    >
                      View All Announcements
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative flex items-center pl-6 border-l border-gray-200" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="flex items-center gap-3 cursor-pointer group focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[14px] font-bold text-gray-900 leading-tight">
                    {user.name || user.email.split('@')[0]}
                  </p>
                  <p className="text-[12px] text-gray-500 font-medium capitalize">{user.role}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 hidden sm:block transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {userMenuVisible && (
                <div
                  className={`absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 transition-all duration-150 origin-top-right ${
                    isUserMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1'
                  }`}
                >
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{user.email}</p>
                    <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={() => { setIsUserMenuOpen(false); navigate(`/${user.role}/profile`); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors rounded-xl"
                  >
                    <User className="w-4 h-4 text-gray-400" /> Profile
                  </button>
                  <button
                    onClick={() => { setIsUserMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors rounded-xl"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
          <div className="max-w-[1200px] mx-auto pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
