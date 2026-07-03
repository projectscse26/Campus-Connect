/**
 * Shared leave card used by Mentor, Class Advisor, and HOD approval pages.
 */
import React, { useState } from 'react';
import { CalendarDays, CheckCircle2, XCircle, AlertCircle, Loader2, ChevronRight } from 'lucide-react';

export const STATUS_CFG = {
  pending_mentor:        { label: 'Pending Mentor',   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-400'   },
  pending_class_advisor: { label: 'Pending Advisor',  color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    bar: 'bg-blue-400'    },
  pending_hod:           { label: 'Pending HOD',      color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200',  bar: 'bg-violet-400'  },
  approved:              { label: 'Approved',         color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-400' },
  rejected:              { label: 'Rejected',         color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     bar: 'bg-red-400'     },
};

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const ApproverLeaveCard = ({ req, actionStatus, onAction, acting }) => {
  const [remarks, setRemarks] = useState('');
  const cfg    = STATUS_CFG[req.status] || STATUS_CFG.pending_hod;
  const canAct = req.status === actionStatus;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${cfg.border}`}>
      {/* top accent bar */}
      <div className={`h-1 ${cfg.bar}`} />

      <div className="p-4 space-y-3">

        {/* Student info + status badge */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-gray-900 leading-snug truncate">{req.student_name}</p>
            <p className="text-[11px] text-gray-400 font-medium">{req.register_number}</p>
          </div>
          <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            {cfg.label}
          </span>
        </div>

        {/* Date + duration */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-gray-500 font-medium">
          <CalendarDays className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span>{fmt(req.from_date)}</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span>{fmt(req.to_date)}</span>
          <span className="ml-auto text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {req.duration_days}d
          </span>
        </div>

        {/* Reason */}
        <p className="text-[12px] text-gray-600 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
          {req.reason}
        </p>

        {/* Prior approval trail */}
        {(req.mentor_actioned_at || req.class_advisor_actioned_at) && (
          <div className="space-y-1">
            {req.mentor_actioned_at && (
              <div className="flex items-start gap-1.5 bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-px" />
                <span className="text-[11px] font-semibold text-emerald-700 leading-snug">
                  Mentor: {req.mentor_name || '—'}{req.mentor_remarks ? ` — "${req.mentor_remarks}"` : ''}
                </span>
              </div>
            )}
            {req.class_advisor_actioned_at && (
              <div className="flex items-start gap-1.5 bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-px" />
                <span className="text-[11px] font-semibold text-emerald-700 leading-snug">
                  Advisor: {req.class_advisor_name || '—'}{req.class_advisor_remarks ? ` — "${req.class_advisor_remarks}"` : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Rejection reason */}
        {req.rejection_reason && (
          <div className="flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-xl px-2.5 py-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-px" />
            <p className="text-[11px] text-red-600 font-medium">{req.rejection_reason}</p>
          </div>
        )}

        {/* Action area */}
        {canAct && (
          <div className="space-y-2 pt-1 border-t border-gray-100">
            <input
              type="text"
              placeholder="Remarks (optional)"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAction(req.id, 'approve', remarks)}
                disabled={acting === req.id}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[12px] font-bold py-2.5 rounded-xl transition-all disabled:opacity-60"
              >
                {acting === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Approve
              </button>
              <button
                onClick={() => onAction(req.id, 'reject', remarks)}
                disabled={acting === req.id}
                className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-[12px] font-bold py-2.5 rounded-xl transition-all disabled:opacity-60"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
