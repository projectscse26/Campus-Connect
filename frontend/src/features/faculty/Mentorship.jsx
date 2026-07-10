import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Users, BookOpen, Clock, Plus, ChevronRight, ArrowLeft,
  AlertCircle, Loader2, FileText, GraduationCap, ClipboardList, ShieldAlert,
  Award, Calendar, Heart, MapPin, AlertTriangle, CheckCircle2, User, Phone, MapPinned, Info, ChevronDown, CheckSquare, TrendingUp
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

const StatCard = ({ label, value, sublabel, icon: Icon, colorClass = "text-primary-600", bgColorClass = "bg-primary-50" }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
    {Icon && (
      <div className={`w-10 h-10 rounded-lg ${bgColorClass} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
    )}
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
      {sublabel && <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{sublabel}</p>}
    </div>
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
  const [menteeTab, setMenteeTab]         = useState('progress'); // 'progress' | 'profile' | 'attendance' | 'marks' | 'discipline' | 'leaves'

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
      .then(res => { 
        setSelected(res.data); 
        setMobileView('detail'); 
        setMenteeTab('progress'); 
      })
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

  // Dynamic CGPA Calculation
  const getCGPA = () => {
    if (!selected?.grades || selected.grades.length === 0) return '—';
    const graded = selected.grades.filter(g => g.marks_obtained !== null && g.max_marks > 0);
    if (graded.length === 0) return '—';
    const sum = graded.reduce((acc, g) => acc + (g.marks_obtained / g.max_marks * 10), 0);
    return (sum / graded.length).toFixed(2);
  };

  // Group grades by course code
  const getCourseGrades = () => {
    if (!selected?.grades) return {};
    const courses = {};
    selected.grades.forEach(g => {
      if (!courses[g.course_code]) {
        courses[g.course_code] = { name: g.course_name, list: [] };
      }
      courses[g.course_code].list.push(g);
    });
    return courses;
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
              className="flex sm:hidden items-center gap-1.5 text-sm font-semibold text-primary-600 mb-2">
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
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-gray-900">
                        {selected.first_name} {selected.last_name}
                      </h2>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <span className="text-xs text-gray-500 font-semibold">Dept: {selected.department ?? '—'}</span>
                        <span className="text-xs text-gray-500 font-semibold">Sem: {selected.current_semester ?? '—'}</span>
                        <span className="text-xs text-gray-500 font-semibold">Roll: {selected.register_number}</span>
                        <span className="text-xs text-gray-400 break-all">{selected.college_email}</span>
                      </div>
                    </div>
                    {selected.personal_details?.accommodation && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selected.personal_details.accommodation === 'Hostel' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {selected.personal_details.accommodation}
                      </span>
                    )}
                  </div>

                  {/* Sub-tab Navigation */}
                  <div className="flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-100/50 p-1 rounded-xl border border-gray-100 mt-4">
                    {[
                      { id: 'progress', label: 'Progress Tracking', icon: TrendingUp },
                      { id: 'profile', label: 'Student Profile', icon: User },
                      { id: 'attendance', label: 'Attendance', icon: ClipboardList },
                      { id: 'marks', label: 'Marks & Grades', icon: Award },
                      { id: 'discipline', label: 'Discipline', icon: ShieldAlert },
                      { id: 'leaves', label: 'Leave History', icon: Calendar }
                    ].map(tab => {
                      const TabIcon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setMenteeTab(tab.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            menteeTab === tab.id
                              ? 'bg-white text-primary-600 shadow-sm border border-gray-100'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/40'
                          }`}
                        >
                          <TabIcon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── SUB TAB: PROGRESS TRACKING ── */}
                {menteeTab === 'progress' && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Stats & Alert Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <StatCard label="Calculated CGPA" value={getCGPA()} icon={Award} colorClass="text-emerald-600" bgColorClass="bg-emerald-50" />
                      <StatCard 
                        label="Attendance Status" 
                        value={selected.attendance_percentage != null ? `${selected.attendance_percentage}%` : '—'} 
                        sublabel={selected.attendance_percentage != null && selected.attendance_percentage < 75 ? "⚠️ Below Required 75%" : "✅ Healthy Attendance"}
                        icon={ClipboardList} 
                        colorClass={selected.attendance_percentage != null && selected.attendance_percentage < 75 ? "text-red-600" : "text-blue-600"} 
                        bgColorClass={selected.attendance_percentage != null && selected.attendance_percentage < 75 ? "bg-red-50" : "bg-blue-50"} 
                      />
                      <StatCard 
                        label="Pending Arrears" 
                        value={selected.backlog_count ?? '—'} 
                        sublabel={selected.backlog_count > 0 ? "🚨 Academic warnings active" : "✅ Clear Records"}
                        icon={ShieldAlert} 
                        colorClass={selected.backlog_count > 0 ? "text-amber-600" : "text-teal-600"} 
                        bgColorClass={selected.backlog_count > 0 ? "bg-amber-50" : "bg-teal-50"} 
                      />
                    </div>

                    {/* Progress Alerts Banners */}
                    {(selected.attendance_percentage != null && selected.attendance_percentage < 75) || (selected.backlog_count > 0) || (selected.discipline_records?.length > 0) ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                        <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          Academic Attention Required
                        </h4>
                        <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                          {selected.attendance_percentage != null && selected.attendance_percentage < 75 && (
                            <li>Attendance of <strong>{selected.attendance_percentage}%</strong> is critical. Advise the student to attend extra sessions.</li>
                          )}
                          {selected.backlog_count > 0 && (
                            <li>Student has <strong>{selected.backlog_count}</strong> pending backlog(s). Verify CIA marks and schedule retest support.</li>
                          )}
                          {selected.discipline_records?.length > 0 && (
                            <li>Student has <strong>{selected.discipline_records.length}</strong> discipline record(s) logged in the portal.</li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-green-800">Excellent Standing</p>
                          <p className="text-[11px] text-green-600">The student meets attendance targets, holds clean disciplinary records, and has no active backlogs.</p>
                        </div>
                      </div>
                    )}

                    {/* Performance Trends of Exams */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
                      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-primary-500" />
                        Course Performance Metrics (CIA 1 / CIA 2 / Model Exam)
                      </h3>
                      {Object.keys(getCourseGrades()).length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No gradebook records available for this student.</p>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(getCourseGrades()).map(([code, details]) => {
                            const cia1 = details.list.find(g => g.grade_type === 'internal_1');
                            const cia2 = details.list.find(g => g.grade_type === 'internal_2');
                            const model = details.list.find(g => g.grade_type === 'model_exam');

                            const cia1Pct = cia1?.marks_obtained != null ? (cia1.marks_obtained / cia1.max_marks * 100) : null;
                            const cia2Pct = cia2?.marks_obtained != null ? (cia2.marks_obtained / cia2.max_marks * 100) : null;
                            const modelPct = model?.marks_obtained != null ? (model.marks_obtained / model.max_marks * 100) : null;

                            return (
                              <div key={code} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                <div className="flex justify-between items-center mb-2">
                                  <div>
                                    <span className="text-xs font-extrabold text-gray-700 bg-gray-100 px-2 py-0.5 rounded mr-2">{code}</span>
                                    <span className="text-xs font-bold text-gray-900">{details.name}</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  {/* CIA 1 */}
                                  <div>
                                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                      <span>CIA 1</span>
                                      <span className="font-semibold">{cia1?.marks_obtained != null ? `${cia1.marks_obtained}/${cia1.max_marks}` : '—'}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${cia1Pct != null && cia1Pct < 50 ? 'bg-red-500' : 'bg-primary-500'}`}
                                        style={{ width: `${cia1Pct != null ? cia1Pct : 0}%` }}
                                      />
                                    </div>
                                  </div>
                                  {/* CIA 2 */}
                                  <div>
                                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                      <span>CIA 2</span>
                                      <span className="font-semibold">{cia2?.marks_obtained != null ? `${cia2.marks_obtained}/${cia2.max_marks}` : '—'}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${cia2Pct != null && cia2Pct < 50 ? 'bg-red-500' : 'bg-primary-500'}`}
                                        style={{ width: `${cia2Pct != null ? cia2Pct : 0}%` }}
                                      />
                                    </div>
                                  </div>
                                  {/* Model Exam */}
                                  <div>
                                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                      <span>Model</span>
                                      <span className="font-semibold">{model?.marks_obtained != null ? `${model.marks_obtained}/${model.max_marks}` : '—'}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${modelPct != null && modelPct < 50 ? 'bg-red-500' : 'bg-primary-500'}`}
                                        style={{ width: `${modelPct != null ? modelPct : 0}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
                      {!selected.advising_logs || selected.advising_logs.length === 0 ? (
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
                  </div>
                )}

                {/* ── SUB TAB: STUDENT PROFILE ── */}
                {menteeTab === 'profile' && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Personal Information */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
                      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 border-b border-gray-50 pb-2.5 mb-3">
                        <User className="w-4 h-4 text-primary-500" />
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs text-gray-700">
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">Gender</span>
                          <span className="font-semibold">{selected.personal_details?.gender ?? '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">Date of Birth</span>
                          <span className="font-semibold">{selected.personal_details?.date_of_birth ?? '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">Blood Group</span>
                          <span className="font-semibold text-red-600">{selected.personal_details?.blood_group ?? '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">Nationality</span>
                          <span className="font-semibold">{selected.personal_details?.nationality ?? '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">Community</span>
                          <span className="font-semibold">{selected.personal_details?.community ?? '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">Personal Phone</span>
                          <span className="font-semibold">{selected.personal_details?.phone ?? '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50 md:col-span-2">
                          <span className="text-gray-400 font-medium">Personal Email</span>
                          <span className="font-semibold">{selected.personal_details?.personal_email ?? '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50 md:col-span-2">
                          <span className="text-gray-400 font-medium">Residential Address</span>
                          <span className="font-semibold text-right max-w-xs">{selected.personal_details?.address ?? '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Parents & Guardian Details */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
                      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 border-b border-gray-50 pb-2.5 mb-3">
                        <Phone className="w-4 h-4 text-emerald-500" />
                        Guardian Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs text-gray-700">
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">Father's Name</span>
                          <span className="font-semibold">{selected.personal_details?.father_name ?? '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">Father's Phone</span>
                          <span className="font-semibold text-primary-600">{selected.personal_details?.father_phone ?? '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">Father's Occupation</span>
                          <span className="font-semibold">{selected.personal_details?.father_occupation ?? '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">Mother's Name</span>
                          <span className="font-semibold">{selected.personal_details?.mother_name ?? '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">Mother's Phone</span>
                          <span className="font-semibold text-primary-600">{selected.personal_details?.mother_phone ?? '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">Mother's Occupation</span>
                          <span className="font-semibold">{selected.personal_details?.mother_occupation ?? '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50 md:col-span-2">
                          <span className="text-gray-400 font-medium">Guardian Annual Income</span>
                          <span className="font-semibold text-emerald-600">
                            {selected.personal_details?.annual_income ? `₹${selected.personal_details.annual_income.toLocaleString('en-IN')}` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Schooling & Admission Details */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
                      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 border-b border-gray-50 pb-2.5 mb-3">
                        <GraduationCap className="w-4 h-4 text-purple-500" />
                        Academic & Schooling History
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs text-gray-700">
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">10th School / Board</span>
                          <span className="font-semibold text-right max-w-xs">{selected.personal_details?.tenth_school ?? '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">10th Score Percentage</span>
                          <span className="font-bold text-indigo-600">{selected.personal_details?.tenth_percentage ? `${selected.personal_details.tenth_percentage}%` : '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">12th School / Board</span>
                          <span className="font-semibold text-right max-w-xs">{selected.personal_details?.twelfth_school ?? '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">12th Score Percentage</span>
                          <span className="font-bold text-indigo-600">{selected.personal_details?.twelfth_percentage ? `${selected.personal_details.twelfth_percentage}%` : '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50/50">
                          <span className="text-gray-400 font-medium">Transportation</span>
                          <span className="font-semibold">{selected.personal_details?.transportation ?? '—'}</span>
                        </div>
                        {selected.personal_details?.transportation === 'BUS' && (
                          <div className="flex justify-between py-1 border-b border-gray-50/50">
                            <span className="text-gray-400 font-medium">Route Bus Number</span>
                            <span className="font-semibold text-amber-600">{selected.personal_details?.bus_number ?? '—'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SUB TAB: ATTENDANCE LOG ── */}
                {menteeTab === 'attendance' && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Course-wise Breakdown */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
                      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                        <ClipboardList className="w-4 h-4 text-primary-500" />
                        Course Attendance Summary
                      </h3>
                      {!selected.attendance_summary || selected.attendance_summary.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No attendance records found for this student.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selected.attendance_summary.map(summary => (
                            <div key={summary.course_id} className="border border-gray-100 p-3 rounded-lg bg-gray-50/50">
                              <div className="flex justify-between items-start mb-1.5">
                                <div>
                                  <p className="text-xs font-bold text-gray-800">{summary.course_name}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{summary.course_code}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  summary.percentage >= 75 
                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                    : summary.percentage >= 65 
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                      : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                  {summary.percentage}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    summary.percentage >= 75 ? 'bg-green-500' : summary.percentage >= 65 ? 'bg-amber-500' : 'bg-red-500'
                                  }`} 
                                  style={{ width: `${summary.percentage}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[9px] text-gray-400 mt-2 font-medium">
                                <span>Attended: {summary.attended_classes}</span>
                                <span>Total Conducted: {summary.total_classes}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Chronological Logs */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
                      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                        Recent Attendance Activity Logs (Last 50 Entries)
                      </h3>
                      {!selected.attendance_details || selected.attendance_details.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No attendance events recorded.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                                <th className="py-2.5 font-semibold">Date</th>
                                <th className="py-2.5 font-semibold">Hour</th>
                                <th className="py-2.5 font-semibold">Course</th>
                                <th className="py-2.5 font-semibold">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {selected.attendance_details.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50/50">
                                  <td className="py-2.5 font-medium text-gray-700">{log.date}</td>
                                  <td className="py-2.5 font-semibold text-gray-500">P{log.hour}</td>
                                  <td className="py-2.5 text-gray-700">{log.course_name}</td>
                                  <td className="py-2.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                      log.status === 'present' 
                                        ? 'bg-green-50 text-green-700' 
                                        : log.status === 'absent' 
                                          ? 'bg-red-50 text-red-700' 
                                          : log.status === 'on_duty' 
                                            ? 'bg-indigo-50 text-indigo-700' 
                                            : 'bg-amber-50 text-amber-700'
                                    }`}>
                                      {log.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── SUB TAB: MARKS & GRADES ── */}
                {menteeTab === 'marks' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
                      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
                        <Award className="w-4 h-4 text-primary-500" />
                        Grades & Exam Reports
                      </h3>
                      {Object.keys(getCourseGrades()).length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No academic marks are currently recorded in the portal.</p>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(getCourseGrades()).map(([code, details]) => (
                            <div key={code} className="border border-gray-100 rounded-xl p-4 bg-gray-50/30">
                              <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                                <div>
                                  <span className="text-xs font-extrabold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded mr-2">{code}</span>
                                  <span className="text-xs font-bold text-gray-900">{details.name}</span>
                                </div>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                                      <th className="py-2 font-semibold">Assessment Type</th>
                                      <th className="py-2 font-semibold">Marks Obtained</th>
                                      <th className="py-2 font-semibold">Percentage</th>
                                      <th className="py-2 font-semibold">Status</th>
                                      <th className="py-2 font-semibold">Remarks</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {details.list.map(g => {
                                      const pct = g.marks_obtained != null ? Math.round((g.marks_obtained / g.max_marks * 100)) : null;
                                      const isPass = pct != null ? pct >= 50 : false;
                                      return (
                                        <tr key={g.id} className="text-gray-700">
                                          <td className="py-2 font-semibold text-gray-600 capitalize">
                                            {g.grade_type.replace('_', ' ')}
                                          </td>
                                          <td className="py-2">
                                            {g.is_absent ? (
                                              <span className="text-red-500 font-bold">ABSENT</span>
                                            ) : g.marks_obtained != null ? (
                                              <span className="font-semibold text-gray-800">{g.marks_obtained} / {g.max_marks}</span>
                                            ) : (
                                              <span className="text-gray-400 font-medium">—</span>
                                            )}
                                          </td>
                                          <td className="py-2 font-bold text-gray-800">
                                            {pct != null ? `${pct}%` : '—'}
                                          </td>
                                          <td className="py-2">
                                            {g.is_absent ? (
                                              <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold">F</span>
                                            ) : pct != null ? (
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                isPass ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                              }`}>
                                                {isPass ? 'Pass' : 'Fail'}
                                              </span>
                                            ) : (
                                              <span className="text-gray-400">—</span>
                                            )}
                                          </td>
                                          <td className="py-2 text-gray-400 italic text-[11px]">
                                            {g.remarks || 'No remarks'}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── SUB TAB: DISCIPLINE RECORDS ── */}
                {menteeTab === 'discipline' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
                      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                        Disciplinary Incident Log Book
                      </h3>
                      {!selected.discipline_records || selected.discipline_records.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                          <p className="text-sm font-bold text-gray-700">Good Standing</p>
                          <p className="text-xs text-gray-400 mt-1">No disciplinary incidents have been reported for this student.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selected.discipline_records.map(record => (
                            <div key={record.id} className="border border-red-100 p-4 rounded-xl bg-red-50/20">
                              <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                                <span className="text-xs font-extrabold text-red-700 bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
                                  {record.incident_type}
                                </span>
                                <span className="text-[10px] text-gray-400 font-semibold">{record.incident_date}</span>
                              </div>
                              <p className="text-xs text-gray-700 mt-1">
                                <strong>Remarks:</strong> {record.remarks || 'No descriptive comments added.'}
                              </p>
                              <div className="flex flex-wrap justify-between items-center mt-3 pt-2 border-t border-dashed border-red-100/50 text-[10px] text-gray-500">
                                <span>Reported By: {record.reported_by_name}</span>
                                <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                                  record.action_status === 'Informed' 
                                    ? 'bg-green-50 text-green-700 border border-green-100' 
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {record.action_status}
                                </span>
                              </div>
                              {record.action_taken && (
                                <div className="bg-white border border-red-50/60 p-2 rounded mt-2 text-[10px] text-gray-600">
                                  <strong>Action Details:</strong> {record.action_taken}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── SUB TAB: LEAVE HISTORY ── */}
                {menteeTab === 'leaves' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
                      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        Leave Request Records
                      </h3>
                      {!selected.leave_history || selected.leave_history.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No leave applications exist in the portal archives for this student.</p>
                      ) : (
                        <div className="space-y-3.5">
                          {selected.leave_history.map(req => (
                            <div key={req.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/20">
                              <div className="flex flex-wrap justify-between items-center mb-2.5 gap-2">
                                <div className="text-xs font-bold text-gray-800">
                                  <span>{req.from_date}</span>
                                  <span className="mx-1.5 text-gray-400">to</span>
                                  <span>{req.to_date}</span>
                                  <span className="ml-2 text-gray-400 font-normal">({req.duration_days} {req.duration_days > 1 ? 'days' : 'day'})</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  req.status === 'approved' 
                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                    : req.status === 'rejected' 
                                      ? 'bg-red-50 text-red-700 border border-red-200' 
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {req.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 mb-3">
                                <strong>Reason:</strong> {req.reason}
                              </p>
                              
                              {/* Workflow remarks trail */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-[10px] text-gray-500">
                                <div>
                                  <span className="font-bold text-gray-700">Mentor Remarks:</span>
                                  <p className="italic text-gray-600 mt-0.5">{req.mentor_remarks || '—'}</p>
                                </div>
                                <div>
                                  <span className="font-bold text-gray-700">Advisor Remarks:</span>
                                  <p className="italic text-gray-600 mt-0.5">{req.class_advisor_remarks || '—'}</p>
                                </div>
                                <div>
                                  <span className="font-bold text-gray-700">HOD Remarks:</span>
                                  <p className="italic text-gray-600 mt-0.5">{req.hod_remarks || '—'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
