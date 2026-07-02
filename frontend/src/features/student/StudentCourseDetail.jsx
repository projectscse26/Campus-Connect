import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import StudentCourseService from './StudentCourseService';
import {
  ArrowLeft, BookOpen, FileText, ClipboardList, Megaphone,
  BookMarked, BarChart3, Download, ExternalLink, Loader2,
  AlertCircle, Hash, User, Calendar, CheckCircle2, XCircle,
  MinusCircle, Clock, FileDown, Link2, Inbox, GraduationCap,
  Award, ChevronRight, Layers,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// CONSTANTS & HELPERS
// ─────────────────────────────────────────────────────────

const RESOURCE_TYPE_ICONS = {
  notes:      FileText,
  reference:  BookOpen,
  video:      BookMarked,
  syllabus:   BookMarked,
  assignment: ClipboardList,
};

const RESOURCE_TYPE_STYLES = {
  notes:      { bg: 'bg-blue-50',    text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700'    },
  reference:  { bg: 'bg-violet-50',  text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700'},
  video:      { bg: 'bg-rose-50',    text: 'text-rose-700',   badge: 'bg-rose-100 text-rose-700'    },
  syllabus:   { bg: 'bg-emerald-50', text: 'text-emerald-700',badge: 'bg-emerald-100 text-emerald-700'},
  assignment: { bg: 'bg-amber-50',   text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700'  },
};

const ATTENDANCE_STATUS_CONFIG = {
  present: { Icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-400', label: 'Present' },
  absent:  { Icon: XCircle,     color: 'text-red-600',     bg: 'bg-red-50 border-red-100',         dot: 'bg-red-400',     label: 'Absent'  },
  on_duty: { Icon: MinusCircle, color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-100',       dot: 'bg-blue-400',    label: 'On Duty' },
  late:    { Icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100',     dot: 'bg-amber-400',   label: 'Late'    },
};

const COURSE_TYPE_BADGE = {
  theory:   'bg-blue-100 text-blue-700',
  lab:      'bg-emerald-100 text-emerald-700',
  elective: 'bg-purple-100 text-purple-700',
  project:  'bg-amber-100 text-amber-700',
};

const FEATURES = [
  {
    id: 'resources',
    title: 'Resources',
    description: 'Lecture notes, slides, reference links & course materials.',
    icon: FileText,
    accentColor: 'text-blue-600',
    bgColor: 'bg-blue-50/60',
    accentBar: 'from-blue-400 to-indigo-400',
    lightBg: 'bg-blue-50',
  },
  {
    id: 'assignments',
    title: 'Assignments',
    description: 'Posted assignments with due dates and submission details.',
    icon: ClipboardList,
    accentColor: 'text-violet-600',
    bgColor: 'bg-violet-50/60',
    accentBar: 'from-violet-400 to-purple-400',
    lightBg: 'bg-violet-50',
  },
  {
    id: 'announcements',
    title: 'Announcements',
    description: 'Important updates and notices from your faculty.',
    icon: Megaphone,
    accentColor: 'text-rose-600',
    bgColor: 'bg-rose-50/60',
    accentBar: 'from-rose-400 to-pink-400',
    lightBg: 'bg-rose-50',
  },
  {
    id: 'syllabus',
    title: 'Syllabus',
    description: 'Course outcomes, modules and grading criteria.',
    icon: BookMarked,
    accentColor: 'text-orange-600',
    bgColor: 'bg-orange-50/60',
    accentBar: 'from-orange-400 to-amber-400',
    lightBg: 'bg-orange-50',
  },
  {
    id: 'attendance',
    title: 'Attendance',
    description: 'Your attendance summary and day-by-day history.',
    icon: BarChart3,
    accentColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50/60',
    accentBar: 'from-emerald-400 to-teal-400',
  },
  {
    id: 'marks',
    title: 'My Marks',
    description: 'Your published assessment marks and retest results.',
    icon: Award,
    accentColor: 'text-amber-600',
    bgColor: 'bg-amber-50/60',
    accentBar: 'from-amber-400 to-yellow-400',
    lightBg: 'bg-amber-50',
  },
];

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─────────────────────────────────────────────────────────
// SHARED UI COMPONENTS
// ─────────────────────────────────────────────────────────

const SectionLoading = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
    <p className="text-sm text-gray-400 font-medium">Loading…</p>
  </div>
);

const SectionError = ({ message }) => (
  <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4">
    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
    <div>
      <p className="font-bold text-[14px]">Failed to load</p>
      <p className="text-[13px] mt-0.5 text-red-600">{message}</p>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center mb-5">
      <Icon className="w-9 h-9 text-gray-300" strokeWidth={1.3} />
    </div>
    <h4 className="text-[15px] font-bold text-gray-600 mb-1.5">{title}</h4>
    <p className="text-[13px] text-gray-400 max-w-xs leading-relaxed">{description}</p>
  </div>
);

const FileButton = ({ url, label, isDownload }) => {
  if (!url) return null;
  return (
    <a
      href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3.5 py-1.5 rounded-xl border transition-all
        bg-white border-gray-200 text-gray-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700"
    >
      {isDownload ? <Download className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
      {label}
    </a>
  );
};

// ─────────────────────────────────────────────────────────
// SECTION HEADER (shown when a tab is active)
// ─────────────────────────────────────────────────────────
const SectionHeader = ({ feature, onBack }) => {
  const Icon = feature.icon;
  return (
    <div className={`relative bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6 shadow-sm`}>
      <div className={`h-1 bg-gradient-to-r ${feature.accentBar}`} />
      <div className="px-5 py-4 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-2xl ${feature.lightBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${feature.iconColor}`} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[17px] font-bold text-gray-900">{feature.title}</h2>
          <p className="text-[12px] text-gray-400 font-medium">{feature.description}</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] font-bold text-gray-400 hover:text-primary-600 bg-gray-50 hover:bg-primary-50 px-3.5 py-2 rounded-xl transition-colors border border-gray-200 hover:border-primary-200 flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// RESOURCE CARD
// ─────────────────────────────────────────────────────────
const ResourceCard = ({ item }) => {
  const TypeIcon = RESOURCE_TYPE_ICONS[item.resource_type] || FileText;
  const styles = RESOURCE_TYPE_STYLES[item.resource_type] || { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-600' };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
      <div className="p-4 sm:p-5 flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.bg} group-hover:scale-105 transition-transform`}>
          <TypeIcon className={`w-5 h-5 ${styles.text}`} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="text-[14px] font-bold text-gray-900 leading-snug">{item.title}</h4>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles.badge}`}>
              {item.resource_type}
            </span>
          </div>
          {item.description && (
            <p className="text-[13px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 mb-3">
            {item.uploaded_by && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                <User className="w-3 h-3" /> {item.uploaded_by}
              </span>
            )}
            {item.created_at && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                <Calendar className="w-3 h-3" /> {formatDate(item.created_at)}
              </span>
            )}
          </div>
          {(item.file_url || item.external_link) && (
            <div className="flex flex-wrap gap-2">
              {item.file_url && <FileButton url={item.file_url} label="Download" isDownload />}
              {item.external_link && <FileButton url={item.external_link} label="Open Link" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// TAB: RESOURCES
// ─────────────────────────────────────────────────────────
const ResourcesTab = ({ courseId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    StudentCourseService.getCourseResources(courseId)
      .then(setData)
      .catch(e => setError(e.response?.data?.detail || 'Failed to load resources'))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <SectionLoading />;
  if (error) return <SectionError message={error} />;
  if (!data?.length) return (
    <EmptyState icon={FileDown} title="No Resources Yet"
      description="Your faculty hasn't uploaded any learning materials yet. Check back later." />
  );

  return (
    <div className="space-y-3">
      {data.map(item => <ResourceCard key={item.id} item={item} />)}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// TAB: ASSIGNMENTS
// ─────────────────────────────────────────────────────────
const AssignmentsTab = ({ courseId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    StudentCourseService.getCourseAssignments(courseId)
      .then(setData)
      .catch(e => setError(e.response?.data?.detail || 'Failed to load assignments'))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <SectionLoading />;
  if (error) return <SectionError message={error} />;
  if (!data?.length) return (
    <EmptyState icon={ClipboardList} title="No Assignments Yet"
      description="No assignments have been posted for this course yet." />
  );

  return (
    <div className="space-y-4">
      {data.map(item => {
        const now = new Date();
        const due = item.due_date ? new Date(item.due_date) : null;
        const isOverdue = due && due < now;
        const isDueSoon = due && !isOverdue && (due - now) < 3 * 24 * 60 * 60 * 1000;

        return (
          <div key={item.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${isOverdue ? 'border-red-100' : isDueSoon ? 'border-amber-100' : 'border-gray-100'}`}>
            <div className={`h-0.5 ${isOverdue ? 'bg-red-400' : isDueSoon ? 'bg-amber-400' : 'bg-violet-300'}`} />
            <div className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <h4 className="text-[14px] font-bold text-gray-900">{item.title}</h4>
                    {due && (
                      <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        isOverdue ? 'bg-red-50 text-red-600 border-red-200' :
                        isDueSoon ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                    'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {isOverdue ? 'Overdue: ' : 'Due: '}{formatDate(item.due_date)}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[13px] text-gray-500 leading-relaxed mt-1">{item.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 mb-3">
                    {item.uploaded_by && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                        <User className="w-3 h-3" /> {item.uploaded_by}
                      </span>
                    )}
                    {item.created_at && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                        <Calendar className="w-3 h-3" /> Posted: {formatDate(item.created_at)}
                      </span>
                    )}
                  </div>
                  {(item.file_url || item.external_link) && (
                    <div className="flex flex-wrap gap-2">
                      {item.file_url && <FileButton url={item.file_url} label="Download Assignment" isDownload />}
                      {item.external_link && <FileButton url={item.external_link} label="Open Link" />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// TAB: ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────
const AnnouncementsTab = ({ courseId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    StudentCourseService.getCourseAnnouncements(courseId)
      .then(setData)
      .catch(e => setError(e.response?.data?.detail || 'Failed to load announcements'))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <SectionLoading />;
  if (error) return <SectionError message={error} />;
  if (!data?.length) return (
    <EmptyState icon={Inbox} title="No Announcements" description="No announcements have been posted yet." />
  );

  return (
    <div className="space-y-4">
      {data.map((ann, idx) => (
        <div key={ann.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-rose-400 to-pink-400" />
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Megaphone className="w-4.5 h-4.5 text-rose-500" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <h4 className="text-[14px] font-bold text-gray-900">{ann.title}</h4>
                  {idx === 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">Latest</span>
                  )}
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">{ann.content}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-gray-50">
                  {ann.posted_by && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                      <User className="w-3 h-3" /> {ann.posted_by}
                    </span>
                  )}
                  {ann.created_at && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                      <Calendar className="w-3 h-3" /> {formatDate(ann.created_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// TAB: SYLLABUS
// ─────────────────────────────────────────────────────────
const SyllabusTab = ({ courseId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    StudentCourseService.getCourseSyllabus(courseId)
      .then(setData)
      .catch(e => setError(e.response?.data?.detail || 'Failed to load syllabus'))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <SectionLoading />;
  if (error) return <SectionError message={error} />;
  if (!data?.length) return (
    <EmptyState icon={BookMarked} title="Syllabus Not Available"
      description="The syllabus hasn't been uploaded yet. Contact your faculty for details." />
  );

  return <div className="space-y-3">{data.map(item => <ResourceCard key={item.id} item={item} />)}</div>;
};

// ─────────────────────────────────────────────────────────
// TAB: ATTENDANCE
// ─────────────────────────────────────────────────────────
const AttendanceRing = ({ percentage }) => {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  const color = percentage >= 75 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';
  const label = percentage >= 75 ? 'Good' : percentage >= 60 ? 'Low' : 'Critical';
  const labelColor = percentage >= 75 ? 'text-emerald-600' : percentage >= 60 ? 'text-amber-600' : 'text-red-600';
  const labelBg = percentage >= 75 ? 'bg-emerald-50' : percentage >= 60 ? 'bg-amber-50' : 'bg-red-50';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90">
          <circle cx="42" cy="42" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
          <circle
            cx="42" cy="42" r={r} fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[20px] font-extrabold" style={{ color }}>{percentage}%</span>
        </div>
      </div>
      <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${labelBg} ${labelColor}`}>{label}</span>
    </div>
  );
};

const AttendanceTab = ({ courseId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    StudentCourseService.getCourseAttendance(courseId)
      .then(setData)
      .catch(e => setError(e.response?.data?.detail || 'Failed to load attendance'))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <SectionLoading />;
  if (error) return <SectionError message={error} />;

  const summary = data?.summary || {};
  const history = data?.history || [];
  const pct = summary.attendance_percentage ?? 0;
  const total = summary.total_classes ?? 0;
  const attended = summary.classes_attended ?? 0;
  const absent = total - attended;

  return (
    <div className="space-y-5">
      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
        <div className="p-5 sm:p-6">
          <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-5">Attendance Summary</h4>
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            <AttendanceRing percentage={pct} />
            <div className="grid grid-cols-3 gap-3 flex-1 w-full">
              {[
                { label: 'Total', val: total, bg: 'bg-gray-50', text: 'text-gray-900', sub: 'text-gray-400' },
                { label: 'Attended', val: attended, bg: 'bg-emerald-50', text: 'text-emerald-700', sub: 'text-emerald-400' },
                { label: 'Absent', val: absent, bg: 'bg-red-50', text: 'text-red-600', sub: 'text-red-400' },
              ].map(({ label, val, bg, text, sub }) => (
                <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
                  <p className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${sub}`}>{label}</p>
                  <p className={`text-[30px] font-extrabold leading-none ${text}`}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="mt-5">
              <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1.5">
                <span>Attendance Progress</span>
                <span>Min: 75%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${pct >= 75 ? 'bg-emerald-400' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-end mt-1">
                <div className="h-2.5 w-px bg-gray-300 relative" style={{ marginLeft: '75%' }}>
                  <span className="absolute -top-5 -translate-x-1/2 text-[9px] font-bold text-gray-400">75%</span>
                </div>
              </div>
            </div>
          )}

          {pct < 75 && total > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-[12px] font-semibold">
                Attendance below 75%. You need {Math.ceil((0.75 * total - attended) / 0.25)} more classes to reach the minimum.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h4 className="text-[13px] font-bold text-gray-700">Attendance History</h4>
            <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
              {history.length} records
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {history.map(record => {
              const cfg = ATTENDANCE_STATUS_CONFIG[record.status] || ATTENDANCE_STATUS_CONFIG.absent;
              const { Icon: StatusIcon, color, bg, dot, label } = cfg;
              return (
                <div key={record.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/70 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-800">{formatDate(record.date)}</p>
                    {record.hour && <p className="text-[11px] text-gray-400 font-medium">Period {record.hour}</p>}
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${bg} ${color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {history.length === 0 && total === 0 && (
        <EmptyState icon={BarChart3} title="No Attendance Records" description="No attendance has been recorded for this course yet." />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// TAB: MY MARKS (published grades + retest — own data only)
// ─────────────────────────────────────────────────────────
const GRADE_LABELS = {
  internal_1: 'CIA 1',
  internal_2: 'CIA 2',
  model_exam: 'Model Exam',
  assignment: 'Assignment',
  lab:        'Lab',
  external:   'External',
};

const PASS_MARKS = { internal_1: 25, internal_2: 25, model_exam: 30 };

const MarksTab = ({ courseId }) => {
  const [grades, setGrades]   = useState(null);
  const [retests, setRetests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Find the assignment_id for this course so we can call /gradebook/student/:id
    // Use the retest endpoint directly for retest marks — it is already student-scoped
    Promise.all([
      // Published grades via retest router (student-scoped, no assignment_id needed)
      import('axios').then(({ default: axios }) =>
        axios.get('/api/retest/my-grades/' + courseId, { headers })
          .catch(() => ({ data: [] }))
      ),
      // Own retest marks (backend already filters to logged-in student only)
      import('axios').then(({ default: axios }) =>
        axios.get('/api/retest/my-marks', { headers })
          .catch(() => ({ data: [] }))
      ),
    ]).then(([gradesRes, retestRes]) => {
      setGrades(gradesRes.data || []);
      // Filter retest marks to only this course
      const allRetests = retestRes.data || [];
      setRetests(allRetests.filter(r => String(r.course_id) === String(courseId)));
    }).catch(e => {
      setError(e.response?.data?.detail || 'Failed to load marks');
    }).finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <SectionLoading />;
  if (error)   return <SectionError message={error} />;

  // Build a map of grade_type → retest
  const retestMap = {};
  retests.forEach(r => { if (r.grade_type) retestMap[r.grade_type] = r; });

  if (!grades || grades.length === 0) {
    return (
      <EmptyState icon={Award} title="No Marks Published Yet"
        description="Your faculty hasn't published marks for this course yet. Check back after assessments." />
    );
  }

  return (
    <div className="space-y-4">
      {grades.map(g => {
        const passmark = PASS_MARKS[g.grade_type];
        const passed = !g.is_absent && g.marks_obtained != null && (passmark == null || g.marks_obtained >= passmark);
        const failed = !passed;
        const retest = retestMap[g.grade_type];

        return (
          <div key={g.grade_type} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`h-1 ${passed ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <div className="p-5">
              {/* Assessment name + status */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[15px] font-bold text-gray-900">
                  {GRADE_LABELS[g.grade_type] || g.grade_type}
                </h4>
                {g.is_absent
                  ? <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Absent</span>
                  : passed
                    ? <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Pass</span>
                    : <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">Fail</span>
                }
              </div>

              {/* Marks display */}
              <div className="flex items-end gap-1 mb-1">
                <span className={`text-[36px] font-extrabold leading-none ${g.is_absent ? 'text-gray-300' : passed ? 'text-emerald-600' : 'text-red-500'}`}>
                  {g.is_absent ? '—' : (g.marks_obtained ?? '—')}
                </span>
                <span className="text-[16px] font-bold text-gray-300 mb-1">/ {g.max_marks}</span>
              </div>

              {passmark != null && (
                <p className="text-[12px] text-gray-400 font-medium mb-3">Pass mark: {passmark}</p>
              )}

              {/* Progress bar */}
              {!g.is_absent && g.marks_obtained != null && (
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${passed ? 'bg-emerald-400' : 'bg-red-400'}`}
                    style={{ width: `${Math.min(100, (g.marks_obtained / g.max_marks) * 100)}%` }}
                  />
                </div>
              )}

              {g.remarks && (
                <p className="text-[12px] text-gray-500 italic mt-1">Remarks: {g.remarks}</p>
              )}

              {/* Retest result — only shown if faculty has published it */}
              {retest && (
                <div className="mt-4 pt-4 border-t border-orange-100 bg-orange-50 -mx-5 -mb-5 px-5 pb-5 rounded-b-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-orange-700 uppercase tracking-wider">Retest Result</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-200 text-orange-800">Published</span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-[28px] font-extrabold leading-none text-orange-600">
                      {retest.retest_marks != null ? retest.retest_marks : '—'}
                    </span>
                    <span className="text-[14px] font-bold text-orange-300 mb-0.5">/ {retest.max_marks}</span>
                  </div>
                  {retest.remarks && (
                    <p className="text-[12px] text-orange-600 italic mt-1">{retest.remarks}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
const StudentCourseDetail = () => {
  const { courseId }   = useParams();
  const location       = useLocation();
  const navigate       = useNavigate();
  const [activeTab, setActiveTab] = useState(null);

  const courseFromState = location.state?.course;
  const [course, setCourse] = useState(courseFromState || null);

  useEffect(() => {
    if (!course) {
      StudentCourseService.getMyCourses()
        .then(courses => {
          const found = courses.find(c => String(c.id) === String(courseId));
          if (found) setCourse(found);
        })
        .catch(() => {});
    }
  }, [courseId, course]);

  const activeFeature = FEATURES.find(f => f.id === activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'resources':     return <ResourcesTab courseId={courseId} />;
      case 'assignments':   return <AssignmentsTab courseId={courseId} />;
      case 'announcements': return <AnnouncementsTab courseId={courseId} />;
      case 'syllabus':      return <SyllabusTab courseId={courseId} />;
      case 'attendance':    return <AttendanceTab courseId={courseId} />;
      default:              return null;
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ── Breadcrumb Nav ── */}
      <div className="flex items-center gap-2 text-[13px] font-medium">
        <button
          onClick={() => navigate('/student/courses')}
          className="text-gray-400 hover:text-primary-600 transition-colors"
        >
          My Courses
        </button>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        {activeTab ? (
          <>
            <button onClick={() => setActiveTab(null)} className="text-gray-400 hover:text-primary-600 transition-colors truncate max-w-[140px]">
              {course?.name || 'Course'}
            </button>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span className="text-gray-700 font-bold capitalize">{activeTab}</span>
          </>
        ) : (
          <span className="text-gray-700 font-bold truncate max-w-[200px]">{course?.name || 'Course'}</span>
        )}
      </div>

      {/* ── Course Hero Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Gradient accent */}
        <div className="h-1.5 bg-gradient-to-r from-primary-500 via-indigo-400 to-blue-400" />
        <div className="p-5 sm:p-7">
          {course ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-100">
                <BookOpen className="w-8 h-8 text-white" strokeWidth={1.5} />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-[12px] font-bold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-lg">{course.code}</span>
                  {course.course_type && (
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${COURSE_TYPE_BADGE[course.course_type] || 'bg-gray-100 text-gray-600'}`}>
                      {course.course_type}
                    </span>
                  )}
                  {course.credits && (
                    <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      {course.credits} Credits
                    </span>
                  )}
                </div>
                <h1 className="text-[20px] sm:text-[24px] font-bold text-gray-900 leading-tight">{course.name}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                  {course.faculty_name && (
                    <span className="flex items-center gap-1.5 text-[13px] text-gray-500">
                      <User className="w-3.5 h-3.5 text-gray-400" /> {course.faculty_name}
                    </span>
                  )}
                  {course.semester && (
                    <span className="flex items-center gap-1.5 text-[13px] text-gray-500">
                      <GraduationCap className="w-3.5 h-3.5 text-gray-400" /> Semester {course.semester}
                    </span>
                  )}
                  {course.department && (
                    <span className="flex items-center gap-1.5 text-[13px] text-gray-500">
                      <Layers className="w-3.5 h-3.5 text-gray-400" /> {course.department}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-pulse flex gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Content: Cards Grid or Section ── */}
      {!activeTab ? (
        /* Dashboard cards — minimalistic & professional style */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.id}
                onClick={() => setActiveTab(f.id)}
                className="group relative bg-white rounded-2xl border border-gray-100 p-6 cursor-pointer
                  transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-gray-200
                  flex flex-col justify-between h-full overflow-hidden"
              >
                {/* Accent top line on hover */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${f.accentBar} transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300`} />

                <div>
                  {/* Icon Box */}
                  <div className={`w-11 h-11 rounded-xl ${f.bgColor} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105`}>
                    <Icon className={`w-5 h-5 ${f.accentColor}`} strokeWidth={1.8} />
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-[16px] font-bold text-gray-900 mb-1.5 transition-colors group-hover:text-primary-600">
                    {f.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
                    {f.description}
                  </p>
                </div>

                {/* Footer Arrow Link */}
                <div className="mt-6 flex items-center gap-1.5 text-[12px] font-bold text-gray-400 group-hover:text-primary-600 transition-colors">
                  <span>Explore</span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Section view */
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          {activeFeature && (
            <SectionHeader feature={activeFeature} onBack={() => setActiveTab(null)} />
          )}
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default StudentCourseDetail;
