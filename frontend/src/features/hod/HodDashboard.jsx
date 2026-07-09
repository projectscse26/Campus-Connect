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

const KPICard = ({ title, value, icon: Icon, to, sub, color, bg }) => (
  <Link
    to={to}
    className="group bg-white dark:bg-gray-50/50 rounded-3xl border border-slate-100 dark:border-gray-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] dark:shadow-md hover:shadow-[0_12px_30px_rgba(37,99,235,0.06)] dark:hover:shadow-xl dark:hover:bg-gray-100/50 hover:border-primary-100 dark:hover:border-gray-300 hover:-translate-y-1 transition-all duration-300 p-5 sm:p-7 flex flex-col justify-between min-h-[160px] relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    <div className="flex items-center justify-between relative z-10">
      <div className={`w-12 h-12 rounded-2xl ${bg} dark:bg-gray-100 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300`}>
        <Icon className={`w-6 h-6 ${color} dark:text-gray-800`} strokeWidth={2} />
      </div>
      <span className="text-[11px] font-bold text-slate-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-gray-900 transition-colors flex items-center gap-0.5">
        Open <ArrowUpRight className="w-4 h-4" />
      </span>
    </div>
    <div className="mt-5 relative z-10">
      <p className="text-4xl font-black text-slate-900 dark:text-gray-900 leading-none mb-2 tracking-tight">
        {value ?? <span className="text-slate-355 dark:text-gray-400">—</span>}
      </p>
      <p className="text-xs font-extrabold text-slate-400 dark:text-gray-600 uppercase tracking-wider">{title}</p>
      {sub && <p className="text-[11px] text-slate-455 dark:text-gray-500 mt-1.5 font-medium">{sub}</p>}
    </div>
  </Link>
);

const QuickAction = ({ label, icon: Icon, to, color, bg }) => (
  <Link
    to={to}
    className="group flex flex-col items-center justify-center p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-gray-200/60 bg-white dark:bg-gray-50/50 hover:border-slate-200 dark:hover:border-gray-300 hover:shadow-lg dark:hover:shadow-2xl dark:hover:bg-gray-100/50 hover:-translate-y-1 transition-all duration-300 text-center relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    <div className={`w-14 h-14 rounded-2xl ${bg} dark:bg-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm mb-4 relative z-10`}>
      <Icon className={`w-6 h-6 ${color} dark:text-gray-800`} strokeWidth={2} />
    </div>
    <span className="text-sm font-bold text-slate-700 dark:text-gray-600 group-hover:text-slate-900 dark:group-hover:text-gray-900 transition-colors block leading-tight relative z-10">{label}</span>
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
        axios.get('/api/announcements/'),
        axios.get('/api/leave/requests'),
        axios.get('/api/gatepass/hod'),
        axios.get('/api/discipline/'),
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

  const handleUpdateSettings = async (updates) => {
    const nextSettings = { ...deptSettings, ...updates };
    setDeptSettings(nextSettings);
    try {
      await axios.put('/api/hod/department-settings', {
        current_sem_start_date: nextSettings.current_sem_start_date ? new Date(nextSettings.current_sem_start_date).toISOString() : null,
        attendance_closed: nextSettings.attendance_closed
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update department settings');
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
      <div className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-900 rounded-[2rem] p-6 sm:p-8 md:p-10 overflow-hidden shadow-2xl shadow-indigo-900/20 hover:shadow-indigo-900/30 transition-all duration-500">
        
        {/* Subtle background decoration (5-8% opacity) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.08] select-none mix-blend-overlay">
          <svg className="absolute -right-16 -top-16 w-[450px] h-[450px] text-[#ffffff]" fill="currentColor" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" />
          </svg>
          <svg className="absolute -left-20 -bottom-20 w-[350px] h-[350px] text-[#ffffff]" fill="currentColor" viewBox="0 0 100 100">
            <polygon points="50,15 90,85 10,85" />
          </svg>
          {/* Subtle Grid / Dot pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_2px,transparent_2px)] [background-size:32px_32px] opacity-70" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-6 z-10">
          
          {/* Left Column: Greeting, Department Details, Academic Info, Status Badge */}
          <div className="space-y-6 text-left max-w-xl text-[#ffffff]">
            
            {/* Working Day Status & Current Date */}
            <div className="flex flex-wrap items-center gap-3">
              {dateConditions.isSunday ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-[#ffffff] backdrop-blur-md shadow-inner">
                  🔴 Holiday
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-[#ffffff] backdrop-blur-md shadow-inner">
                  🟢 Working Day
                </span>
              )}
              
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-[#ffffff] backdrop-blur-md shadow-inner">
                {formatFullDate()}
              </span>
            </div>
            
            {/* Typography Hierarchy */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                {greetingText}, {user?.name || user?.first_name || user?.email?.split('@')[0] || 'HOD'}
              </h1>
              <p className="text-white/80 text-[#ffffff]/80 text-xs font-bold tracking-wide">
                D.C.T., B.Tech., M.E., Ph.D.
              </p>
              <div className="pt-2">
                <p className="text-white/90 text-[#ffffff]/90 text-xs font-bold uppercase tracking-widest text-indigo-200">
                  Head of Department
                </p>
                <p className="text-[#ffffff] text-lg sm:text-xl font-extrabold tracking-wide uppercase mt-1">
                  {dashboard?.department_name || 'Computer Science & Engineering'}
                </p>
              </div>
            </div>

            {/* Academic Info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/90 text-[#ffffff]/90 text-xs font-semibold pt-1">
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
              className="inline-flex items-center gap-2.5 bg-white/15 border border-white/20 px-4 py-2 rounded-full backdrop-blur-md hover:bg-white/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm text-[#ffffff] focus:outline-none cursor-pointer"
            >
              <Bell className="w-4 h-4 text-[#ffffff] fill-white/10" />
              <span className="text-xs font-bold tracking-wide">Requests</span>
              {totalUnseenCount > 0 && (
                <span className="bg-rose-500 text-[#ffffff] text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
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
      <div className="bg-white dark:bg-gray-50 rounded-[28px] p-8 border border-slate-100 dark:border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.01)] dark:shadow-xl text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-extrabold text-slate-800 dark:text-gray-900 text-base sm:text-lg mb-1 flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
              <CalendarDays className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </span>
            Semester Settings & Attendance Controls
          </h3>
          <p className="text-sm text-slate-500 dark:text-gray-600 font-medium ml-14">Configure your department's working dates and instantly lock attendance marking.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
          {/* Start Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-gray-100/50 p-2 rounded-xl border border-slate-100 dark:border-gray-200 w-full sm:w-auto">
            <span className="text-sm font-bold text-slate-600 dark:text-gray-700 px-3 whitespace-nowrap">Sem Start:</span>
            <input
              type="date"
              className="bg-white dark:bg-gray-100 text-sm font-bold text-slate-700 dark:text-gray-900 px-3 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-primary-500 w-full sm:w-auto outline-none"
              value={deptSettings.current_sem_start_date}
              onChange={(e) => handleUpdateSettings({ current_sem_start_date: e.target.value })}
            />
          </div>

          {/* Attendance Lock Toggle */}
          <div className="flex items-center gap-3 bg-rose-50/50 dark:bg-rose-500/10 p-2.5 rounded-xl border border-rose-100 dark:border-rose-500/20 w-full sm:w-auto px-5 cursor-pointer" onClick={() => handleUpdateSettings({ attendance_closed: !deptSettings.attendance_closed })}>
            <span className={`text-sm font-bold ${deptSettings.attendance_closed ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-gray-500'}`}>
              {deptSettings.attendance_closed ? "Attendance Locked" : "Attendance Open"}
            </span>
            <div className={`relative w-11 h-6 transition-colors duration-300 ease-in-out rounded-full ${deptSettings.attendance_closed ? 'bg-rose-500' : 'bg-slate-300 dark:bg-gray-400'}`}>
              <div className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ease-in-out ${deptSettings.attendance_closed ? 'transform translate-x-5' : ''}`} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          2. DAILY DEPARTMENT OVERVIEW
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 2A. Recent Department Announcements */}
        <div className="bg-white dark:bg-gray-50 rounded-[28px] border border-slate-100 dark:border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.01)] dark:shadow-xl flex flex-col justify-between min-h-[420px] text-left hover:shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-shadow duration-300">
          <div className="px-8 py-6 border-b border-slate-50 dark:border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-gray-900 text-base flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-gray-100 flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </span>
              Department Announcements
            </h3>
            <Link to="/hod/announcements" className="text-sm font-bold text-primary-600 dark:text-gray-900 hover:text-primary-700 bg-primary-50 dark:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
              Manage
            </Link>
          </div>

          <div className="p-8 flex-1 flex flex-col justify-between">
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
              <div className="flex flex-col items-center justify-center py-10 text-slate-300 dark:text-gray-600 flex-1">
                <Bell className="w-10 h-10 mb-2 text-slate-300 dark:text-gray-600" />
                <p className="text-xs font-bold text-slate-400 dark:text-gray-600">No announcements posted yet</p>
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
        <div className="bg-white dark:bg-gray-50 rounded-[28px] border border-slate-100 dark:border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.01)] dark:shadow-xl flex flex-col justify-between min-h-[420px] overflow-hidden text-left hover:shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-shadow duration-300 relative">
          <div className="px-8 py-6 border-b border-slate-50 dark:border-gray-100 flex items-center justify-between bg-slate-50/20 dark:bg-transparent">
            <h3 className="font-bold text-slate-800 dark:text-gray-900 text-base flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </span>
              Student Attendance
            </h3>
          </div>

          <div className="p-8 flex-1 flex flex-col justify-center">
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
            ) : (!studentAttendanceSummary || (dateConditions.isBefore10 && !studentAttendanceSummary.isMarkedToday)) ? (
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
              <div className="space-y-5">
                {/* Overall Student Attendance Card */}
                <div className="bg-gradient-to-r from-emerald-50/40 to-teal-50/10 dark:from-gray-100 dark:to-transparent border border-emerald-100/50 dark:border-gray-200 rounded-2xl p-4 flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Overall Student Attendance</p>
                    <p className="text-3xl font-black text-emerald-950 dark:text-gray-900 mt-1">{studentAttendanceSummary.overallRate}%</p>
                  </div>
                  <div className="w-12 h-12 relative shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-150" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-emerald-500" strokeDasharray={`${studentAttendanceSummary.overallRate}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                  </div>
                </div>

                <h4 className="text-xs font-black text-slate-400 dark:text-gray-550 uppercase tracking-wider mb-4">Department Student Attendance Overview</h4>
                
                <div className="border border-slate-150 dark:border-gray-200 rounded-[20px] overflow-hidden shadow-sm">
                  {/* Table Header */}
                  <div className="grid grid-cols-5 items-center px-6 py-4 text-xs font-black bg-slate-50 dark:bg-gray-150 text-slate-500 dark:text-gray-500 uppercase tracking-wider border-b border-slate-150 dark:border-gray-200">
                    <span className="col-span-2 text-left">Year / Section</span>
                    <span className="text-center">Total</span>
                    <span className="text-center">Present</span>
                    <span className="text-center">Absent</span>
                    <span className="text-right">Rate</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-gray-200 relative">
                    {Object.entries(studentAttendanceSummary.yearBreakdown || {}).map(([year, info]) => {
                      const totalStudents = info.sections?.reduce((sum, s) => sum + (s.total_students || 0), 0) || 0;
                      const totalPresent = info.sections?.reduce((sum, s) => sum + (s.present || 0), 0) || 0;
                      const totalAbsent = info.sections?.reduce((sum, s) => sum + (s.absent || 0), 0) || 0;
                      const isAnyMarked = info.sections?.some(s => s.is_marked) || false;

                      return (
                        <div key={year} className="flex flex-col">
                          {/* Year Row */}
                          <div className="grid grid-cols-5 items-center py-4 px-6 text-sm font-black text-slate-800 dark:text-gray-900 bg-slate-50/20 dark:bg-transparent">
                            <span className="col-span-2 text-left font-black text-slate-900 dark:text-gray-900">{year}</span>
                            <span className="text-center font-bold text-slate-700 dark:text-gray-700">{totalStudents}</span>
                            <span className="text-center font-extrabold text-emerald-600 dark:text-emerald-450">{isAnyMarked ? totalPresent : '—'}</span>
                            <span className="text-center font-bold text-rose-600 dark:text-rose-455">{isAnyMarked ? totalAbsent : '—'}</span>
                            <span className="text-right font-black text-slate-900 dark:text-gray-900">{isAnyMarked ? `${info.totalRate}%` : '—'}</span>
                          </div>

                          {/* Sections Rows */}
                          <div className="bg-white/50 dark:bg-transparent">
                            {info.sections.map(sec => {
                              const isMarked = sec.is_marked;
                              const nameParts = sec.name.split(' ');
                              const lastPart = nameParts[nameParts.length - 1];
                              const displayName = lastPart.length === 1 ? `${lastPart} sec` : sec.name;
                              const secRate = isMarked && (sec.present + sec.absent > 0)
                                ? Math.round((sec.present / (sec.present + sec.absent)) * 100)
                                : 0;

                              return (
                                <div key={sec.name} className="grid grid-cols-5 items-center py-3.5 px-6 text-xs font-semibold text-slate-600 dark:text-gray-700 pl-12 border-t border-slate-100/50 dark:border-gray-200">
                                  <span className="col-span-2 text-left text-slate-500 font-bold border-l-4 border-indigo-400 pl-3">{displayName}</span>
                                  <span className="text-center font-bold text-slate-500">{sec.total_students}</span>
                                  <span className="text-center font-extrabold text-emerald-500 dark:text-emerald-400">{isMarked ? sec.present : '—'}</span>
                                  <span className="text-center font-bold text-rose-500 dark:text-rose-455">{isMarked ? sec.absent : '—'}</span>
                                  <span className="text-right font-black text-slate-700 dark:text-gray-900">{isMarked ? `${secRate}%` : '—'}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2C. Faculty Attendance Summary */}
        <div className="bg-white dark:bg-gray-50 rounded-[28px] border border-slate-100 dark:border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.01)] dark:shadow-xl flex flex-col justify-between min-h-[420px] text-left hover:shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-shadow duration-300 relative">
          <div className="px-8 py-6 border-b border-slate-50 dark:border-gray-100">
            <h3 className="font-bold text-slate-800 dark:text-gray-900 text-base flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </span>
              Faculty Attendance Summary
            </h3>
          </div>

          <div className="p-8 flex-1 flex flex-col justify-between">
            <div className="text-xs text-slate-500 dark:text-gray-600 font-medium mb-3">
              Daily status for department faculty members. Click cards to view details.
            </div>

            <div className="grid grid-cols-1 gap-3 my-2">
              {/* Present Card */}
              <div className="p-4 bg-emerald-50/20 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/20 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Present Today</p>
                  <p className="text-2xl font-black text-emerald-800 dark:text-gray-900 mt-0.5">{facultyAttendanceSummary.presentCount}</p>
                </div>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                  Active
                </span>
              </div>

              {/* Absent Card */}
              <button
                onClick={() => setFacultyModalContent({ type: 'Absent', list: facultyAttendanceSummary.absentFaculty })}
                className="p-4 bg-rose-50/20 dark:bg-rose-500/5 hover:bg-rose-50/40 dark:hover:bg-rose-500/10 active:scale-[0.98] transition-all rounded-2xl border border-rose-100/50 dark:border-rose-500/20 flex items-center justify-between text-left cursor-pointer focus:outline-none group w-full"
              >
                <div>
                  <p className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">Absent Today</p>
                  <p className="text-2xl font-black text-rose-700 dark:text-gray-900 mt-0.5">{facultyAttendanceSummary.absentCount}</p>
                </div>
                <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-100 dark:border-rose-500/20 group-hover:bg-rose-100 dark:group-hover:bg-rose-500/20 transition-colors">
                  View Names
                </span>
              </button>

              {/* On Leave Card */}
              <button
                onClick={() => setFacultyModalContent({ type: 'On Leave', list: facultyAttendanceSummary.onLeaveFaculty })}
                className="p-4 bg-blue-50/20 dark:bg-blue-500/5 hover:bg-blue-50/40 dark:hover:bg-blue-500/10 active:scale-[0.98] transition-all rounded-2xl border border-blue-100/50 dark:border-blue-500/20 flex items-center justify-between text-left cursor-pointer focus:outline-none group w-full"
              >
                <div>
                  <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">On Leave</p>
                  <p className="text-2xl font-black text-blue-700 dark:text-gray-900 mt-0.5">{facultyAttendanceSummary.onLeaveCount}</p>
                </div>
                <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-500/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                  View Names
                </span>
              </button>
            </div>

            <div className="text-[10px] text-slate-500 dark:text-gray-700 flex items-start gap-2 bg-slate-50 dark:bg-gray-100 p-3 rounded-xl border border-slate-100 dark:border-gray-200 mt-2">
              <Info className="w-4 h-4 text-slate-400 dark:text-gray-600 shrink-0 mt-0.5" />
              <span className="dark:text-gray-600">Synced with live faculty leave requests and HOD approvals.</span>
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
        className="bg-white dark:bg-gray-50 rounded-[28px] border border-slate-100 dark:border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.01)] dark:shadow-xl overflow-hidden text-left hover:shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-shadow duration-300"
      >
        {/* Main Heading for Request Management */}
        <div className="px-8 pt-6 pb-4 border-b border-slate-50 dark:border-gray-100 flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </span>
          <h3 className="font-extrabold text-slate-800 dark:text-gray-900 text-base">
            Request Management
          </h3>
        </div>

        <div className="border-b border-slate-100 dark:border-gray-200 bg-slate-50/30 dark:bg-transparent px-8 py-4 flex items-center overflow-x-auto scrollbar-none">
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
                    : `${tab.baseColor} bg-white dark:bg-transparent dark:text-gray-700 dark:border-gray-200 dark:hover:bg-gray-100`
                }`}
              >
                {tab.label} <span className={`ml-1.5 px-2 py-0.5 text-[9px] rounded-full font-black ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-gray-100 text-slate-500 dark:text-gray-600'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          {/* TAB 1: Faculty Leave Requests */}
          {activeTab === 'leaves' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-gray-200 pb-3 mb-2">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-wider">Awaiting HOD approval</h4>
                <Link to="/hod/leave" className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-500/10 px-2.5 py-1.5 rounded-lg flex items-center transition-colors">
                  Open Approvals Page <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              {pendingLeaves.length > 0 ? (
                <div className="divide-y divide-slate-100/60 dark:divide-gray-200">
                  {pendingLeaves.slice(0, 4).map(req => (
                    <div key={req.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:bg-slate-50/20 dark:hover:bg-gray-100/50 px-2 rounded-xl transition-colors duration-200">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-gray-900 group-hover:text-primary-650 transition-colors">{req.faculty_name}</p>
                        <p className="text-[11px] text-slate-505 dark:text-gray-700 mt-1">
                          Type: <span className="font-semibold text-slate-700 dark:text-gray-900 capitalize">{req.leave_type}</span> · Dates: <span className="font-semibold text-slate-700 dark:text-gray-900">{new Date(req.from_date).toLocaleDateString()} to {new Date(req.to_date).toLocaleDateString()}</span>
                        </p>
                        <p className="text-[11px] text-slate-405 dark:text-gray-600 mt-1.5 line-clamp-1 italic bg-slate-50 dark:bg-gray-100 p-2 rounded-lg border border-slate-100/60 dark:border-gray-200">Reason: "{req.reason}"</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-455 dark:text-gray-700 bg-slate-105 dark:bg-gray-100 border border-slate-200/60 dark:border-gray-200 px-3 py-1.5 rounded-xl shrink-0">
                        Submitted {timeAgo(req.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-gray-600 text-center py-8 font-medium">No pending leave requests requiring review.</p>
              )}
            </div>
          )}

          {/* TAB 2: Student Requests */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-gray-200 pb-3 mb-2">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-wider">Pending Student Requests</h4>
                <Link to="/hod/gatepass" className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-500/10 px-2.5 py-1.5 rounded-lg flex items-center transition-colors">
                  Open Requests Page <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              {pendingStudentRequests.length > 0 ? (
                <div className="divide-y divide-slate-100/60 dark:divide-gray-200">
                  {pendingStudentRequests.slice(0, 4).map(gp => (
                    <div key={gp.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:bg-slate-50/20 dark:hover:bg-gray-100/50 px-2 rounded-xl transition-colors duration-200">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-gray-900 group-hover:text-primary-655 transition-colors">
                          {gp.student?.first_name} {gp.student?.last_name} ({gp.student?.register_number})
                        </p>
                        <p className="text-[11px] text-slate-505 dark:text-gray-700 mt-1">
                          Request Type: <span className="font-semibold text-primary-650 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded border border-primary-100/50 dark:border-primary-500/20">Student Gate Pass</span> · Reason: <span className="text-slate-700 dark:text-gray-900 font-medium">"{gp.reason}"</span>
                        </p>
                        <p className="text-[10px] text-emerald-605 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Approved by Mentor (Pending HOD Sign-off)
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-455 dark:text-gray-700 bg-slate-105 dark:bg-gray-100 border border-slate-200/60 dark:border-gray-200 px-3 py-1.5 rounded-xl shrink-0">
                        Submitted {timeAgo(gp.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-gray-600 text-center py-8 font-medium">No pending student requests requiring HOD approval.</p>
              )}
            </div>
          )}

          {/* TAB 3: Department Grievances */}
          {activeTab === 'grievances' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-gray-200 pb-3 mb-2">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-wider">Academic Grievance Submissions</h4>
                <Link to="/hod/discipline" className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-500/10 px-2.5 py-1.5 rounded-lg flex items-center transition-colors">
                  Open Grievance Management <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              {disciplineRecords.length > 0 ? (
                <div className="divide-y divide-slate-100/60 dark:divide-gray-200">
                  {disciplineRecords.slice(0, 4).map(rec => {
                    let displayStatus = "Pending";
                    let statusColor = "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20";
                    
                    if (rec.action_status === "Informed") {
                      displayStatus = "In Review";
                      statusColor = "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20";
                    } else if (rec.action_status === "Letter Given" || rec.action_status === "Resolved") {
                      displayStatus = "Resolved";
                      statusColor = "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20";
                    }
                    
                    return (
                      <Link 
                        to="/hod/discipline" 
                        key={rec.id} 
                        className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:bg-slate-50/20 dark:hover:bg-gray-100/50 px-2 rounded-xl transition-colors duration-200 block"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-gray-900 group-hover:text-primary-600 transition-colors">
                            {rec.remarks || rec.incident_type || 'Academic Issue'}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-gray-700">
                            Submitted by: <strong className="text-slate-700 dark:text-gray-900">{rec.student_name}</strong> · Reg No: <strong className="text-slate-700 dark:text-gray-900">{rec.student_register_number || 'N/A'}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${statusColor}`}>
                            {displayStatus}
                          </span>
                          <span className="text-[10px] font-bold text-slate-455 dark:text-gray-600">
                            {new Date(rec.incident_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-gray-600 text-center py-8 font-medium">No grievances submitted recently.</p>
              )}
            </div>
          )}
        </div>
      </div>



      {/* ═══════════════════════════════════════════════════════════
          4. QUICK ACTIONS
      ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-gray-50 rounded-[28px] border border-slate-100 dark:border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.01)] dark:shadow-xl p-8 hover:shadow-[0_8px_32px_rgba(0,0,0,0.02)] transition-shadow duration-300">
        <h3 className="font-bold text-slate-800 dark:text-gray-900 text-base mb-5 flex items-center gap-3 text-left">
          <span className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-amber-550 dark:text-amber-400" />
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
        <h3 className="font-bold text-slate-855 dark:text-gray-900 text-sm mb-4 flex items-center gap-2.5 px-1 text-left">
          <span className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-primary-600 dark:text-primary-400" />
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
