import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Users, Edit3, Clock, TrendingUp, Award, ChevronRight, GraduationCap } from 'lucide-react';
import StudentCourseService from '../student/StudentCourseService';

const KPICard = ({ title, value, icon: Icon, colorClass, bgColorClass }) => (
  <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6 flex items-center space-x-5 transition-transform hover:translate-y-[-2px]">
    <div className={`w-14 h-14 rounded-[16px] ${bgColorClass} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-7 h-7 ${colorClass}`} strokeWidth={1.5} />
    </div>
    <div>
      <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-[32px] font-extrabold text-gray-900 leading-none">{value}</p>
    </div>
  </div>
);

// Simplified placeholders for the other dashboards for now, using the same design language
const SimpleDashboard = ({ title, role }) => {
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-gray-900 tracking-tight mb-2">
            Welcome back, {user?.name || role}! 👋
          </h1>
          <p className="text-[15px] text-gray-500">
            Here is your {role.toLowerCase()} overview for today.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Records" value="1,240" icon={BookOpen} colorClass="text-blue-600" bgColorClass="bg-blue-50" />
        <KPICard title="Active Users" value="842" icon={Users} colorClass="text-emerald-600" bgColorClass="bg-emerald-50" />
        <KPICard title="Pending Tasks" value="12" icon={Edit3} colorClass="text-amber-600" bgColorClass="bg-amber-50" />
        <KPICard title="System Status" value="99%" icon={TrendingUp} colorClass="text-purple-600" bgColorClass="bg-purple-50" />
      </div>
    </div>
  );
};

export { AdminDashboard } from './AdminDashboard';
export { HodDashboard } from '../hod/HodDashboard';
export { FacultyDashboard } from './FacultyDashboardNew';
export const AuthorityDashboard = () => <SimpleDashboard title="Higher Authority Portal" role="Authority" />;

export { StudentDashboard } from './StudentDashboard';
