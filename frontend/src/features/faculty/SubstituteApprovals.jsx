import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

export const SubstituteApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/leave/substitute-requests');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (arr_id, status) => {
    setActionLoading(arr_id);
    try {
      await axios.put(`/api/leave/substitute-requests/${arr_id}?status=${status}`);
      // Refresh list
      fetchRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-6">
        <Link to="/faculty/leave" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Requests
        </Link>
        <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">Substitute Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Accept or decline class substitution requests from other faculty members.</p>
      </div>

      <div className="space-y-4">
        {requests.map(req => (
          <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">{req.leave_type}</span>
                <span className="text-sm text-gray-500 font-medium"><Calendar className="w-4 h-4 inline mr-1" />{new Date(req.from_date).toLocaleDateString()} to {new Date(req.to_date).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{req.faculty_name}</h3>
              
              <div className="mt-4 space-y-3">
                {req.arrangements.map(arr => (
                  <div key={arr.id} className="bg-[#f8fbfd] border border-blue-100 rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Subject & Class</p>
                      <p className="text-sm font-bold text-gray-800">{arr.subject} — {arr.class_section}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center"><Clock className="w-3.5 h-3.5 mr-1"/> Period: {arr.period}</p>
                    </div>
                    {arr.status === 'pending' ? (
                      <div className="flex space-x-2 w-full sm:w-auto">
                        <button 
                          onClick={() => handleAction(arr.id, 'accepted')}
                          disabled={actionLoading === arr.id}
                          className="flex-1 sm:flex-none justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 sm:py-1.5 px-3 rounded-lg text-sm sm:text-xs transition-colors flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5 mr-1" /> Accept
                        </button>
                        <button 
                          onClick={() => handleAction(arr.id, 'rejected')}
                          disabled={actionLoading === arr.id}
                          className="flex-1 sm:flex-none justify-center bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 sm:py-1.5 px-3 rounded-lg text-sm sm:text-xs transition-colors flex items-center border border-red-200"
                        >
                          <XCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5 mr-1" /> Decline
                        </button>
                      </div>
                    ) : arr.status === 'accepted' ? (
                      <span className="text-green-600 font-bold text-sm flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Accepted</span>
                    ) : (
                      <span className="text-red-600 font-bold text-sm flex items-center"><XCircle className="w-4 h-4 mr-1" /> Declined</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Requests</h3>
            <p className="text-gray-500">You have no pending substitution requests at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};
