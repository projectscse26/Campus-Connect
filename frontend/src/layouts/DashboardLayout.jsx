import React, { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, BookOpen, GraduationCap, Settings, LogOut, Bell, Search, Moon, Home, Calendar, ShieldAlert, Clock, Menu, X
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
  ],
  faculty: [
    { name: 'Dashboard', path: '/faculty', icon: LayoutDashboard },
    { name: 'My Courses', path: '/faculty/courses', icon: BookOpen },
    { name: 'Leave Requests', path: '/faculty/leave', icon: Calendar },
    { name: 'Attendance', path: '/faculty/attendance', icon: Users },
    { name: 'Report Incident', path: '/faculty/discipline', icon: ShieldAlert },
  ],
  student: [
    { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
    { name: 'My Courses', path: '/student/courses', icon: BookOpen },
    { name: 'Leave Tracker', path: '/student/leave', icon: Settings },
    { name: 'Discipline', path: '/student/discipline', icon: ShieldAlert },
  ],
  authority: [
    { name: 'Dashboard', path: '/authority', icon: LayoutDashboard },
    { name: 'Analytics', path: '/authority/analytics', icon: BookOpen },
    { name: 'Discipline', path: '/authority/discipline', icon: ShieldAlert },
    { name: 'Late Tracker', path: '/authority/latetracker', icon: Clock },
  ]
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const navLinks = ROLE_NAV_LINKS[user.role] || [];
  const currentLink = navLinks.find(link => link.path === location.pathname);
  const pageName = currentLink ? currentLink.name : 'Dashboard';

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
            return (
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
          })}
        </nav>
        
        <div className="p-4 mt-auto border-t border-gray-100">
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
            <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            
            <div className="flex items-center pl-6 border-l border-gray-200 cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className="text-[14px] font-bold text-gray-900 leading-tight">
                  {user.name || user.email.split('@')[0]}
                </p>
                <p className="text-[12px] text-gray-500 font-medium capitalize">{user.role}</p>
              </div>
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
