import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LateAnalytics } from '../../components/LateAnalytics';
import { Clock, Search, Filter, Calendar, Bell, Info, CheckCircle2, AlertCircle, User, TrendingUp } from 'lucide-react';
import axios from 'axios';

export const LateManagement = () => {
  const { role, user } = useAuth();
  const [records, setRecords] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' or 'records'
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date filtering state
  const [dateRangeType, setDateRangeType] = useState('Today'); // Changed default to Today
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      let urlParams = '';
      if (startDate && endDate) {
        urlParams = `?start_date=${startDate}&end_date=${endDate}`;
      }
      
      // Fetch both late records and late entry notifications
      const [recordsRes, analyticsRes, notificationsRes] = await Promise.all([
        axios.get(`/api/late${urlParams}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/late/analytics${urlParams}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/late/notifications?date_filter=${startDate}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setRecords(recordsRes.data);
      setAnalytics(analyticsRes.data);
      setNotifications(notificationsRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load late tracker data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const handleQuickSelect = (type) => {
    setDateRangeType(type);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (type === 'Today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === 'This Week') {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 6);
      setStartDate(weekAgo.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (type === 'This Month') {
      const monthAgo = new Date();
      monthAgo.setDate(today.getDate() - 30);
      setStartDate(monthAgo.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  const filteredRecords = records.filter(r => {
    const searchMatch = !searchTerm || 
      (r.student_name && r.student_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.student_register_number && r.student_register_number.toLowerCase().includes(searchTerm.toLowerCase()));
    return searchMatch;
  });

  const filteredNotifications = notifications.filter(n => {
    const searchMatch = !searchTerm || 
      (n.student_name && n.student_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (n.student_register_number && n.student_register_number.toLowerCase().includes(searchTerm.toLowerCase()));
    return searchMatch;
  });

  // Calculate stats
  const totalNotifications = notifications.length;
  const informedCount = notifications.filter(n => n.acknowledged_by_security).length;
  const pendingCount = notifications.filter(n => !n.acknowledged_by_security).length;
  const totalLateRecords = records.length;

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Late Tracker</h1>
          <p className="text-gray-500 font-medium mt-1">Monitor student punctuality and trends</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          {/* Date Range Picker */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full md:w-auto">
            <button 
              onClick={() => handleQuickSelect('Today')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${dateRangeType === 'Today' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Today
            </button>
            <button 
              onClick={() => handleQuickSelect('This Week')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${dateRangeType === 'This Week' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              This Week
            </button>
            <button 
              onClick={() => handleQuickSelect('This Month')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${dateRangeType === 'This Month' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              This Month
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1"></div>
            <div className="flex items-center space-x-2 px-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => { setDateRangeType('Custom'); setStartDate(e.target.value); }}
                className="text-xs font-semibold text-gray-600 bg-transparent outline-none cursor-pointer"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => { setDateRangeType('Custom'); setEndDate(e.target.value); }}
                className="text-xs font-semibold text-gray-600 bg-transparent outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="relative flex-1 md:w-64 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center bg-white rounded-[24px] text-gray-500 font-bold shadow-sm border border-gray-100">Loading data...</div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-[24px] text-red-500 font-bold shadow-sm border border-red-100">{error}</div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Bell className="w-8 h-8 text-blue-600" />
                <span className="text-3xl font-extrabold text-blue-900">{totalNotifications}</span>
              </div>
              <div className="text-sm font-bold text-blue-700">Pre-Informed</div>
              <div className="text-xs text-blue-600 mt-1">Students who notified</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <span className="text-3xl font-extrabold text-green-900">{informedCount}</span>
              </div>
              <div className="text-sm font-bold text-green-700">Arrived</div>
              <div className="text-xs text-green-600 mt-1">Confirmed arrivals</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-5 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
                <span className="text-3xl font-extrabold text-yellow-900">{pendingCount}</span>
              </div>
              <div className="text-sm font-bold text-yellow-700">Pending</div>
              <div className="text-xs text-yellow-600 mt-1">Not yet arrived</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <span className="text-3xl font-extrabold text-purple-900">{totalLateRecords}</span>
              </div>
              <div className="text-sm font-bold text-purple-700">Late Records</div>
              <div className="text-xs text-purple-600 mt-1">Total recorded</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Bell className="w-4 h-4" />
                  Late Entry Notifications ({totalNotifications})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('records')}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-colors ${
                  activeTab === 'records'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Late Records ({totalLateRecords})
                </div>
              </button>
            </div>

            {/* Notifications Tab Content */}
            {activeTab === 'notifications' && (
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-lg">Late Entry Notifications Timeline</h3>
                  <span className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    {filteredNotifications.length} notifications
                  </span>
                </div>

                {filteredNotifications.length > 0 ? (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          {/* Student Info */}
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base uppercase shadow-md">
                              {notification.student_name?.[0] || 'S'}
                            </div>
                            <div className="flex-1">
                              <div className="text-base font-bold text-gray-900">
                                {notification.student_name}
                              </div>
                              <div className="text-sm font-semibold text-gray-600">
                                {notification.student_register_number}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {notification.section_name && `Section ${notification.section_name}`}
                              </div>
                            </div>
                          </div>

                          {/* Timeline Info */}
                          <div className="flex flex-col md:flex-row gap-3">
                            {/* Submission Time */}
                            <div className="bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                              <div className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-0.5">
                                Submitted
                              </div>
                              <div className="text-sm font-bold text-purple-900">
                                {new Date(notification.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </div>
                            </div>

                            {/* Expected Arrival */}
                            <div className="bg-orange-50 rounded-lg px-3 py-2 border border-orange-100">
                              <div className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-0.5">
                                Expected At
                              </div>
                              <div className="text-sm font-bold text-orange-900 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(`2000-01-01T${notification.expected_arrival_time}`).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </div>
                            </div>

                            {/* Mentor Info */}
                            {notification.mentor_name && (
                              <div className="bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-100">
                                <div className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-0.5">
                                  Mentor
                                </div>
                                <div className="text-sm font-bold text-indigo-900">
                                  {notification.mentor_name}
                                </div>
                              </div>
                            )}

                            {/* Status */}
                            <div className="flex items-center">
                              {notification.acknowledged_by_security ? (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  Arrived
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 whitespace-nowrap">
                                  <Clock className="w-3.5 h-3.5 mr-1" />
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        {notification.reason && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-start gap-2">
                              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Reason: </span>
                                <span className="text-sm text-gray-700">{notification.reason}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 font-semibold bg-gray-50/30 rounded-xl">
                    No late entry notifications found for selected date
                  </div>
                )}
              </div>
            )}

            {/* Records Tab Content */}
            {activeTab === 'records' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Action Taken</th>
                      <th className="px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{record.date}</div>
                          <div className="text-xs font-bold text-gray-500 flex items-center mt-0.5">
                            <Clock className="w-3 h-3 mr-1" /> {record.time}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{record.student_name}</div>
                          <div className="text-xs font-semibold text-gray-500">{record.student_register_number}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                            record.action_status === 'Letter Given' ? 'bg-red-50 text-red-600 border-red-100' :
                            record.action_status === 'Informed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-gray-50 text-gray-600 border-gray-100'
                          }`}>
                            {record.action_status || 'Not Informed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-bold text-gray-700">{record.reporter_name}</div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-semibold bg-gray-50/30">
                          No late records found for selected date range
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Analytics Dashboard */}
          {analytics && activeTab === 'records' && (
            <LateAnalytics data={analytics} />
          )}
        </div>
      )}
    </div>
  );
};
