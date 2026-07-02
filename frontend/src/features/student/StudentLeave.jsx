import React, { useState, useEffect } from 'react';
import {
  CalendarDays, Plus, Loader2, AlertCircle, CheckCircle2,
  XCircle, Clock, ChevronRight, Trash2, X, FileText, ClipboardCheck,
} from 'lucide-react';
import StudentLeaveService from './StudentLeaveService';

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending_mentor:        { label: 'Pending Mentor',   shortLabel: 'Mentor',   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-400',   Icon: Clock        },
  pending_class_advisor: { label: 'Pending Advisor',  shortLabel: 'Advisor',  color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-blue-400',    Icon: Clock        },
  pending_hod:           { label: 'Pending HOD',      shortLabel: 'HOD',      color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200',  dot: 'bg-violet-400',  Icon: Clock        },
  approved:              { label: 'Approved',         shortLabel: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', Icon: CheckCircle2 },
  rejected:              { label: 'Rejected',         shortLabel: 'Rejected', color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-500',     Icon: XCircle      },
  withdrawn:             { label: 'Withdrawn',        shortLabel: 'Withdrawn',color: 'text-gray-500',    bg: 'bg-gray-50',    border: 'border-gray-200',    dot: 'bg-gray-400',    Icon: XCircle      },
};

const APPROVAL_STAGES = [
  { key: 'mentor',        label: 'Mentor'  },
  { key: 'class_advisor', label: 'Advisor' },
  { key: 'hod',           label: 'HOD'     },
];

const isPending = (s) => ['pending_class_advisor', 'pending_mentor', 'pending_hod'].includes(s);
const fmtDate   = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const todayStr  = () => new Date().toISOString().split('T')[0];

// ─────────────────────────────────────────────────────────
// APPROVAL TRACKER
// ─────────────────────────────────────────────────────────

const ApprovalTracker = ({ leave }) => {
  const getState = (stage) => {
    const actioned = leave[`${stage}_actioned_at`];
    if (!actioned) return 'pending';
    if (leave.status === 'rejected') {
      if (stage === 'hod' && leave.hod_actioned_at) return 'rejected';
      if (stage === 'class_advisor' && leave.class_advisor_actioned_at && !leave.hod_actioned_at) return 'rejected';
      if (stage === 'mentor' && leave.mentor_actioned_at && !leave.class_advisor_actioned_at && !leave.hod_actioned_at) return 'rejected';
    }
    return 'approved';
  };

  return (
    <div className="flex items-center gap-1 mt-3">
      {APPROVAL_STAGES.map((stage, idx) => {
        const state = getState(stage.key);
        return (
          <React.Fragment key={stage.key}>
            <div className="flex flex-col items-center gap-0.5 min-w-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                state === 'approved' ? 'bg-emerald-100 border-emerald-400' :
                state === 'rejected' ? 'bg-red-100 border-red-400' :
                                       'bg-gray-100 border-gray-300'
              }`}>
                {state === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
               : state === 'rejected' ? <XCircle      className="w-3.5 h-3.5 text-red-500" />
               :                        <Clock        className="w-3.5 h-3.5 text-gray-400" />}
              </div>
              <span className="text-[9px] font-bold text-gray-400 leading-tight">{stage.label}</span>
            </div>
            {idx < APPROVAL_STAGES.length - 1 && (
              <div className={`flex-1 h-0.5 mb-3.5 rounded ${state === 'approved' ? 'bg-emerald-300' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// LEAVE CARD
// ─────────────────────────────────────────────────────────

const LeaveCard = ({ leave, onWithdraw }) => {
  const cfg = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending_mentor;
  const { Icon } = cfg;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${cfg.border}`}>
      <div className={`h-1 ${cfg.dot}`} />
      <div className="p-4">
        {/* Status badge + reason */}
        <div className="flex items-start gap-2 mb-2">
          <p className="flex-1 text-[13px] text-gray-700 font-medium leading-snug line-clamp-2 min-w-0">
            {leave.reason}
          </p>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            <Icon className="w-3 h-3" />
            {cfg.shortLabel}
          </span>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium mb-1">
          <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{fmtDate(leave.from_date)}</span>
          <span>→</span>
          <span>{fmtDate(leave.to_date)}</span>
          <span className="ml-auto font-bold bg-gray-100 px-1.5 py-0.5 rounded-full text-[10px]">
            {leave.duration_days}d
          </span>
        </div>

        {/* Rejection */}
        {leave.rejection_reason && (
          <div className="mt-2 flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-xl px-2.5 py-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-600 font-medium">{leave.rejection_reason}</p>
          </div>
        )}

        {/* Tracker */}
        <ApprovalTracker leave={leave} />

        {/* Withdraw */}
        {isPending(leave.status) && (
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => onWithdraw(leave.id)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Withdraw
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// APPLY MODAL  — full-screen sheet on mobile
// ─────────────────────────────────────────────────────────

const ApplyModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ from_date: '', to_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const days = form.from_date && form.to_date && form.to_date >= form.from_date
    ? Math.round((new Date(form.to_date) - new Date(form.from_date)) / 86400000) + 1
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.to_date < form.from_date) { setError('End date must be on or after start date.'); return; }
    setSubmitting(true);
    try {
      await StudentLeaveService.applyLeave(form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Bottom sheet on mobile, centered card on sm+ */}
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col">

        {/* Handle bar (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900 leading-tight">Apply for Leave</h2>
              <p className="text-[11px] text-gray-400">Fill in your leave details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">From</label>
              <input type="date" min={todayStr()} required value={form.from_date}
                onChange={e => setForm({ ...form, from_date: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">To</label>
              <input type="date" min={form.from_date || todayStr()} required value={form.to_date}
                onChange={e => setForm({ ...form, to_date: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
            </div>
          </div>

          {/* Duration badge */}
          {days && (
            <div className="flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-xl px-3 py-2">
              <CalendarDays className="w-4 h-4 text-primary-500 flex-shrink-0" />
              <span className="text-[12px] font-bold text-primary-700">{days} {days === 1 ? 'day' : 'days'} of leave</span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Reason</label>
            <textarea required rows={4} placeholder="Briefly explain the reason for your leave…"
              value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Workflow note */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Reviewed by <span className="font-bold text-gray-700">Mentor</span>
              {' → '}<span className="font-bold text-gray-700">Class Advisor</span>
              {' → '}<span className="font-bold text-gray-700">HOD</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-[13px] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-[13px] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</>
                          : <><ClipboardCheck className="w-4 h-4" />Submit</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// WITHDRAW MODAL
// ─────────────────────────────────────────────────────────

const WithdrawModal = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
    <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-xl p-6 text-center">
      <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <Trash2 className="w-5 h-5 text-red-600" />
      </div>
      <h2 className="text-[16px] font-bold text-gray-900 mb-1.5">Withdraw Request?</h2>
      <p className="text-[13px] text-gray-500 mb-5">This will cancel your pending leave request.</p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-[13px] transition-colors">
          Keep it
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-[13px] transition-colors">
          Withdraw
        </button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// LIVE TRACKER
// ─────────────────────────────────────────────────────────

const LiveTracker = ({ leave }) => {
  const cfg = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending_mentor;
  const { Icon } = cfg;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`h-1.5 ${cfg.dot}`} />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-2 h-2 rounded-full animate-pulse ${cfg.dot}`} />
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Live Tracking</span>
          <span className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            <Icon className="w-3 h-3" />{cfg.shortLabel}
          </span>
        </div>

        <p className="text-[14px] font-bold text-gray-900 mb-1 leading-snug">{leave.reason}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>{fmtDate(leave.from_date)}</span>
          <span>→</span>
          <span>{fmtDate(leave.to_date)}</span>
          <span className="ml-auto font-bold bg-gray-100 px-1.5 py-0.5 rounded-full text-[10px]">{leave.duration_days}d</span>
        </div>

        <ApprovalTracker leave={leave} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────

const EmptyState = ({ onApply }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    <div className="w-16 h-16 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center mb-4">
      <CalendarDays className="w-8 h-8 text-gray-300" strokeWidth={1.3} />
    </div>
    <h3 className="text-[16px] font-bold text-gray-700 mb-1">No Leave Requests</h3>
    <p className="text-[13px] text-gray-400 max-w-xs leading-relaxed mb-5">
      You haven't submitted any leave requests yet.
    </p>
    <button onClick={onApply}
      className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl text-[13px] transition-colors shadow-sm">
      <Plus className="w-4 h-4" />Apply for Leave
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────

export const StudentLeave = () => {
  const [leaves, setLeaves]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [showApply, setShowApply]   = useState(false);
  const [withdrawId, setWithdrawId] = useState(null);

  const fetchLeaves = async () => {
    try {
      setLeaves(await StudentLeaveService.getMyLeaves());
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleWithdrawConfirm = async () => {
    try {
      await StudentLeaveService.withdrawLeave(withdrawId);
      setWithdrawId(null);
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to withdraw request.');
    }
  };

  const liveRequest = leaves.find(l => isPending(l.status));

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[28px] font-bold text-gray-900 tracking-tight">Leave Requests</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Apply for leave and track approval status.</p>
        </div>
        <button onClick={() => setShowApply(true)}
          className="flex-shrink-0 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-2.5 rounded-xl text-[13px] transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Apply for Leave</span>
          <span className="sm:hidden">Apply</span>
        </button>
      </div>

      {/* Loading */}
      {loading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] font-semibold">{error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        leaves.length === 0 ? <EmptyState onApply={() => setShowApply(true)} /> : (
          <>
            {liveRequest && <LiveTracker leave={liveRequest} />}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Request History</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {leaves.map(leave => (
                  <LeaveCard key={leave.id} leave={leave} onWithdraw={setWithdrawId} />
                ))}
              </div>
            </div>
          </>
        )
      )}

      {showApply && <ApplyModal onClose={() => setShowApply(false)} onSuccess={fetchLeaves} />}
      {withdrawId && <WithdrawModal onConfirm={handleWithdrawConfirm} onCancel={() => setWithdrawId(null)} />}
    </div>
  );
};

export default StudentLeave;
