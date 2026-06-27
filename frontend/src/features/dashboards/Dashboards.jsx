import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Users, Edit3, Clock, TrendingUp } from 'lucide-react';

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

export const FacultyDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      {/* Welcome Header area matching screenshot */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-gray-900 tracking-tight mb-2">
            Welcome back, Prof. {user?.name || 'John Smith'}! 👋
          </h1>
          <p className="text-[15px] text-gray-500">
            Here is your academic overview, schedule, and engagement insights today.
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-sm font-medium text-gray-500">Analytics Focus:</span>
          <select className="text-sm font-semibold text-gray-800 outline-none cursor-pointer bg-transparent">
            <option>CS601 - Data Structures & Algorithms</option>
            <option>CS602 - Database Systems</option>
          </select>
        </div>
      </div>

      {/* KPI Cards exactly like screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Assigned Courses" 
          value="1" 
          icon={BookOpen} 
          colorClass="text-blue-600" 
          bgColorClass="bg-blue-50" 
        />
        <KPICard 
          title="Total Students" 
          value="10" 
          icon={Users} 
          colorClass="text-emerald-600" 
          bgColorClass="bg-emerald-50" 
        />
        <KPICard 
          title="Pending Evaluations" 
          value="4" 
          icon={Edit3} 
          colorClass="text-amber-600" 
          bgColorClass="bg-amber-50" 
        />
        <KPICard 
          title="Class Performance" 
          value="82%" 
          icon={Clock} 
          colorClass="text-purple-600" 
          bgColorClass="bg-purple-50" 
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-8 min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Attendance Trajectory — Data Structures & Algorithms</h3>
          {/* Fake chart using SVG to match screenshot look roughly */}
          <div className="relative h-64 w-full flex items-end border-b border-l border-gray-200 pb-2 pl-2">
             <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M 0,30 Q 15,40 30,30 T 60,40 T 80,60 T 100,45" fill="none" stroke="#3b82f6" strokeWidth="2" />
                <circle cx="0" cy="30" r="1.5" fill="#3b82f6" />
                <circle cx="15" cy="35" r="1.5" fill="#3b82f6" />
                <circle cx="30" cy="30" r="1.5" fill="#3b82f6" />
                <circle cx="45" cy="25" r="1.5" fill="#3b82f6" />
                <circle cx="60" cy="40" r="1.5" fill="#3b82f6" />
                <circle cx="80" cy="60" r="1.5" fill="#3b82f6" />
                <circle cx="100" cy="45" r="1.5" fill="#3b82f6" />
             </svg>
             <div className="absolute bottom-[-25px] left-0 w-full flex justify-between text-[11px] text-gray-400 font-medium">
               <span>May 17</span><span>May 18</span><span>May 19</span><span>May 20</span><span>May 21</span><span>May 22</span><span>May 23</span><span>May 24</span><span>May 25</span><span>May 26</span>
             </div>
             <div className="absolute left-[-20px] top-0 h-full flex flex-col justify-between text-[11px] text-gray-400 font-medium">
               <span>12</span><span>9</span><span>6</span><span>3</span><span>0</span>
             </div>
          </div>
        </div>

        {/* Timetable Area */}
        <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center"><Clock className="w-5 h-5 text-red-400 mr-2"/> Class Timetable Slots</h3>
            <a href="#" className="text-sm font-semibold text-primary-600 hover:text-primary-700">View Timetable</a>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-gray-100 flex space-x-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="text-primary-600 font-bold text-sm w-10">MON</div>
              <div>
                <p className="font-bold text-gray-900 text-[15px]">Data Structures</p>
                <p className="text-[13px] text-gray-500 mt-1 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1" /> 09:00 - 10:30 <span className="mx-2">•</span> Room 202
                </p>
              </div>
            </div>
            
            <div className="p-4 rounded-xl border border-gray-100 flex space-x-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="text-blue-500 font-bold text-sm w-10">WED</div>
              <div>
                <p className="font-bold text-gray-900 text-[15px]">DBMS Lab</p>
                <p className="text-[13px] text-gray-500 mt-1 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1" /> 11:00 - 12:30 <span className="mx-2">•</span> Lab 4
                </p>
              </div>
            </div>
            
            <div className="p-4 rounded-xl border border-gray-100 flex space-x-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="text-purple-500 font-bold text-sm w-10">FRI</div>
              <div>
                <p className="font-bold text-gray-900 text-[15px]">Data Structures</p>
                <p className="text-[13px] text-gray-500 mt-1 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1" /> 14:00 - 15:30 <span className="mx-2">•</span> Room 101
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
export const StudentDashboard = () => <SimpleDashboard title="Student Portal" role="Student" />;
export const AuthorityDashboard = () => <SimpleDashboard title="Higher Authority Portal" role="Authority" />;
