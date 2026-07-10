import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, UserCheck, Building2, BookOpen,
  TrendingUp, TrendingDown, AlertCircle, Clock,
  FileText, ShieldAlert, RefreshCw, ChevronRight,
  BarChart3, PieChart, Activity
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass, subtitle }) => (
  <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6 transition-all hover:shadow-lg">
    <div className="flex items-center gap-4">
      <div className={`w-14 h-14 rounded-[16px] ${bgColorClass} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-7 h-7 ${colorClass}`} strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-[28px] font-extrabold text-gray-900 leading-none">{value}</p>
        {subtitle && (
          <p className="text-[10px] text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  </div>
);

// Department Performance Card
const DepartmentCard = ({ name, code, value, type = "attendance", rank }) => {
  const isGood = value >= 75;
  const isAverage = value >= 60 && value < 75;
  
  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      isGood ? 'bg-emerald-50 border-emerald-200' : 
      isAverage ? 'bg-amber-50 border-amber-200' : 
      'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400">#{rank}</span>
          <h4 className="font-bold text-sm text-gray-900">{code}</h4>
        </div>
        <div className={`flex items-center gap-1 ${
          isGood ? 'text-emerald-600' : 
          isAverage ? 'text-amber-600' : 
          'text-red-600'
        }`}>
          {isGood ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="text-lg font-extrabold">{value}%</span>
        </div>
      </div>
      <p className="text-xs text-gray-600 truncate">{name}</p>
      <div className="mt-2 bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div 
          className={`h-full transition-all ${
            isGood ? 'bg-emerald-500' : 
            isAverage ? 'bg-amber-500' : 
            'bg-red-500'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

// Alert Item Component
const AlertItem = ({ alert }) => {
  const getIcon = () => {
    switch(alert.type) {
      case 'discipline': return <ShieldAlert className="w-4 h-4" />;
      case 'gatepass': return <FileText className="w-4 h-4" />;
      case 'leave': return <FileText className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };
  
  const getColor = () => {
    switch(alert.severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };
  
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${getColor()}`}>
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900">{alert.message}</p>
        <p className="text-xs text-gray-600 mt-0.5">
          {alert.student_name || alert.faculty_name}
        </p>
      </div>
      <span className="text-[10px] text-gray-500 whitespace-nowrap">
        {formatTime(alert.timestamp)}
      </span>
    </div>
  );
};

const DeanDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/dean/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setStats(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    
    // Auto-refresh every 30 seconds for live updates
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchDashboardStats(true);
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 text-sm">Unable to load dashboard data</h4>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight mb-1 capitalize">
            Dean Dashboard 🎓
          </h1>
          <p className="text-[14px] text-gray-500">
            Real-time overview of campus operations • View-only access
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(lastUpdated)}</span>
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-semibold">Refresh</span>
          </button>
        </div>
      </div>

      {/* 1. TOP NUMBERS (Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Students" 
          value={stats?.total_students?.toLocaleString() || '0'} 
          icon={Users} 
          colorClass="text-blue-600" 
          bgColorClass="bg-blue-50"
          subtitle="Enrolled & Active"
        />
        <StatCard 
          title="Total Faculty" 
          value={stats?.total_faculty?.toLocaleString() || '0'} 
          icon={UserCheck} 
          colorClass="text-emerald-600" 
          bgColorClass="bg-emerald-50"
          subtitle="Teaching Staff"
        />
        <StatCard 
          title="Departments" 
          value={stats?.total_departments || '0'} 
          icon={Building2} 
          colorClass="text-purple-600" 
          bgColorClass="bg-purple-50"
          subtitle="Academic Units"
        />
        <StatCard 
          title="Active Courses" 
          value={stats?.active_courses || '0'} 
          icon={BookOpen} 
          colorClass="text-amber-600" 
          bgColorClass="bg-amber-50"
          subtitle="This Semester"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Attendance & Performance */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 2. ATTENDANCE OVERVIEW */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-blue-50 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">Attendance Overview</h3>
                  <p className="text-[11px] text-gray-500">Real-time attendance tracking</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">Overall</p>
                <p className="text-[24px] font-extrabold text-blue-600">
                  {stats?.overall_attendance_percent || 0}%
                </p>
              </div>
            </div>
            
            {/* Department Attendance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats?.attendance_by_department?.sort((a, b) => b.attendance_percent - a.attendance_percent).map((dept, idx) => (
                <DepartmentCard 
                  key={dept.department_code}
                  name={dept.department_name}
                  code={dept.department_code}
                  value={dept.attendance_percent}
                  type="attendance"
                  rank={idx + 1}
                />
              ))}
            </div>
          </div>

          {/* 3. ACADEMIC PERFORMANCE */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-emerald-50 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">Academic Performance</h3>
                  <p className="text-[11px] text-gray-500">Pass percentage by department</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">Overall</p>
                <p className="text-[24px] font-extrabold text-emerald-600">
                  {stats?.overall_pass_percent || 0}%
                </p>
              </div>
            </div>
            
            {/* Department Performance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats?.performance_by_department?.sort((a, b) => b.pass_percent - a.pass_percent).map((dept, idx) => (
                <DepartmentCard 
                  key={dept.department_code}
                  name={dept.department_name}
                  code={dept.department_code}
                  value={dept.pass_percent}
                  type="performance"
                  rank={idx + 1}
                />
              ))}
            </div>
          </div>

        </div>

        {/* Right Column - Pending Requests & Alerts */}
        <div className="space-y-6">
          
          {/* 4. PENDING REQUESTS (WITHOUT GATE PASSES) */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-[12px] bg-amber-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-gray-900">Pending Requests</h3>
                <p className="text-[11px] text-gray-500">Awaiting approval</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <div>
                  <p className="text-xs font-semibold text-gray-600">Leave Requests</p>
                  <p className="text-2xl font-extrabold text-amber-700 mt-1">
                    {stats?.pending_faculty_leaves || 0}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-amber-400" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200">
                <div>
                  <p className="text-xs font-semibold text-gray-600">Complaints</p>
                  <p className="text-2xl font-extrabold text-red-700 mt-1">
                    {stats?.pending_complaints || 0}
                  </p>
                </div>
                <ShieldAlert className="w-8 h-8 text-red-400" />
              </div>
              
              {/* Gate Passes section REMOVED for Principal */}
            </div>
          </div>

          {/* 5. RECENT ALERTS */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">Recent Alerts</h3>
                  <p className="text-[11px] text-gray-500">Live updates</p>
                </div>
              </div>
              <span className="flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                {stats?.recent_alerts?.length || 0}
              </span>
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {stats?.recent_alerts && stats.recent_alerts.length > 0 ? (
                stats.recent_alerts.map((alert, idx) => (
                  <AlertItem key={idx} alert={alert} />
                ))
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No recent alerts</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* View-Only Notice */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center gap-3">
          <PieChart className="w-5 h-5 text-blue-600" />
          <p className="text-sm text-gray-700">
            <span className="font-semibold">View-Only Access:</span> This dashboard provides real-time monitoring. 
            All data updates automatically every 30 seconds.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeanDashboard;
