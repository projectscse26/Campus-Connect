import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, CheckCircle, XCircle, FileText, Calendar, AlertCircle, Check, X, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuthorityFacultyGatePass() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('queue'); // queue or tracking
  const [requests, setRequests] = useState([]);
  const [trackingList, setTrackingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentReq, setCurrentReq] = useState(null);

  const title = user?.title?.toLowerCase().trim();
  const isDean = title === 'dean';
  const isOM = title === 'office manager';

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchQueue();
    } else {
      fetchTracking();
    }
  }, [activeTab]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = isDean ? '/api/faculty-gatepass/dean-queue' : '/api/faculty-gatepass/om-queue';
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching authority gate pass queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTracking = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/faculty-gatepass/tracking', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrackingList(res.data);
    } catch (err) {
      console.error('Error fetching tracking list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status, reason = null) => {
    setActioningId(id);
    try {
      const token = localStorage.getItem('token');
      const endpoint = isDean 
        ? `/api/faculty-gatepass/${id}/dean-approve` 
        : `/api/faculty-gatepass/${id}/om-approve`;

      await axios.put(endpoint, {
        status,
        rejection_reason: reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchQueue();
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      console.error(err);
      alert('Failed to process request.');
    } finally {
      setActioningId(null);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending_hod': return 'text-orange-600 bg-orange-100';
      case 'pending_dean': return 'text-yellow-600 bg-yellow-100';
      case 'pending_om': return 'text-blue-600 bg-blue-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending_hod': return 'Pending HOD';
      case 'pending_dean': return 'Pending Dean';
      case 'pending_om': return 'Pending OM';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  const renderCard = (req, isQueueView = false) => (
    <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-hidden relative">
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {req.faculty?.first_name} {req.faculty?.last_name} <span className="text-sm font-normal text-gray-500">({req.faculty?.employee_id})</span>
          </h3>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-1">{req.faculty?.department?.name}</p>
          <p className="text-gray-700 dark:text-gray-300 mt-1 font-medium">Reason: {req.reason}</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> Out: {new Date(req.out_time).toLocaleString()}</span>
            {req.expected_in_time && (
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> Exp In: {new Date(req.expected_in_time).toLocaleString()}</span>
            )}
          </div>
        </div>
        
        {/* Actions or Status */}
        {isQueueView ? (
          <div className="flex space-x-2">
            <button
              onClick={() => handleAction(req.id, 'approve')}
              disabled={actioningId === req.id}
              className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4 mr-1" /> Approve
            </button>
            <button
              onClick={() => { setCurrentReq(req); setShowRejectModal(true); }}
              disabled={actioningId === req.id}
              className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4 mr-1" /> Reject
            </button>
          </div>
        ) : (
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(req.status)} border-current`}>
            {getStatusLabel(req.status)}
          </span>
        )}
      </div>

      {/* Professional Tracking Timeline */}
      <div className="relative pt-4 opacity-70">
        <div className="absolute top-8 left-6 w-[calc(100%-3rem)] h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
        
        <div className="flex justify-between relative z-10">
          
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${req.hod_approved_at ? 'bg-green-500 text-white' : req.status === 'rejected' && req.status.includes('hod') ? 'bg-red-500 text-white' : req.status === 'pending_hod' ? 'bg-orange-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
              {req.hod_approved_at ? <CheckCircle className="w-5 h-5"/> : req.status === 'rejected' && req.status.includes('hod') ? <XCircle className="w-5 h-5"/> : <Clock className="w-4 h-4"/>}
            </div>
            <span className="mt-2 text-xs font-medium text-gray-900 dark:text-white">HOD</span>
          </div>

          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${req.dean_approved_at ? 'bg-green-500 text-white' : req.status === 'rejected' && req.status.includes('dean') ? 'bg-red-500 text-white' : req.status === 'pending_dean' ? 'bg-yellow-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
              {req.dean_approved_at ? <CheckCircle className="w-5 h-5"/> : req.status === 'rejected' && req.status.includes('dean') ? <XCircle className="w-5 h-5"/> : <Clock className="w-4 h-4"/>}
            </div>
            <span className="mt-2 text-xs font-medium text-gray-900 dark:text-white">Dean</span>
          </div>

          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${req.om_approved_at ? 'bg-green-500 text-white' : req.status === 'rejected' && req.status.includes('om') ? 'bg-red-500 text-white' : req.status === 'pending_om' ? 'bg-blue-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
              {req.om_approved_at ? <CheckCircle className="w-5 h-5"/> : req.status === 'rejected' && req.status.includes('om') ? <XCircle className="w-5 h-5"/> : <Clock className="w-4 h-4"/>}
            </div>
            <span className="mt-2 text-xs font-medium text-gray-900 dark:text-white">OM</span>
          </div>

        </div>
      </div>

    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Faculty Gate Pass Approvals</h1>
        <p className="text-gray-500 dark:text-gray-400">Review and track faculty gate pass requests</p>
      </div>

      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'queue' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          My Queue
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'tracking' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Global Tracking
        </button>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        ) : activeTab === 'queue' ? (
          requests.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No pending requests for your approval</p>
            </div>
          ) : (
            requests.map(req => renderCard(req, true))
          )
        ) : (
          trackingList.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No gate pass requests found in the system</p>
            </div>
          ) : (
            trackingList.map(req => renderCard(req, false))
          )
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && currentReq && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Reject Gate Pass</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-shadow"
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(currentReq.id, 'reject', rejectReason)}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
