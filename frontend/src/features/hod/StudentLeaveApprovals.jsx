import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AlertCircle, Loader2, FileText } from 'lucide-react';
import { ApproverLeaveCard } from '../leave/ApproverLeaveCard';

export const StudentLeaveApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [acting, setActing]     = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    axios.get('/api/student-portal/leave/hod-queue')
      .then(r => { setRequests(r.data); setError(null); })
      .catch(e => setError(e.response?.data?.detail || 'Failed to load requests'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, action, remarks) => {
    setActing(id);
    try {
      await axios.put(`/api/student-portal/leave/${id}/hod-action`, null, { params: { action, remarks } });
      load();
      window.dispatchEvent(new Event('refetch-badges'));
    } catch (e) {
      alert(e.response?.data?.detail || 'Action failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h1 className="text-[22px] sm:text-[26px] font-bold text-gray-900 tracking-tight">Student Leave Approvals</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Review and action student leave requests for your department.</p>
      </div>

      {/* Loading */}
      {loading && <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary-400" /></div>}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] font-semibold text-red-700">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && requests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-gray-300" strokeWidth={1.3} />
          </div>
          <p className="text-[14px] font-bold text-gray-600 mb-1">No Pending Requests</p>
          <p className="text-[12px] text-gray-400">No student leave requests are pending HOD approval.</p>
        </div>
      )}

      {/* Cards */}
      {!loading && !error && requests.length > 0 && (
        <>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{requests.length} pending</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {requests.map(r => (
              <ApproverLeaveCard key={r.id} req={r} actionStatus="pending_hod" onAction={handleAction} acting={acting} />
            ))}
          </div>
        </>
      )}

    </div>
  );
};
