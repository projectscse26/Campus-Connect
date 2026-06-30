import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, CheckCircle, XCircle, BookOpen, CalendarDays, ClipboardList, GraduationCap, Clock, BarChart2, TrendingUp, Info } from 'lucide-react';

export const CADashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/class-advisor/dashboard')
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading...</div>;
  if (error)   return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;

  const { class_info: ci, present_today, absent_today, total_students } = data;

  const statCards = [
    { label: 'Total',   value: total_students, icon: Users,        bg: 'bg-blue-50',  text: 'text-blue-600' },
    { label: 'Present', value: present_today,  icon: CheckCircle,  bg: 'bg-green-50', text: 'text-green-600' },
    { label: 'Absent',  value: absent_today,   icon: XCircle,      bg: 'bg-red-50',   text: 'text-red-600' },
  ];

  const allLinks = [
    { label: 'Mark Attendance',    path: '/faculty/class-advisor/attendance',         icon: ClipboardList, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
    { label: 'Student List',       path: '/faculty/class-advisor/students',            icon: GraduationCap, bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100' },
    { label: 'Attendance Summary', path: '/faculty/class-advisor/attendance-summary',  icon: BarChart2,     bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100' },
    { label: 'Timetable',          path: '/faculty/class-advisor/timetable',           icon: Clock,         bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
    { label: 'Subjects',           path: '/faculty/class-advisor/subjects',            icon: BookOpen,      bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100' },
    { label: 'Course Progress',    path: '/faculty/class-advisor/progress',            icon: TrendingUp,    bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
    { label: 'Class Info',         path: '/faculty/class-advisor/info',                icon: Info,          bg: 'bg-gray-50',   text: 'text-gray-700',   border: 'border-gray-200' },
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Class banner */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
              {ci.department_code} — Section {ci.section_name}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Year {ci.year} · Sem {ci.semester} · Batch {ci.batch}
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards — 3 columns always */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}>
                <Icon className={`w-5 h-5 ${c.text}`} />
              </div>
              <p className={`text-2xl font-extrabold ${c.text}`}>{c.value}</p>
              <p className="text-xs text-gray-500 font-medium">{c.label}</p>
            </div>
          );
        })}
      </div>

      {/* All nav links as large tappable cards */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Navigate</p>
        <div className="grid grid-cols-2 gap-3">
          {allLinks.map(link => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border ${link.bg} ${link.border} active:scale-95 transition-transform`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${link.text}`} />
                <span className={`text-sm font-bold ${link.text} text-left leading-tight`}>{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
