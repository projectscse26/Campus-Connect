import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LateAnalytics } from '../../components/LateAnalytics';
import { Clock, Search, Filter, Calendar } from 'lucide-react';
import axios from 'axios';

export const LateManagement = () => {
  const { role } = useAuth();
  const [records, setRecords] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date filtering state
  const [dateRangeType, setDateRangeType] = useState('This Week'); // Today, This Week, This Month, Custom
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let urlParams = '';
      if (startDate && endDate) {
        urlParams = `?start_date=${startDate}&end_date=${endDate}`;
      }
      const [recordsRes, analyticsRes] = await Promise.all([
        axios.get(`/api/late${urlParams}`),
        axios.get(`/api/late/analytics${urlParams}`)
      ]);
      setRecords(recordsRes.data);
      setAnalytics(analyticsRes.data);
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
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Analytics Dashboard */}
          {analytics && (
            <LateAnalytics data={analytics} />
          )}

          {/* Records Table */}
          <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-gray-900 text-lg">Recent Late Records</h3>
              <div className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                {filteredRecords.length} records found
              </div>
            </div>
            
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
                        No late records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
