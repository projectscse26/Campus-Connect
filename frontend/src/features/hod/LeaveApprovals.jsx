import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Calendar, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp,
  User, FileText, Loader2, AlertCircle
} from 'lucide-react';

const STATUS_CFG = {
  pending_substitute: { label: 'Awaiting Substitutes', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  pending_hod:        { label: 'Pending HOD',          color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200'  },
  pending_dean:       { label: 'Pending Dean',         color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  pending_om:         { label: 'Pending Principal',    color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200'  },
  approved:           { label: 'Approved',             color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  rejected:           { label: 'Rejected',             color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200'     },
};

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending_hod;
  return (
    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
};

const LeaveCard = ({ req, onAction, acting }) => {
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState('');
  const canAct = req.status === 'pending_hod';
  const cfg = STATUS_CFG[req.status] || STATUS_CFG.pending_hod;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${cfg.border}`}>
      <div className={`h-1 ${cfg.border.replace('border-', 'bg-').replace('-200', '-400')}`} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-gray-900 text-[15px]">{req.faculty_name}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">{req.leave_type}</p>
          </div>
          <StatusBadge status={req.status} />
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2 text-[13px] text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>{fmt(req.from_date)}</span>
          <span className="text-gray-300">→</span>
          <span>{fmt(req.to_date)}</span>
          <span className="ml-auto text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {req.duration_days} day{req.duration_days !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Reason */}
        <p className="text-[13px] text-gray-600 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
          {req.reason || 'No reason provided.'}
        </p>

        {/* Arrangements toggle */}
        {req.arrangements && req.arrangements.length > 0 && (
          <button
            onClick={() => setExpanded(p => !p)}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-primary-600 hover:text-primary-800 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {req.arrangements.length} Substitute Arrangement{req.arrangements.length !== 1 ? 's' : ''}
          </button>
        )}

        {expanded && (
          <div className="space-y-2">
            {req.arrangements.map(arr => (
              <div key={arr.id} className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2 text-[12px]">
                <User className="w-3.5 h-3.5 text-gray-400 mt-px flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-800">{arr.substitute_faculty_name}</span>
                  <span className="text-gray-500 ml-1.5">— {arr.subject} · {arr.class_section} · {arr.period}</span>
                  <span className={`ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                    arr.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                    arr.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{arr.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rejection reason */}
        {req.rejection_reason && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-px" />
            <p className="text-[12px] text-red-600 font-medium">{req.rejection_reason}</p>
          </div>
        )}

        {/* Action area */}
        {canAct && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <input
              type="text"
              placeholder="Remarks / reason for rejection (optional)"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAction(req.id, 'approve', reason)}
                disabled={acting === req.id}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[13px] font-bold py-2.5 rounded-xl transition-all disabled:opacity-60"
              >
                {acting === req.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CheckCircle className="w-4 h-4" />}
                Approve
              </button>
              <button
                onClick={() => onAction(req.id, 'reject', reason)}
                disabled={acting === req.id}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-[13px] font-bold py-2.5 rounded-xl transition-all disabled:opacity-60"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const LeaveApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [filter, setFilter] = useState('pending_hod');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/leave/requests');
      setRequests(res.data);
    } catch (err) {
      setError('Failed to load leave requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, reason) => {
    setActing(id);
    try {
      await axios.put(`/api/leave/requests/${id}/approve`, null, {
        params: { action, reason },
      });
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.detail || 'Action failed.');
    } finally {
      setActing(null);
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending_hod').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Faculty Leave Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve faculty leave requests for your department
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 font-bold text-sm px-3 py-1.5 rounded-full">
            <Clock className="w-4 h-4" />
            {pendingCount} Pending
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'pending_hod', label: 'Awaiting My Approval' },
          { key: 'pending_dean', label: 'Forwarded to Dean' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'all', label: 'All' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filter === key
                ? 'bg-[#0f172a] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
            {key === 'pending_hod' && pendingCount > 0 && (
              <span className="ml-1.5 bg-violet-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No requests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(req => (
            <LeaveCard key={req.id} req={req} onAction={handleAction} acting={acting} />
          ))}
        </div>
      )}
    </div>
  );
};
