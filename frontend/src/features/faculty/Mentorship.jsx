import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Users, BookOpen, Clock, Plus, ChevronRight, ArrowLeft } from 'lucide-react';

// ── Mentee list item ──────────────────────────────────────────────────────────
const MenteeItem = ({ mentee, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
      selected ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="font-semibold text-gray-900 text-sm">
          {mentee.first_name} {mentee.last_name}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Roll: {mentee.register_number}&nbsp;·&nbsp;Att:{' '}
          {mentee.attendance_pct != null ? `${mentee.attendance_pct}%` : '%'}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 ml-2" />
    </div>
  </button>
);

// ── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
    <p className="text-2xl font-bold text-primary-600">{value}</p>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export const Mentorship = () => {
  const [mentees, setMentees]             = useState([]);
  const [selected, setSelected]           = useState(null);
  const [loadingList, setLoadingList]     = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [note, setNote]                   = useState('');
  const [addingNote, setAddingNote]       = useState(false);

  // On mobile: tracks whether we are showing the detail panel
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'

  // ── Fetch mentees list ────────────────────────────────────────────────────
  useEffect(() => {
    axios.get('/api/faculty/me/mentees')
      .then(res => setMentees(res.data))
      .catch(err => console.error('Failed to load mentees', err))
      .finally(() => setLoadingList(false));
  }, []);

  // ── Fetch selected mentee detail ──────────────────────────────────────────
  const loadDetail = useCallback((studentId) => {
    setLoadingDetail(true);
    axios.get(`/api/faculty/me/mentees/${studentId}`)
      .then(res => {
        setSelected(res.data);
        setMobileView('detail');
      })
      .catch(err => console.error('Failed to load mentee detail', err))
      .finally(() => setLoadingDetail(false));
  }, []);

  // ── Add advising log ──────────────────────────────────────────────────────
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

  // ── Mentee list panel ─────────────────────────────────────────────────────
  const ListPanel = (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col
                    w-full md:w-72 md:flex-shrink-0
                    h-full">
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
  );

  // ── Detail panel ──────────────────────────────────────────────────────────
  const DetailPanel = (
    <div className="flex-1 overflow-y-auto space-y-4 md:space-y-5">
      {/* Mobile back button */}
      <button
        onClick={handleBack}
        className="flex md:hidden items-center gap-1.5 text-sm font-semibold text-primary-600 mb-1"
      >
        <ArrowLeft className="w-4 h-4" />
        All Mentees
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
              <span className="text-xs text-gray-400 hidden sm:inline">·</span>
              <span className="text-xs text-gray-500">Sem: {selected.current_semester ?? '—'}</span>
              <span className="text-xs text-gray-400 hidden sm:inline">·</span>
              <span className="text-xs text-gray-500 truncate">{selected.college_email}</span>
            </div>
          </div>

          {/* Stats — 3 cols on md+, 3 cols on mobile too but compact */}
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <StatCard label="CGPA"       value="—" />
            <StatCard
              label="Attendance"
              value={selected.attendance_percentage != null ? `${selected.attendance_percentage}%` : '—'}
            />
            <StatCard label="Backlogs"  value={selected.backlog_count ?? '—'} />
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
        /* Desktop empty state — only shows when no mentee selected on md+ */
        <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-400">
          <ChevronRight className="w-10 h-10 mb-2 text-gray-200" />
          <p className="text-sm">Select a mentee to view details</p>
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-1">
          Mentorship &amp; Advising Panel
        </h1>
        <p className="text-sm text-gray-500">
          Monitor attendance, backlog counts, and register direct advising notes.
        </p>
      </div>

      {/*
        Desktop: side-by-side flex row, fixed height
        Mobile:  full-width single column, show list OR detail based on mobileView
      */}
      <div className="md:flex md:gap-6 md:h-[calc(100vh-200px)] md:min-h-[500px]">

        {/* List panel — hidden on mobile when detail is active */}
        <div className={`${mobileView === 'detail' ? 'hidden md:flex' : 'flex'} flex-col h-[60vh] md:h-full
                         w-full md:w-72 md:flex-shrink-0
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

        {/* Detail panel — hidden on mobile when list is active */}
        <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col
                         overflow-y-auto space-y-4 md:space-y-5`}>
          {/* Mobile back button */}
          <button
            onClick={handleBack}
            className="flex md:hidden items-center gap-1.5 text-sm font-semibold text-primary-600"
          >
            <ArrowLeft className="w-4 h-4" />
            All Mentees
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
                <StatCard label="CGPA"       value="—" />
                <StatCard
                  label="Attendance"
                  value={selected.attendance_percentage != null ? `${selected.attendance_percentage}%` : '—'}
                />
                <StatCard label="Backlogs"  value={selected.backlog_count ?? '—'} />
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
            <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-400">
              <ChevronRight className="w-10 h-10 mb-2 text-gray-200" />
              <p className="text-sm">Select a mentee to view details</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
