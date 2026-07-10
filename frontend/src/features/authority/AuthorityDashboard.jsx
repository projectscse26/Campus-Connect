import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen, Users, Edit3, TrendingUp, 
  ShieldAlert, FileText, UserCheck, Building2,
  RefreshCw, Clock
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const KPICard = ({ title, value, icon: Icon, colorClass, bgColorClass, subtitle }) => (
  <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6 flex items-center space-x-5 transition-transform hover:translate-y-[-2px]">
    <div className={`w-14 h-14 rounded-[16px] ${bgColorClass} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-7 h-7 ${colorClass}`} strokeWidth={1.5} />
    </div>
    <div className="flex-1">
      <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-[32px] font-extrabold text-gray-900 leading-none">{value}</p>
      {subtitle && (
        <p className="text-[11px] text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  </div>
);

const AuthorityDashboard = () => {
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
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/authority/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setStats(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to load dashboard data');
      
      // Set mock data if API fails
      setStats({
        total_students: 0,
        total_faculty: 0,
        active_users: 0,
        total_departments: 0,
        pending_tasks: 0,
        pending_gate_passes: 0,
        pending_faculty_leaves: 0,
        recent_discipline_incidents: 0,
        today_discipline_count: 0,
        system_status_percent: 99
      });
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    
    // Auto-refresh every 30 seconds
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
    <div className="space-y-8">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 text-sm">Unable to load dashboard data</h4>
            <p className="text-xs text-red-700 mt-1">{error}</p>
            <p className="text-xs text-red-600 mt-2">Make sure the backend server is running and accessible.</p>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-gray-900 tracking-tight mb-2">
            Welcome back, Authority! 👋
          </h1>
          <p className="text-[15px] text-gray-500">
            Here is your authority overview for today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Updated: {formatTime(lastUpdated)}</span>
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-semibold">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Students" 
          value={stats?.total_students?.toLocaleString() || '0'} 
          icon={Users} 
          colorClass="text-blue-600" 
          bgColorClass="bg-blue-50"
          subtitle="Active students"
        />
        <KPICard 
          title="Total Faculty" 
          value={stats?.total_faculty?.toLocaleString() || '0'} 
          icon={UserCheck} 
          colorClass="text-emerald-600" 
          bgColorClass="bg-emerald-50"
          subtitle="Active faculty members"
        />
        <KPICard 
          title="Pending Tasks" 
          value={stats?.pending_tasks || '0'} 
          icon={Edit3} 
          colorClass="text-amber-600" 
          bgColorClass="bg-amber-50"
          subtitle="Requires your attention"
        />
        <KPICard 
          title="System Status" 
          value={`${stats?.system_status_percent || 99}%`} 
          icon={TrendingUp} 
          colorClass="text-purple-600" 
          bgColorClass="bg-purple-50"
          subtitle="Uptime"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Active Users" 
          value={stats?.active_users?.toLocaleString() || '0'} 
          icon={Users} 
          colorClass="text-indigo-600" 
          bgColorClass="bg-indigo-50"
          subtitle="System-wide"
        />
        <KPICard 
          title="Departments" 
          value={stats?.total_departments || '0'} 
          icon={Building2} 
          colorClass="text-teal-600" 
          bgColorClass="bg-teal-50"
          subtitle="Academic departments"
        />
        <KPICard 
          title="Gate Passes" 
          value={stats?.pending_gate_passes || '0'} 
          icon={FileText} 
          colorClass="text-orange-600" 
          bgColorClass="bg-orange-50"
          subtitle="Awaiting approval"
        />
        <KPICard 
          title="Faculty Leaves" 
          value={stats?.pending_faculty_leaves || '0'} 
          icon={FileText} 
          colorClass="text-rose-600" 
          bgColorClass="bg-rose-50"
          subtitle="Pending approval"
        />
      </div>

      {/* Discipline Overview */}
      <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-[14px] bg-red-50 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-600" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-[18px] font-bold text-gray-900">Discipline Overview</h3>
            <p className="text-[13px] text-gray-500">Recent incidents and reports</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 border border-red-100">
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Today's Incidents
            </p>
            <p className="text-[40px] font-extrabold text-red-600 leading-none">
              {stats?.today_discipline_count || '0'}
            </p>
            <p className="text-[11px] text-gray-600 mt-2">Recorded today</p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-100">
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Last 7 Days
            </p>
            <p className="text-[40px] font-extrabold text-amber-600 leading-none">
              {stats?.recent_discipline_incidents || '0'}
            </p>
            <p className="text-[11px] text-gray-600 mt-2">Total incidents</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-primary-100 p-8">
        <h3 className="text-[18px] font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-white hover:bg-gray-50 text-left p-5 rounded-xl border border-gray-200 transition-all hover:shadow-md">
            <FileText className="w-6 h-6 text-primary-600 mb-2" />
            <p className="font-semibold text-gray-900 text-sm">Review Gate Passes</p>
            <p className="text-xs text-gray-500 mt-1">{stats?.pending_gate_passes || 0} pending</p>
          </button>
          
          <button className="bg-white hover:bg-gray-50 text-left p-5 rounded-xl border border-gray-200 transition-all hover:shadow-md">
            <ShieldAlert className="w-6 h-6 text-red-600 mb-2" />
            <p className="font-semibold text-gray-900 text-sm">View Discipline Records</p>
            <p className="text-xs text-gray-500 mt-1">{stats?.recent_discipline_incidents || 0} recent</p>
          </button>
          
          <button className="bg-white hover:bg-gray-50 text-left p-5 rounded-xl border border-gray-200 transition-all hover:shadow-md">
            <BookOpen className="w-6 h-6 text-emerald-600 mb-2" />
            <p className="font-semibold text-gray-900 text-sm">Analytics</p>
            <p className="text-xs text-gray-500 mt-1">View detailed reports</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthorityDashboard;
