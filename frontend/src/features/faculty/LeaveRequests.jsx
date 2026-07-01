import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, Plane, FileText, ArrowRight, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export const LeaveRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/leave/my-requests');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold">APPROVED</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-bold">REJECTED</span>;
      default:
        return <span className="bg-yellow-100 text-yellow-700 px-2.5 py-0.5 rounded-full text-xs font-bold">PENDING</span>;
    }
  };

  const getIcon = (type) => {
    const t = type.toLowerCase();
    if (t.includes('casual')) return <Calendar className="w-5 h-5 text-gray-500" />;
    if (t.includes('sick') || t.includes('medical')) return <FileText className="w-5 h-5 text-gray-500" />;
    if (t.includes('vacation')) return <Plane className="w-5 h-5 text-gray-500" />;
    if (t.includes('duty') || t.includes('permission')) return <Clock className="w-5 h-5 text-gray-500" />;
    return <Calendar className="w-5 h-5 text-gray-500" />;
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return req.status.includes('pending');
    if (filter === 'Approved') return req.status === 'approved';
    if (filter === 'Rejected') return req.status === 'rejected';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage your institutional applications</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Link 
            to="/faculty/leave/substitutes" 
            className="flex-1 sm:flex-none text-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-xl text-sm transition-colors shadow-sm"
          >
            Substitute Approvals
          </Link>
          <Link 
            to="/faculty/leave/apply" 
            className="flex-1 sm:flex-none text-center bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold py-2 px-4 rounded-xl text-sm transition-colors shadow-sm"
          >
            + New Request
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-500 w-full sm:w-auto mb-1 sm:mb-0">Filter by:</span>
          {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f ? 'bg-[#0f172a] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="w-full md:w-64">
          <input 
            type="text" 
            placeholder="Search requests..." 
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map(req => (
            <div 
              key={req.id} 
              onClick={() => navigate(`/faculty/leave/${req.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                  {getIcon(req.leave_type)}
                </div>
                {getStatusBadge(req.status)}
              </div>
              
              <h3 className="font-bold text-gray-900 mb-1">{req.leave_type}</h3>
              <p className="text-sm text-gray-500 mb-6">
                Duration: {req.duration_days} Day{req.duration_days > 1 ? 's' : ''} ({new Date(req.from_date).toLocaleDateString('en-US', {month:'short', day:'numeric'})} - {new Date(req.to_date).toLocaleDateString('en-US', {month:'short', day:'numeric'})})
              </p>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="flex items-center text-xs font-medium text-gray-400">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  Applied {new Date(req.created_at).toLocaleDateString('en-US', {month:'short', day:'numeric'})}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
              </div>
            </div>
          ))}
          {filteredRequests.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 font-medium bg-white rounded-xl border border-gray-200">
              No leave requests found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
