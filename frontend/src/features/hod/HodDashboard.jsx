import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, GraduationCap, BookOpen, Layers, Link2 } from 'lucide-react';

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

export const HodDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get('/api/hod/dashboard');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500 font-medium">Failed to load dashboard. Make sure you are assigned as HOD of a department.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-gray-900 tracking-tight mb-2">
            Welcome, HOD! 👋
          </h1>
          <p className="text-[15px] text-gray-500">
            Department of <span className="font-bold text-gray-700">{data.department_name}</span> ({data.department_code}) — Your academic overview.
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-sm font-medium text-gray-500">Department:</span>
          <span className="text-sm font-bold text-gray-900">{data.department_code}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <KPICard title="Faculty" value={data.faculty_count} icon={Users} colorClass="text-blue-600" bgColorClass="bg-blue-50" />
        <KPICard title="Students" value={data.student_count} icon={GraduationCap} colorClass="text-emerald-600" bgColorClass="bg-emerald-50" />
        <KPICard title="Courses" value={data.course_count} icon={BookOpen} colorClass="text-amber-600" bgColorClass="bg-amber-50" />
        <KPICard title="Sections" value={data.section_count} icon={Layers} colorClass="text-purple-600" bgColorClass="bg-purple-50" />
        <KPICard title="Assignments" value={data.assignment_count} icon={Link2} colorClass="text-rose-600" bgColorClass="bg-rose-50" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a href="/hod/sections" className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6 hover:border-purple-200 hover:shadow-md transition-all group">
          <Layers className="w-8 h-8 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-gray-900 text-lg mb-1">Manage Sections</h3>
          <p className="text-sm text-gray-500">Create sections and assign class advisors.</p>
        </a>
        <a href="/hod/assignments" className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6 hover:border-blue-200 hover:shadow-md transition-all group">
          <Link2 className="w-8 h-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-gray-900 text-lg mb-1">Course Assignments</h3>
          <p className="text-sm text-gray-500">Assign faculty to courses and sections.</p>
        </a>
        <a href="/hod/mentors" className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6 hover:border-emerald-200 hover:shadow-md transition-all group">
          <Users className="w-8 h-8 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-gray-900 text-lg mb-1">Mentor Assignments</h3>
          <p className="text-sm text-gray-500">Assign faculty mentors to students.</p>
        </a>
      </div>
    </div>
  );
};
