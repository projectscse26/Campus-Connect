import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Users, BookOpen, Clock, Plus, ChevronRight, ArrowLeft,
  AlertCircle, Loader2, FileText,
} from 'lucide-react';
import { ApproverLeaveCard } from '../leave/ApproverLeaveCard';

// ─────────────────────────────────────────────────────────
// MENTOR LEAVE QUEUE
// ─────────────────────────────────────────────────────────

const MentorLeaveQueue = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [acting, setActing]     = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    axios.get('/api/student-portal/leave/mentor-queue')
      .then(r => { setRequests(r.data); setError(null); })
      .catch(e => setError(e.response?.data?.detail || 'Failed to load requests'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, action, remarks) => {
    setActing(id);
    try {
      await axios.put(`/api/student-portal/leave/${id}/mentor-action`, null, { params: { action, remarks } });
      load();
      window.dispatchEvent(new Event('refetch-badges'));
    } catch (e) {
      alert(e.response?.data?.detail || 'Action failed');
    } finally {
      setActing(null);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary-400" /></div>;

  if (error) return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <p className="text-[13px] font-semibold text-red-700">{error}</p>
    </div>
  );

  if (requests.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center mb-4">
        <FileText className="w-7 h-7 text-gray-300" strokeWidth={1.3} />
      </div>
      <p className="text-[14px] font-bold text-gray-600 mb-1">No Pending Requests</p>
      <p className="text-[12px] text-gray-400">No student leave requests are waiting for your approval.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{requests.length} pending</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {requests.map(r => (
          <ApproverLeaveCard key={r.id} req={r} actionStatus="pending_mentor" onAction={handleAction} acting={acting} />
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// MENTEE LIST ITEM
// ─────────────────────────────────────────────────────────

const MenteeItem = ({ mentee, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-100/50 transition-colors ${
      selected ? 'bg-primary-50 dark:bg-gray-100 border-l-4 border-l-primary-600 dark:border-l-primary-500' : 'border-l-4 border-l-transparent'
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className={`font-semibold text-sm ${selected ? 'text-primary-900 dark:text-gray-900' : 'text-gray-900'}`}>
          {mentee.first_name} {mentee.last_name}
        </p>
        <p className={`text-xs mt-0.5 ${selected ? 'text-primary-600 dark:text-gray-500' : 'text-gray-500'}`}>
          Roll: {mentee.register_number}&nbsp;·&nbsp;Att:{' '}
          {mentee.attendance_pct != null ? `${mentee.attendance_pct}%` : '—'}
        </p>
      </div>
      <ChevronRight className={`w-4 h-4 flex-shrink-0 ml-2 ${selected ? 'text-primary-500 dark:text-gray-400' : 'text-gray-300'}`} />
    </div>
  </button>
);

const StatCard = ({ label, value }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
    <p className="text-2xl font-bold text-primary-600">{value}</p>
  </div>
);

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────

export const Mentorship = () => {
  const [activeTab, setActiveTab]         = useState('mentees');
  const [mentees, setMentees]             = useState([]);
  const [selected, setSelected]           = useState(null);
  const [loadingList, setLoadingList]     = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [note, setNote]                   = useState('');
  const [addingNote, setAddingNote]       = useState(false);
  const [mobileView, setMobileView]       = useState('list'); // 'list' | 'detail'
  const [leaveBadgeCount, setLeaveBadgeCount] = useState(0);

  const fetchLeaveBadgeCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('/api/notifications/badge-counts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaveBadgeCount(res.data['/faculty/mentorship'] || 0);
    } catch (err) {
      console.error('Failed to fetch leave badge count', err);
    }
  };

  useEffect(() => {
    fetchLeaveBadgeCount();
    window.addEventListener('refetch-badges', fetchLeaveBadgeCount);
    return () => window.removeEventListener('refetch-badges', fetchLeaveBadgeCount);
  }, []);

  useEffect(() => {
    if (activeTab === 'leave') {
      const markLeaveViewed = async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.put('/api/notifications/mark-viewed?sector=leave-mentor', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          window.dispatchEvent(new Event('refetch-badges'));
        } catch (err) {
          console.error('Failed to mark leave as viewed', err);
        }
      };
      markLeaveViewed();
    }
  }, [activeTab]);

  useEffect(() => {
    axios.get('/api/faculty/me/mentees')
      .then(res => setMentees(res.data))
      .catch(err => console.error('Failed to load mentees', err))
      .finally(() => setLoadingList(false));
  }, []);

  const loadDetail = useCallback((studentId) => {
    setLoadingDetail(true);
    axios.get(`/api/faculty/me/mentees/${studentId}`)
      .then(res => { setSelected(res.data); setMobileView('detail'); })
      .catch(err => console.error('Failed to load mentee detail', err))
      .finally(() => setLoadingDetail(false));
  }, []);

  const handleAddLog = async () => {
    if (!note.trim() || !selected) return;
    setAddingNote(true);
    try {
      await axios.post(`/api/faculty/me/mentees/${selected.id}/logs`, { note });
      setNote('');
      loadDetail(selected.id);
    } catch (err) {
      console.error('Failed to add log', err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleBack = () => {
    setMobileView('list');
    setSelected(null);
  };

  return (
    <div className="space-y-4 md:space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-1">
          Mentorship &amp; Advising Panel
        </h1>
        <p className="text-sm text-gray-500">
          Monitor mentees and review student leave requests assigned to you.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'mentees', label: 'My Mentees' },
          { id: 'leave',   label: 'Leave Requests' },
        ].map(tab => {
          const hasBadge = tab.id === 'leave' && leaveBadgeCount > 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.label}</span>
              {hasBadge && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                  {leaveBadgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Leave Requests Tab ── */}
      {activeTab === 'leave' && <MentorLeaveQueue />}

      {/* ── Mentees Tab ── */}
      {activeTab === 'mentees' && (
        <div className="sm:flex sm:gap-6 sm:h-[calc(100vh-260px)] sm:min-h-[500px]">

          {/* List panel */}
          <div className={`${mobileView === 'detail' ? 'hidden sm:flex' : 'flex'} flex-col h-[55vh] sm:h-full
                           w-full sm:w-72 sm:flex-shrink-0
                           bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden`}>
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-700">My Mentees</h2>
            </div>
            <div className="overflow-y-auto flex-1">
              {loadingList ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                </div>
              ) : mentees.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No mentees assigned yet.
                </div>
              ) : (
                mentees.map(m => (
                  <MenteeItem
                    key={m.id}
                    mentee={m}
                    selected={selected?.id === m.id}
                    onClick={() => loadDetail(m.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className={`${mobileView === 'list' ? 'hidden sm:flex' : 'flex'} flex-1 flex-col
                           overflow-y-auto space-y-4`}>

            <button onClick={handleBack}
              className="flex sm:hidden items-center gap-1.5 text-sm font-semibold text-primary-600">
              <ArrowLeft className="w-4 h-4" />All Mentees
            </button>

            {loadingDetail ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : selected ? (
              <>
                {/* Student header */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
                  <h2 className="text-base md:text-lg font-bold text-gray-900">
                    {selected.first_name} {selected.last_name}
                  </h2>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    <span className="text-xs text-gray-500">Dept: {selected.department ?? '—'}</span>
                    <span className="text-xs text-gray-500">Sem: {selected.current_semester ?? '—'}</span>
                    <span className="text-xs text-gray-500 break-all">{selected.college_email}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <StatCard label="CGPA" value="—" />
                  <StatCard
                    label="Attendance"
                    value={selected.attendance_percentage != null ? `${selected.attendance_percentage}%` : '—'}
                  />
                  <StatCard label="Backlogs" value={selected.backlog_count ?? '—'} />
                </div>

                {/* Register Advising Note */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-primary-500" />
                    Register Advising Note
                  </h3>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={4}
                    placeholder="Document key takeaways, performance reviews, or personal challenges..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700
                               focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
                  />
                  <button
                    onClick={handleAddLog}
                    disabled={addingNote || !note.trim()}
                    className="mt-3 w-full sm:w-auto bg-primary-600 hover:bg-primary-700 disabled:opacity-50
                               text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors
                               flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {addingNote ? 'Adding...' : 'Add Log Entry'}
                  </button>
                </div>

                {/* Previous Advising Logs */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    Previous Advising Logs
                  </h3>
                  {selected.advising_logs.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No advising logs exist for this student.</p>
                  ) : (
                    <div className="space-y-3">
                      {selected.advising_logs.map(log => (
                        <div key={log.id} className="border-l-2 border-primary-200 pl-3 py-1">
                          <p className="text-sm text-gray-700">{log.note}</p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex flex-col items-center justify-center h-full text-gray-400">
                <ChevronRight className="w-10 h-10 mb-2 text-gray-200" />
                <p className="text-sm">Select a mentee to view details</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
