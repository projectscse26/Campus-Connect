import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users, GraduationCap, BookOpen, Layers, Link2, Bell, Calendar,
  BarChart2, Clock, ChevronRight, AlertCircle,
  Megaphone, UserCheck, ClipboardList, ArrowUpRight,
  Building2, Activity, Sun, Sunrise, Moon, CheckCircle2,
  Zap, CalendarDays, Eye, X, RefreshCw, Plus, Info,
  AlertTriangle
} from 'lucide-react';

// ─── Utility Helpers ────────────────────────────────────────────────────────

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', Icon: Sunrise, color: 'text-amber-300' };
  if (h < 17) return { text: 'Good Afternoon', Icon: Sun, color: 'text-amber-200' };
  return { text: 'Good Evening', Icon: Moon, color: 'text-indigo-200' };
};

const getAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 6) {
    return `${year}–${String(year + 1).slice(2)}`;
  }
  return `${year - 1}–${String(year).slice(2)}`;
};

const formatFullDate = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 65)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const CATEGORY_STYLES = {
  Urgent:   { badge: 'bg-rose-50 text-rose-700 border-rose-100',      dot: 'bg-rose-500' },
  Event:    { badge: 'bg-violet-50 text-violet-700 border-violet-100', dot: 'bg-violet-500' },
  Academic: { badge: 'bg-blue-50 text-blue-700 border-blue-100',   dot: 'bg-blue-500' },
  General:  { badge: 'bg-slate-50 text-slate-700 border-slate-200',   dot: 'bg-slate-400' },
};

// Year-wise student attendance tooltip structure
const ATTENDANCE_YEAR_BREAKDOWN = {
  'I Year': {
    sections: [
      { name: 'I CSE A', present: 54, absent: 2 },
      { name: 'I CSE B', present: 56, absent: 3 },
    ],
    totalRate: 96
  },
  'II Year': {
    sections: [
      { name: 'II CSE A', present: 58, absent: 2 },
      { name: 'II CSE B', present: 60, absent: 4 },
    ],
    totalRate: 92
  },
  'III Year': {
    sections: [
      { name: 'III CSE A', present: 50, absent: 3 },
      { name: 'III CSE B', present: 52, absent: 3 },
    ],
    totalRate: 94
  },
  'IV Year': {
    sections: [
      { name: 'IV CSE A', present: 48, absent: 5 },
      { name: 'IV CSE B', present: 46, absent: 5 },
    ],
    totalRate: 90
  }
};

// Default institution events
const DEFAULT_EVENTS = [
  { id: 'inst-1', name: 'Internal Assessment - II', type: 'Academic', date: '2026-07-18', time: '09:30 AM', venue: 'Main Examination Hall', organizer: 'Controller of Exams' },
  { id: 'inst-2', name: 'Placement Orientation', type: 'Placement', date: '2026-07-22', time: '11:00 AM', venue: 'Main Auditorium', organizer: 'CDC Department' },
  { id: 'inst-3', name: 'Department Workshop on GenAI', type: 'Workshop', date: '2026-07-25', time: '09:00 AM', venue: 'AI Laboratory', organizer: 'Dept Association' }
];

// ─── Reusable KPI & Action Components ───────────────────────────────────────

const KPICard = ({ title, value, icon: Icon, color, bg, to, sub }) => (
  <Link
    to={to}
    className="group bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_30px_rgba(37,99,235,0.06)] hover:border-primary-100 hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 flex flex-col justify-between min-h-[145px]"
  >
    <div className="flex items-center justify-between">
      <div className={`w-10 h-10 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 duration-300`}>
        <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.8} />
      </div>
      <span className="text-[10px] font-bold text-slate-400 group-hover:text-primary-500 transition-colors flex items-center gap-0.5">
        Open <ArrowUpRight className="w-3.5 h-3.5" />
      </span>
    </div>
    <div className="mt-4">
      <p className="text-2xl font-black text-slate-900 leading-none mb-1.5 tracking-tight">
        {value ?? <span className="text-slate-355">—</span>}
      </p>
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{title}</p>
      {sub && <p className="text-[10px] text-slate-455 mt-1 font-medium">{sub}</p>}
    </div>
  </Link>
);

const QuickAction = ({ label, icon: Icon, to, color, bg }) => (
  <Link
    to={to}
    className="group flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl border border-slate-100 bg-white hover:border-primary-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 transition-all duration-300 text-center"
  >
    <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm mb-3`}>
      <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.8} />
    </div>
    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors block leading-tight">{label}</span>
  </Link>
);

// ─── Main HOD Dashboard ─────────────────────────────────────────────────────

export const HodDashboard = () => {
  const { user } = useAuth();
  const requestManagementRef = useRef(null);

  // ── Local State ──────────────────────────────────────────────
  const [timeOverride, setTimeOverride] = useState('auto'); // 'auto', 'sunday', 'before10', 'after10'
  const [selectedAnn, setSelectedAnn] = useState(null); // Announcement for details modal
  const [activeTab, setActiveTab] = useState('leaves'); // 'leaves', 'requests', 'grievances'
  const [hoveredYear, setHoveredYear] = useState(null); // Tooltip hover state
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [facultyModalContent, setFacultyModalContent] = useState(null);
  const [newEvent, setNewEvent] = useState({ name: '', type: 'Departmental', date: '', time: '', venue: '', organizer: 'HOD Office' });

  const [seenRequestIds, setSeenRequestIds] = useState(() => {
    try {
      const saved = localStorage.getItem('seen_request_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ── Persistent events state ──────────────────────────────────
  const [manualEvents, setManualEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('hod_dept_events');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('hod_dept_events', JSON.stringify(manualEvents));
  }, [manualEvents]);

  // ── API State ────────────────────────────────────────────────
  const [dashboard, setDashboard] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [disciplineRecords, setDisciplineRecords] = useState([]);
  const [resultsSummary, setResultsSummary] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [studentAttendanceSummary, setStudentAttendanceSummary] = useState({
    overallRate: 0,
    isMarkedToday: false,
    yearBreakdown: {
      'I Year': { sections: [], totalRate: 0 },
      'II Year': { sections: [], totalRate: 0 },
      'III Year': { sections: [], totalRate: 0 },
      'IV Year': { sections: [], totalRate: 0 }
    }
  });

  const [facultyAttendanceSummary, setFacultyAttendanceSummary] = useState({
    presentCount: 0,
    absentCount: 0,
    onLeaveCount: 0,
    presentFaculty: [],
    absentFaculty: [],
    onLeaveFaculty: []
  });

  const [deptSettings, setDeptSettings] = useState({
    current_sem_start_date: '',
    attendance_closed: false
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const greeting = useMemo(() => getGreeting(), []);

  // Compute date condition based on override
  const dateConditions = useMemo(() => {
    const now = new Date();
    if (timeOverride === 'sunday') return { isSunday: true, isBefore10: false };
    if (timeOverride === 'before10') return { isSunday: false, isBefore10: true };
    if (timeOverride === 'after10') return { isSunday: false, isBefore10: false };
    return {
      isSunday: now.getDay() === 0,
      isBefore10: now.getHours() < 10
    };
  }, [timeOverride]);

  // ── Fetch Dashboard Data ──────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, annRes, leaveRes, gpRes, discRes, resSummary, facRes, secRes, attSummaryRes, facAttendanceRes, settingsRes] = await Promise.allSettled([
        axios.get('/api/hod/dashboard'),
        axios.get('/api/announcements'),
        axios.get('/api/leave/requests'),
        axios.get('/api/gatepass/hod'),
        axios.get('/api/discipline'),
        axios.get('/api/hod/results-summary'),
        axios.get('/api/hod/faculty'),
        axios.get('/api/hod/sections'),
        axios.get('/api/hod/attendance-summary'),
        axios.get('/api/hod/faculty-attendance'),
        axios.get('/api/hod/department-settings')
      ]);

      if (dashRes.status === 'fulfilled') {
        setDashboard(dashRes.value.data);
      } else {
        setError('Failed to load dashboard statistics.');
      }

      if (annRes.status === 'fulfilled') setAnnouncements(annRes.value.data || []);
      if (leaveRes.status === 'fulfilled') setLeaveRequests(leaveRes.value.data || []);
      if (gpRes.status === 'fulfilled') setGatePasses(gpRes.value.data || []);
      if (discRes.status === 'fulfilled') setDisciplineRecords(discRes.value.data || []);
      if (resSummary.status === 'fulfilled') setResultsSummary(resSummary.value.data || []);
      if (facRes.status === 'fulfilled') setFacultyList(facRes.value.data || []);
      if (secRes.status === 'fulfilled') setSections(secRes.value.data || []);
      if (attSummaryRes.status === 'fulfilled') setStudentAttendanceSummary(attSummaryRes.value.data || {});
      if (facAttendanceRes.status === 'fulfilled') setFacultyAttendanceSummary(facAttendanceRes.value.data || {});
      
      if (settingsRes.status === 'fulfilled') {
        setDeptSettings({
          current_sem_start_date: settingsRes.value.data.current_sem_start_date 
            ? settingsRes.value.data.current_sem_start_date.split('T')[0] 
            : '',
          attendance_closed: settingsRes.value.data.attendance_closed || false
        });
      }

    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred while loading dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setIsSavingSettings(true);
      await axios.put('/api/hod/department-settings', {
        current_sem_start_date: deptSettings.current_sem_start_date ? new Date(deptSettings.current_sem_start_date).toISOString() : null,
        attendance_closed: deptSettings.attendance_closed
      });
      // show success, could use toast if available
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ── Modals State ──────────────────────────────────────────────
  const pendingLeaves = useMemo(() => {
    return leaveRequests.filter(req => req.status === 'pending_hod');
  }, [leaveRequests]);

  const pendingStudentRequests = useMemo(() => {
    return gatePasses.filter(gp => gp.status === 'pending_hod');
  }, [gatePasses]);

  const totalUnseenCount = useMemo(() => {
    const unseenLeaves = pendingLeaves.filter(req => !seenRequestIds.includes(`leave-${req.id}`)).length;
    const unseenStudentRequests = pendingStudentRequests.filter(gp => !seenRequestIds.includes(`gp-${gp.id}`)).length;
    const unseenGrievances = disciplineRecords.filter(rec => !seenRequestIds.includes(`grievance-${rec.id}`)).length;
    return unseenLeaves + unseenStudentRequests + unseenGrievances;
  }, [pendingLeaves, pendingStudentRequests, disciplineRecords, seenRequestIds]);

  const markAllRequestsAsSeen = () => {
    const currentIds = [
      ...pendingLeaves.map(req => `leave-${req.id}`),
      ...pendingStudentRequests.map(gp => `gp-${gp.id}`),
      ...disciplineRecords.map(rec => `grievance-${rec.id}`)
    ];
    const updatedSeen = Array.from(new Set([...seenRequestIds, ...currentIds]));
    setSeenRequestIds(updatedSeen);
    localStorage.setItem('seen_request_ids', JSON.stringify(updatedSeen));
  };

  const averagePassPercentage = useMemo(() => {
    if (!resultsSummary || resultsSummary.length === 0) return 92.5;
    const total = resultsSummary.reduce((acc, curr) => acc + (curr.pass_percentage || 0), 0);
    return Math.round((total / resultsSummary.length) * 10) / 10;
  }, [resultsSummary]);

  const allEvents = useMemo(() => {
    const combined = [...DEFAULT_EVENTS, ...manualEvents];
    return combined.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [manualEvents]);

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.date || !newEvent.time) return;
    const newId = `hod-evt-${Date.now()}`;
    setManualEvents(prev => [...prev, { ...newEvent, id: newId }]);
    setNewEvent({ name: '', type: 'Departmental', date: '', time: '', venue: '', organizer: 'HOD Office' });
    setShowAddEventModal(false);
  };

  const handleRemoveEvent = (id) => {
    if (window.confirm("Remove this event?")) {
      setManualEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  // Recent activities feed
  const activities = useMemo(() => {
    const list = [];
    announcements.slice(0, 2).forEach(ann => {
      list.push({
        id: `ann-${ann.id}`,
        text: `Announcement published: "${ann.title}"`,
        sub: `by ${ann.author?.name || 'Faculty'} · ${timeAgo(ann.created_at)}`,
        icon: Megaphone,
        color: 'text-blue-500',
        bg: 'bg-blue-50'
      });
    });
    sections.forEach(sec => {
      if (sec.class_advisor_id) {
        list.push({
          id: `sec-${sec.id}`,
          text: `Advisor assigned to Section ${sec.name}`,
          sub: `Batch ${sec.batch}`,
          icon: UserCheck,
          color: 'text-emerald-500',
          bg: 'bg-emerald-50'
        });
      }
    });
    leaveRequests.slice(0, 2).forEach(leave => {
      list.push({
        id: `leave-${leave.id}`,
        text: `Leave request submitted by ${leave.faculty_name || 'Faculty'}`,
        sub: `Duration: ${leave.duration_days} days · Status: ${leave.status.replace('_', ' ').toUpperCase()}`,
        icon: Clock,
        color: 'text-violet-500',
        bg: 'bg-violet-50'
      });
    });
    if (list.length < 4) {
      list.push({
        id: 'mock-1',
        text: 'Timetable updated for II CSE A & B',
        sub: 'Today • 09:42 AM',
        icon: Calendar,
        color: 'text-amber-500',
        bg: 'bg-amber-50'
      });
      list.push({
        id: 'mock-2',
        text: 'Mentor assignments allocated for III Year students',
        sub: 'Yesterday • 11:50 AM',
        icon: Users,
        color: 'text-indigo-500',
        bg: 'bg-indigo-50'
      });
    }
    return list.slice(0, 5);
  }, [announcements, sections, leaveRequests]);

  const totalFacultyCount = useMemo(() => {
    return dashboard?.faculty_count || facultyList.length || 30;
  }, [dashboard, facultyList]);

  const facultyPresent = useMemo(() => {
    return Math.max(0, totalFacultyCount - 2);
  }, [totalFacultyCount]);

  const facultyAttendanceRate = useMemo(() => {
    return Math.round((facultyPresent / totalFacultyCount) * 100);
  }, [facultyPresent, totalFacultyCount]);

  // Click handler from welcome card pending action items
  const handlePendingItemClick = (tabId) => {
    setActiveTab(tabId);
    if (requestManagementRef.current) {
      requestManagementRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-slate-100 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-50 rounded-3xl" />
          <div className="h-80 bg-slate-50 rounded-3xl" />
        </div>
      </div>
    );
  }

  const { Icon: GreetingIcon, text: greetingText, color: greetingColor } = greeting;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto text-slate-800 px-2 sm:px-4">

      {/* ═══════════════════════════════════════════════════════════
          1. WELCOME HEADER (Enhanced Executive Theme)
      ═══════════════════════════════════════════════════════════ */}
      <div className="relative bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] rounded-3xl p-6 sm:p-8 md:p-10 overflow-hidden shadow-xl shadow-blue-900/20 hover:scale-[1.01] transition-all duration-300">
        
        {/* Subtle background decoration (5-8% opacity) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.06] select-none">
          <svg className="absolute -right-16 -top-16 w-[450px] h-[450px] text-white" fill="currentColor" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" />
          </svg>
          <svg className="absolute -left-20 -bottom-20 w-[350px] h-[350px] text-white" fill="currentColor" viewBox="0 0 100 100">
            <polygon points="50,15 90,85 10,85" />
          </svg>
          {/* Subtle Grid / Dot pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-75" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-6 z-10">
          
          {/* Left Column: Greeting, Department Details, Academic Info, Status Badge */}
          <div className="space-y-4 text-left max-w-xl text-white">
            
            {/* Working Day Status & Current Date */}
            <div className="flex flex-wrap items-center gap-2">
              {dateConditions.isSunday ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-white backdrop-blur-sm">
                  🔴 Holiday
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-white backdrop-blur-sm">
                  🟢 Working Day
                </span>
              )}
              
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-white backdrop-blur-sm">
                {formatFullDate()}
              </span>
            </div>
            
            {/* Typography Hierarchy */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                {greetingText}, {user?.name || 'Dr. Balaji'}
              </h1>
              <p className="text-white/80 text-xs font-bold tracking-wide">
                D.C.T., B.Tech., M.E., Ph.D.
              </p>
              <div className="pt-0.5">
                <p className="text-white/90 text-sm font-bold uppercase tracking-wider">
                  Head of Department
                </p>
                <p className="text-white text-base font-extrabold tracking-wide uppercase mt-0.5">
                  {dashboard?.department_name || 'Computer Science & Engineering'}
                </p>
              </div>
            </div>

            {/* Academic Info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/90 text-xs font-semibold pt-1">
              <span>Academic Year : {getAcademicYear()}</span>
            </div>

          </div>

          {/* Right Column: Requests Notification Badge */}
          <div className="self-start shrink-0 sm:pt-2">
            <button
              onClick={() => {
                markAllRequestsAsSeen();
                if (requestManagementRef.current) {
                  requestManagementRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="inline-flex items-center gap-2.5 bg-white/15 border border-white/20 px-4 py-2 rounded-full backdrop-blur-md hover:bg-white/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm text-white focus:outline-none cursor-pointer"
            >
              <Bell className="w-4 h-4 text-white fill-white/10" />
              <span className="text-xs font-bold tracking-wide">Requests</span>
              {totalUnseenCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                  {totalUnseenCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SEMESTER CONFIGURATION
      ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.01)] text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm mb-1 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-violet-600" />
            </span>
            Semester Settings & Attendance Controls
          </h3>
          <p className="text-xs text-slate-500 font-medium ml-10">Configure your department's working dates and instantly lock attendance marking.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {/* Start Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600 px-2 whitespace-nowrap">Sem Start:</span>
            <input
              type="date"
              className="bg-white text-sm font-bold text-slate-700 px-3 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-primary-500 w-full sm:w-auto"
              value={deptSettings.current_sem_start_date}
              onChange={(e) => setDeptSettings(prev => ({ ...prev, current_sem_start_date: e.target.value }))}
            />
          </div>

          {/* Attendance Lock Toggle */}
          <div className="flex items-center gap-3 bg-rose-50/50 p-2 rounded-xl border border-rose-100 w-full sm:w-auto px-4 cursor-pointer" onClick={() => setDeptSettings(prev => ({ ...prev, attendance_closed: !prev.attendance_closed }))}>
            <span className={`text-xs font-bold ${deptSettings.attendance_closed ? 'text-rose-600' : 'text-slate-600'}`}>
              {deptSettings.attendance_closed ? "Attendance Locked" : "Attendance Open"}
            </span>
            <div className={`relative w-10 h-5 transition-colors duration-300 ease-in-out rounded-full ${deptSettings.attendance_closed ? 'bg-rose-500' : 'bg-slate-300'}`}>
              <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ease-in-out ${deptSettings.attendance_closed ? 'transform translate-x-5' : ''}`} />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
          >
            {isSavingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Save 
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          2. DAILY DEPARTMENT OVERVIEW
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 2A. Recent Department Announcements */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[370px] text-left hover:shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-shadow duration-300">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4 text-primary-605" />
              </span>
              Department Announcements
            </h3>
            <Link to="/hod/announcements" className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-2.5 py-1.5 rounded-lg transition-colors">
              Manage
            </Link>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between">
            {announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.slice(0, 4).map((ann) => {
                  const style = CATEGORY_STYLES[ann.category] || CATEGORY_STYLES.General;
                  return (
                    <div
                      key={ann.id}
                      className="p-3.5 rounded-2xl border border-slate-50 hover:border-primary-100 hover:bg-primary-50/5 transition-all duration-300 flex items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border tracking-wider ${style.badge}`}>
                            {ann.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs truncate group-hover:text-primary-600 transition-colors">
                          {ann.title}
                        </h4>
                      </div>
                      
                      <button
                        onClick={() => setSelectedAnn(ann)}
                        className="flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:text-white hover:bg-primary-600 bg-primary-50 px-3 py-2 rounded-xl shrink-0 transition-all duration-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-300 flex-1">
                <Bell className="w-10 h-10 mb-2 text-slate-350" />
                <p className="text-xs font-bold text-slate-400">No announcements posted yet</p>
              </div>
            )}
            
            {announcements.length > 4 && (
              <div className="mt-3 text-center border-t border-slate-50 pt-3">
                <Link to="/hod/announcements" className="text-xs font-bold text-primary-600 hover:text-primary-700">
                  View all {announcements.length} announcements →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 2B. Student Attendance Overview */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[370px] overflow-hidden text-left hover:shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-shadow duration-300 relative">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <ClipboardList className="w-4 h-4 text-emerald-650" />
              </span>
              Student Attendance
            </h3>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-center">
            {dateConditions.isSunday ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
                  <CalendarDays className="w-7 h-7 text-amber-600" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">Weekly Academic Holiday</h4>
                <p className="text-xs text-slate-455 max-w-[220px] mx-auto leading-relaxed">
                  Today is a holiday. Attendance monitoring is unavailable.
                </p>
              </div>
            ) : (!studentAttendanceSummary || !studentAttendanceSummary.isMarkedToday || dateConditions.isBefore10) ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto border border-primary-100">
                  <RefreshCw className="w-5 h-5 text-primary-500 animate-spin" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">Attendance Syncing</h4>
                <p className="text-xs text-slate-455 max-w-[215px] mx-auto leading-relaxed">
                  Today's attendance is currently being updated.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Overall Student Attendance Card */}
                <div className="bg-gradient-to-r from-emerald-50/40 to-teal-50/10 border border-emerald-100/50 rounded-2xl p-4 flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Overall Student Attendance</p>
                    <p className="text-3xl font-black text-emerald-955 mt-1">{studentAttendanceSummary.overallRate}%</p>
                  </div>
                  <div className="w-12 h-12 relative shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-150" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-emerald-500" strokeDasharray={`${studentAttendanceSummary.overallRate}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                  </div>
                </div>

                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Grouped Year-wise (Hover for breakdown)</h4>
                
                <div className="space-y-3.5 relative">
                  {Object.entries(studentAttendanceSummary.yearBreakdown || {}).map(([year, info]) => (
                    <div
                      key={year}
                      className="relative flex items-center gap-3 py-0.5 cursor-pointer group"
                      onMouseEnter={() => setHoveredYear(year)}
                      onMouseLeave={() => setHoveredYear(null)}
                    >
                      <span className="text-[11px] font-bold text-slate-650 w-14 shrink-0">{year}</span>
                      <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/40">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${info.totalRate}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-black text-slate-900 w-8 text-right shrink-0">{info.totalRate}%</span>

                      {/* Tooltip Hover Interaction */}
                      {hoveredYear === year && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 bg-slate-900/95 backdrop-blur-lg text-white text-[11px] rounded-2xl p-4 shadow-xl shadow-slate-950/40 z-50 border border-slate-800 w-[180px] text-left transition-all duration-200">
                          <p className="font-extrabold text-[10px] text-indigo-400 border-b border-slate-800 pb-2 mb-2.5 flex items-center gap-2 uppercase tracking-wider">
                            <Layers className="w-3.5 h-3.5" />
                            {year} Sections
                          </p>
                          <div className="space-y-2">
                            {info.sections.map(sec => {
                              const total = sec.present + sec.absent;
                              const nameParts = sec.name.split(' ');
                              const lastPart = nameParts[nameParts.length - 1];
                              const displayName = lastPart.length === 1 ? `${lastPart} sec` : sec.name;
                              return (
                                <div key={sec.name} className="flex justify-between items-center text-xs font-bold text-slate-200">
                                  <span>{displayName}</span>
                                  <span className="text-emerald-400 font-extrabold">{sec.present}/{total}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2C. Faculty Attendance Summary */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[370px] text-left hover:shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-shadow duration-300 relative">
          <div className="px-6 py-5 border-b border-slate-50">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-indigo-655" />
              </span>
              Faculty Attendance Summary
            </h3>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between">
            <div className="text-[11px] text-slate-450 font-medium mb-3">
              Daily status for department faculty members. Click cards to view details.
            </div>

            <div className="grid grid-cols-1 gap-3 my-2">
              {/* Present Card */}
              <div className="p-4 bg-emerald-50/20 rounded-2xl border border-emerald-100/50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Present Today</p>
                  <p className="text-2xl font-black text-emerald-800 mt-0.5">{facultyAttendanceSummary.presentCount}</p>
                </div>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  Active
                </span>
              </div>

              {/* Absent Card */}
              <button
                onClick={() => setFacultyModalContent({ type: 'Absent', list: facultyAttendanceSummary.absentFaculty })}
                className="p-4 bg-rose-50/20 hover:bg-rose-50/40 active:scale-[0.98] transition-all rounded-2xl border border-rose-100/50 flex items-center justify-between text-left cursor-pointer focus:outline-none group w-full"
              >
                <div>
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Absent Today</p>
                  <p className="text-2xl font-black text-rose-700 mt-0.5">{facultyAttendanceSummary.absentCount}</p>
                </div>
                <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 group-hover:bg-rose-100 transition-colors">
                  View Names
                </span>
              </button>

              {/* On Leave Card */}
              <button
                onClick={() => setFacultyModalContent({ type: 'On Leave', list: facultyAttendanceSummary.onLeaveFaculty })}
                className="p-4 bg-blue-50/20 hover:bg-blue-50/40 active:scale-[0.98] transition-all rounded-2xl border border-blue-100/50 flex items-center justify-between text-left cursor-pointer focus:outline-none group w-full"
              >
                <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">On Leave</p>
                  <p className="text-2xl font-black text-blue-700 mt-0.5">{facultyAttendanceSummary.onLeaveCount}</p>
                </div>
                <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 group-hover:bg-blue-100 transition-colors">
                  View Names
                </span>
              </button>
            </div>

            <div className="text-[10px] text-slate-500 flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>Synced with live faculty leave requests and HOD approvals.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          3. REQUEST MANAGEMENT (Renamed from Actions & Approvals)
      ═══════════════════════════════════════════════════════════ */}
      <div
        id="request-management-card"
        ref={requestManagementRef}
        className="bg-white rounded-[28px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.01)] overflow-hidden text-left hover:shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-shadow duration-300"
      >
        {/* Main Heading for Request Management */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-50 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-primary-600" />
          </span>
          <h3 className="font-extrabold text-slate-800 text-sm">
            Request Management
          </h3>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/30 px-6 py-3 flex items-center overflow-x-auto scrollbar-none">
          <div className="flex gap-2.5 min-w-max py-1.5">
            {[
              { id: 'leaves', label: 'Faculty Leave Requests', count: pendingLeaves.length, color: 'bg-primary-600 text-white shadow-sm border-primary-600', baseColor: 'text-slate-655 hover:bg-slate-100 border-slate-200' },
              { id: 'requests', label: 'Student Requests', count: pendingStudentRequests.length, color: 'bg-primary-600 text-white shadow-sm border-primary-600', baseColor: 'text-slate-655 hover:bg-slate-100 border-slate-200' },
              { id: 'grievances', label: 'Department Grievances', count: disciplineRecords.length, color: 'bg-primary-600 text-white shadow-sm border-primary-600', baseColor: 'text-slate-655 hover:bg-slate-100 border-slate-200' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4.5 py-2 text-xs font-bold rounded-2xl border transition-all duration-300 ${
                  activeTab === tab.id
                    ? `${tab.color}`
                    : `${tab.baseColor} bg-white`
                }`}
              >
                {tab.label} <span className={`ml-1.5 px-2 py-0.5 text-[9px] rounded-full font-black ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* TAB 1: Faculty Leave Requests */}
          {activeTab === 'leaves' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Awaiting HOD approval</h4>
                <Link to="/hod/leave" className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-2.5 py-1.5 rounded-lg flex items-center transition-colors">
                  Open Approvals Page <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              {pendingLeaves.length > 0 ? (
                <div className="divide-y divide-slate-100/60">
                  {pendingLeaves.slice(0, 4).map(req => (
                    <div key={req.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:bg-slate-50/20 px-2 rounded-xl transition-colors duration-200">
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-primary-650 transition-colors">{req.faculty_name}</p>
                        <p className="text-[11px] text-slate-505 mt-1">
                          Type: <span className="font-semibold text-slate-700 capitalize">{req.leave_type}</span> · Dates: <span className="font-semibold text-slate-700">{new Date(req.from_date).toLocaleDateString()} to {new Date(req.to_date).toLocaleDateString()}</span>
                        </p>
                        <p className="text-[11px] text-slate-405 mt-1.5 line-clamp-1 italic bg-slate-50 p-2 rounded-lg border border-slate-100/60">Reason: "{req.reason}"</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-455 bg-slate-105 border border-slate-200/60 px-3 py-1.5 rounded-xl shrink-0">
                        Submitted {timeAgo(req.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8 font-medium">No pending leave requests requiring review.</p>
              )}
            </div>
          )}

          {/* TAB 2: Student Requests */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Student Requests</h4>
                <Link to="/hod/gatepass" className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-2.5 py-1.5 rounded-lg flex items-center transition-colors">
                  Open Requests Page <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              {pendingStudentRequests.length > 0 ? (
                <div className="divide-y divide-slate-100/60">
                  {pendingStudentRequests.slice(0, 4).map(gp => (
                    <div key={gp.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:bg-slate-50/20 px-2 rounded-xl transition-colors duration-200">
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-primary-655 transition-colors">
                          {gp.student?.first_name} {gp.student?.last_name} ({gp.student?.register_number})
                        </p>
                        <p className="text-[11px] text-slate-505 mt-1">
                          Request Type: <span className="font-semibold text-primary-650 bg-primary-50 px-2 py-0.5 rounded border border-primary-100/50">Student Gate Pass</span> · Reason: <span className="text-slate-700 font-medium">"{gp.reason}"</span>
                        </p>
                        <p className="text-[10px] text-emerald-605 font-bold mt-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Approved by Mentor (Pending HOD Sign-off)
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-455 bg-slate-105 border border-slate-200/60 px-3 py-1.5 rounded-xl shrink-0">
                        Submitted {timeAgo(gp.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8 font-medium">No pending student requests requiring HOD approval.</p>
              )}
            </div>
          )}

          {/* TAB 3: Department Grievances */}
          {activeTab === 'grievances' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Grievance Submissions</h4>
                <Link to="/hod/discipline" className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-2.5 py-1.5 rounded-lg flex items-center transition-colors">
                  Open Grievance Management <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              {disciplineRecords.length > 0 ? (
                <div className="divide-y divide-slate-100/60">
                  {disciplineRecords.slice(0, 4).map(rec => {
                    let displayStatus = "Pending";
                    let statusColor = "bg-amber-50 text-amber-700 border-amber-200/50";
                    
                    if (rec.action_status === "Informed") {
                      displayStatus = "In Review";
                      statusColor = "bg-blue-50 text-blue-700 border-blue-200/50";
                    } else if (rec.action_status === "Letter Given" || rec.action_status === "Resolved") {
                      displayStatus = "Resolved";
                      statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200/50";
                    }
                    
                    return (
                      <Link 
                        to="/hod/discipline" 
                        key={rec.id} 
                        className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:bg-slate-50/20 px-2 rounded-xl transition-colors duration-200 block"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                            {rec.remarks || rec.incident_type || 'Academic Issue'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Submitted by: <strong className="text-slate-700">{rec.student_name}</strong> · Reg No: <strong className="text-slate-700">{rec.student_register_number || 'N/A'}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${statusColor}`}>
                            {displayStatus}
                          </span>
                          <span className="text-[10px] font-bold text-slate-455">
                            {new Date(rec.incident_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8 font-medium">No grievances submitted recently.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          3.5 RECENT ACTIVITY FEED & UPCOMING EVENTS (Beneath Request Management)
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        
        {/* Upcoming Events */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.01)] p-6 hover:shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-shadow duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4 text-emerald-655" />
                </span>
                Upcoming Academic Events
              </h3>
              <button
                onClick={() => setShowAddEventModal(true)}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-655 hover:text-white hover:bg-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl transition-all duration-200"
              >
                <Plus className="w-3.5 h-3.5 font-black" />
                Add Event
              </button>
            </div>

            <div className="space-y-4">
              {allEvents.slice(0, 3).map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-2xl border border-slate-50 hover:border-emerald-100 hover:bg-emerald-50/5 transition-all duration-300 flex items-center justify-between gap-4 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        evt.type === 'Academic'
                          ? 'bg-blue-50 text-blue-700 border border-blue-105'
                          : evt.type === 'Placement'
                            ? 'bg-purple-50 text-purple-700 border border-purple-105'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-105'
                      }`}>
                        {evt.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[150px]">{evt.time} · {evt.venue}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs truncate group-hover:text-emerald-700 transition-colors">
                      {evt.name}
                    </h4>
                    <p className="text-[10px] text-slate-455 font-semibold">Organizer: {evt.organizer}</p>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100/80 w-11 h-13.5 rounded-xl shrink-0 group-hover:bg-emerald-50/20 group-hover:border-emerald-100 transition-colors duration-300">
                    <span className="text-[8px] font-black uppercase text-slate-400 leading-none">July</span>
                    <span className="text-sm font-black text-slate-800 leading-none mt-1 group-hover:text-emerald-755">
                      {new Date(evt.date).getDate()}
                    </span>
                    {evt.id.startsWith('hod-evt-') && (
                      <button
                        onClick={() => handleRemoveEvent(evt.id)}
                        className="text-[9px] text-rose-500 hover:text-rose-700 mt-2 font-bold hover:underline"
                      >
                        Del
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.01)] p-6 hover:shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-shadow duration-300">
          <h3 className="font-bold text-slate-800 text-sm mb-6 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-indigo-655" />
            </span>
            Recent Activity Feed
          </h3>

          <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-6">
            {activities.map((act) => (
              <div key={act.id} className="relative group cursor-default">
                <div className={`absolute -left-[33px] top-0 w-5 h-5 rounded-full ${act.bg} border-2 border-white shadow-sm flex items-center justify-center shrink-0 z-10 group-hover:scale-110 transition-transform duration-300`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${act.color.replace('text', 'bg')}`} />
                </div>
                
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 leading-snug group-hover:text-primary-655 transition-colors">
                    {act.text}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">
                    {act.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════
          4. QUICK ACTIONS
      ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.01)] p-6 hover:shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-shadow duration-300">
        <h3 className="font-bold text-slate-800 text-sm mb-5 flex items-center gap-2.5 text-left">
          <span className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-amber-550" />
          </span>
          Quick Actions Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <QuickAction label="Assign Faculty" icon={UserCheck} to="/hod/assignments" color="text-blue-600" bg="bg-blue-50" />
          <QuickAction label="Assign Mentor" icon={Users} to="/hod/mentors" color="text-indigo-600" bg="bg-indigo-50" />
          <QuickAction label="Manage Classes" icon={Layers} to="/hod/sections" color="text-purple-600" bg="bg-purple-50" />
          <QuickAction label="Timetable" icon={Calendar} to="/hod/timetable" color="text-emerald-600" bg="bg-emerald-50" />
          <QuickAction label="Department Announcement" icon={Megaphone} to="/hod/announcements" color="text-amber-600" bg="bg-amber-50" />
          <QuickAction label="Reports" icon={BarChart2} to="/hod/reports" color="text-orange-600" bg="bg-orange-50" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          5. KPI SUMMARY
      ═══════════════════════════════════════════════════════════ */}
      <div>
        <h3 className="font-bold text-slate-855 text-sm mb-4 flex items-center gap-2.5 px-1 text-left">
          <span className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-primary-600" />
          </span>
          Department KPI Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard
            title="Total Faculty"
            value={dashboard?.faculty_count}
            icon={Users}
            color="text-blue-600"
            bg="bg-blue-50"
            to="/hod/faculty"
            sub="Active faculty list"
          />
          <KPICard
            title="Total Students"
            value={dashboard?.student_count}
            icon={GraduationCap}
            color="text-emerald-600"
            bg="bg-emerald-50"
            to="/hod/students"
            sub="Enrolled database"
          />
          <KPICard
            title="Active Courses"
            value={dashboard?.course_count}
            icon={BookOpen}
            color="text-amber-600"
            bg="bg-amber-50"
            to="/hod/assignments"
            sub="Syllabus catalog"
          />
          <KPICard
            title="Classes (Sections)"
            value={dashboard?.section_count}
            icon={Layers}
            color="text-purple-600"
            bg="bg-purple-50"
            to="/hod/sections"
            sub="Active year groups"
          />
          <KPICard
            title="Pass Percentage"
            value={`${averagePassPercentage}%`}
            icon={CheckCircle2}
            color="text-teal-600"
            bg="bg-teal-50"
            to="/hod/results"
            sub="Exam averages"
          />
          <KPICard
            title="Department Attendance"
            value="93%"
            icon={ClipboardList}
            color="text-rose-600"
            bg="bg-rose-50"
            to="/hod/attendance"
            sub="Daily average"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 8 — ANNOUNCEMENT DETAIL MODAL
      ═══════════════════════════════════════════════════════════ */}
      {selectedAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[4px]">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded border ${CATEGORY_STYLES[selectedAnn.category]?.badge || CATEGORY_STYLES.General.badge}`}>
                  {selectedAnn.category}
                </span>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Announcement Details</h3>
              </div>
              <button
                onClick={() => setSelectedAnn(null)}
                className="p-2 text-slate-400 hover:text-slate-655 hover:bg-slate-100 rounded-2xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5 text-left">
                <h2 className="text-xl font-black text-slate-900 leading-snug tracking-tight">
                  {selectedAnn.title}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold">
                  <span>By {selectedAnn.author?.name || 'System'}</span>
                  <span>•</span>
                  <span>{new Date(selectedAnn.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="text-xs text-slate-655 whitespace-pre-wrap leading-relaxed text-left">
                  {selectedAnn.content}
                </p>
              </div>

              <div className="pt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-bold border-t border-slate-50">
                <span>Audience: {selectedAnn.target_audience || 'Everyone'}</span>
                <span>Scope: {selectedAnn.is_global ? 'College-wide' : 'Departmental'}</span>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAnn(null)}
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl hover:bg-slate-955 transition-colors shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION 9 — ADD MANUAL EVENT MODAL
      ═══════════════════════════════════════════════════════════ */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[4px]">
          <form onSubmit={handleAddEvent} className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-150 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="px-6 py-4 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Add Departmental Event</h3>
              <button
                type="button"
                onClick={() => setShowAddEventModal(false)}
                className="p-2 text-slate-400 hover:text-slate-655 hover:bg-slate-100 rounded-2xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guest Lecture on Cloud Architecture"
                  value={newEvent.name}
                  onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Event Type</label>
                  <select
                    value={newEvent.type}
                    onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="Departmental">Departmental</option>
                    <option value="Academic">Academic</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:30 AM"
                    value={newEvent.time}
                    onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Venue</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Seminar Hall I"
                    value={newEvent.venue}
                    onChange={e => setNewEvent({ ...newEvent, venue: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddEventModal(false)}
                className="px-4 py-2.5 text-slate-500 text-xs font-bold rounded-2xl hover:bg-slate-150 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-650 text-white text-xs font-bold rounded-2xl hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Create Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Faculty Attendance Modal */}
      {facultyModalContent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 relative text-left">
            <button
              onClick={() => setFacultyModalContent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 p-1 hover:bg-slate-50 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2.5 border-b border-slate-50 pb-3 mb-4">
              <span className={`w-2.5 h-2.5 rounded-full ${facultyModalContent.type === 'Absent' ? 'bg-rose-500' : 'bg-blue-500'}`} />
              Faculty {facultyModalContent.type}
            </h3>

            {facultyModalContent.list.length > 0 ? (
              <ul className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {facultyModalContent.list.map((name, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                    👨‍🏫 {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 font-semibold text-center py-6">
                No faculty members are {facultyModalContent.type.toLowerCase()} today.
              </p>
            )}

            <button
              onClick={() => setFacultyModalContent(null)}
              className="w-full mt-5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
