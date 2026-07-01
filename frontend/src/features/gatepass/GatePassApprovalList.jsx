import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader, CheckCircle, XCircle, Clock } from 'lucide-react';
import { GatePassTracker } from './GatePassTracker';

export const GatePassApprovalList = ({ roleTitle, apiEndpoint }) => {
  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchGatePasses();
  }, [apiEndpoint]);

  const fetchGatePasses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiEndpoint);
      setGatePasses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    if (action === 'reject' && !rejectingId) {
      setRejectingId(id);
      return;
    }
    
    try {
      const payload = {
        status: action,
        rejection_reason: action === 'reject' ? rejectReason : null
      };
      
      await axios.put(`/api/gatepass/${id}/approve`, payload);
      setRejectingId(null);
      setRejectReason('');
      fetchGatePasses();
    } catch (err) {
      console.error(err);
      alert('Action failed');
    }
  };

  const formatDateTime = (dtStr) => {
    if (!dtStr) return '-';
    return new Date(dtStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  const isExpired = (gp) => {
    if (!gp.expected_in_time) return false;
    const inTime = new Date(gp.expected_in_time).getTime();
    const now = Date.now();
    return now > inTime;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{roleTitle} Gate Pass Approvals</h1>
        <p className="text-gray-500">Review and manage pending gate pass requests.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : gatePasses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-500 text-lg">No pending approvals at the moment.</h3>
        </div>
      ) : (
        <div className="space-y-6">
          {gatePasses.map(gp => {
            const expired = isExpired(gp);
            return (
            <div key={gp.id} className={`bg-white rounded-xl shadow-sm border ${expired ? 'border-red-200' : 'border-gray-200'} overflow-hidden relative`}>
              {expired && <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10 uppercase tracking-wider">Expired</div>}
              
              <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    {gp.student?.first_name} {gp.student?.last_name} 
                    <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                      {gp.student?.register_number}
                    </span>
                  </h3>
                  <p className="text-gray-700 mt-2 font-medium">Reason: {gp.reason}</p>
                  <div className="text-sm text-gray-500 mt-2 flex flex-wrap gap-4">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> Out: {formatDateTime(gp.out_time)}</span>
                    {gp.expected_in_time && <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> Expected In: {formatDateTime(gp.expected_in_time)}</span>}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0 w-full md:w-auto justify-start md:justify-end">
                  {expired ? (
                    <span className="text-red-500 font-bold bg-red-50 px-4 py-2 rounded-lg border border-red-100 text-sm w-full md:w-auto text-center">
                      Request Expired - No Approval Needed
                    </span>
                  ) : rejectingId === gp.id ? (
                    <div className="flex flex-col gap-2 w-full md:min-w-[250px]">
                      <input 
                        type="text" 
                        placeholder="Reason for rejection"
                        className="w-full text-sm px-3 py-2 border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2 w-full">
                        <button 
                          onClick={() => setRejectingId(null)}
                          className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium"
                        >Cancel</button>
                        <button 
                          onClick={() => handleAction(gp.id, 'reject')}
                          className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                        >Confirm</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleAction(gp.id, 'reject')}
                        className="flex-1 md:flex-none justify-center flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition font-medium"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                      <button 
                        onClick={() => handleAction(gp.id, 'approve')}
                        className="flex-1 md:flex-none justify-center flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => setExpandedId(expandedId === gp.id ? null : gp.id)}
                    className="w-full md:w-auto text-gray-500 hover:text-blue-600 transition underline text-sm text-center md:text-left mt-1 md:mt-0 md:ml-2"
                  >
                    {expandedId === gp.id ? 'Hide Tracking' : 'View Tracking'}
                  </button>
                </div>
              </div>
              {expandedId === gp.id && !expired && (
                <GatePassTracker 
                  status={gp.status} 
                  rejectionReason={gp.rejection_reason} 
                  approvers={{mentor: gp.mentor, hod: gp.hod, om: gp.om}} 
                />
              )}
            </div>
          )})}
        </div>
      )}
    </div>
  );
};
