import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Link2, Plus, X, ChevronRight, Folder, Calendar, Layers, Users,
  BookOpen, User, CheckCircle2, AlertTriangle, Loader2, Trash2,
  RefreshCw, Award, BarChart2, GraduationCap
} from 'lucide-react';

// ─── Toast Notification ──────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error:   'bg-red-50 border-red-200 text-red-800',
  };
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
    error:   <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />,
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-lg animate-in slide-in-from-bottom-4 duration-300 ${styles[type]}`}>
      {icons[type]}
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ─── Delete Confirmation Dialog ──────────────────────────────
const DeleteDialog = ({ course, faculty, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Assignment?</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          This will remove <span className="font-bold text-gray-700">{faculty}</span> from teaching{' '}
          <span className="font-bold text-gray-700">{course}</span>.
        </p>
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 mt-3 font-medium">
          ⚠ This may affect attendance records tied to this assignment.
        </p>
      </div>
      <div className="flex gap-3 px-6 pb-6">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {loading ? 'Removing...' : 'Yes, Remove'}
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────
export const FacultyAssignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [faculty, setFaculty]         = useState([]);
  const [courses, setCourses]         = useState([]);
  const [sections, setSections]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [toast, setToast]             = useState(null);

  // Drill-down navigation
  const [selectedYear, setSelectedYear]         = useState(null);
  const [selectedSection, setSelectedSection]   = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);

  // Assignment modal
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [prefillCourse, setPrefillCourse] = useState(null);
  const yr = new Date().getFullYear();
  const [formData, setFormData] = useState({
    faculty_id: '', course_id: '', section_id: '',
    academic_year: `${yr}-${yr + 1}`, semester: 1
  });
  const [formError, setFormError]   = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, courseName, facultyName }
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Data Fetching ──
  const fetchData = async () => {
    try {
      setLoading(true);
      const [aRes, fRes, cRes, sRes] = await Promise.all([
        axios.get('/api/hod/assignments'),
        axios.get('/api/hod/faculty'),
        axios.get('/api/hod/courses'),
        axios.get('/api/hod/sections'),
      ]);
      setAssignments(aRes.data);
      setFaculty(fRes.data);
      setCourses(cRes.data);
      setSections(sRes.data);
      setError(null);
    } catch {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Toast helper ──
  const showToast = (message, type = 'success') => setToast({ message, type });

  // ── Create Assignment ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      await axios.post('/api/hod/assignments', {
        ...formData,
        faculty_id: parseInt(formData.faculty_id),
        course_id:  parseInt(formData.course_id),
        section_id: parseInt(formData.section_id),
        semester:   parseInt(formData.semester),
      });
      await fetchData();
      setIsModalOpen(false);
      setPrefillCourse(null);
      showToast('Assignment created successfully!');
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create assignment');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete Assignment ──
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/hod/assignments/${deleteTarget.id}`);
      await fetchData();
      showToast('Assignment removed successfully!');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to remove assignment', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  // ── Helpers ──
  const getFacultyName = (id) => {
    const f = faculty.find(f => f.id === id);
    return f ? `${f.first_name} ${f.last_name}` : `#${id}`;
  };

  const getFacultyWorkload = (facultyId) => assignments.filter(a => a.faculty_id === facultyId).length;

  const getWorkloadBadge = (count) => {
    if (count <= 2) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (count <= 4) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getWorkloadLabel = (count) => {
    if (count <= 2) return 'Available';
    if (count <= 4) return 'Moderate';
    return 'Heavy';
  };

  const handleOpenModal = (course = null) => {
    setFormError(null);
    setPrefillCourse(course);
    const filteredCourses = courses.filter(c => selectedSemester ? c.semester === selectedSemester : true);
    setFormData({
      faculty_id:    faculty[0]?.id || '',
      course_id:     course ? course.id : (filteredCourses[0]?.id || ''),
      section_id:    selectedSection ? selectedSection.id : (sections[0]?.id || ''),
      academic_year: `${yr}-${yr + 1}`,
      semester:      selectedSemester || 1,
    });
    setIsModalOpen(true);
  };

  // ── Derived ──
  const availableYears = [...new Set(sections.map(s => s.year))].sort();

  // ──────────────────────────────────────────────────────────────
  // Level 1: Year Cards
  // ──────────────────────────────────────────────────────────────
  const renderYearView = () => {
    const yearColors = [
      { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'hover:border-blue-300', dot: 'bg-blue-400' },
      { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'hover:border-violet-300', dot: 'bg-violet-400' },
      { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'hover:border-emerald-300', dot: 'bg-emerald-400' },
      { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'hover:border-rose-300', dot: 'bg-rose-400' },
    ];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
        {availableYears.map((year, i) => {
          const col = yearColors[(year - 1) % yearColors.length];
          const yearSecs = sections.filter(s => s.year === year);
          const yearAssignments = assignments.filter(a =>
            yearSecs.some(s => s.id === a.section_id)
          );
          const yearCourses = courses.filter(c => yearSecs.some(s => {
            const sem1 = year * 2 - 1; const sem2 = year * 2;
            return c.semester === sem1 || c.semester === sem2;
          }));
          const coverage = yearCourses.length > 0
            ? Math.round((yearAssignments.length / Math.max(yearCourses.length * yearSecs.length, 1)) * 100)
            : 0;

          return (
            <div
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`relative bg-white p-6 rounded-[24px] border border-gray-100 cursor-pointer ${col.border} hover:shadow-lg transition-all duration-300 group overflow-hidden`}
            >
              <div className={`absolute -right-4 -top-4 w-20 h-20 ${col.bg} rounded-full opacity-60 group-hover:scale-150 transition-transform duration-500`} />
              <div className={`w-14 h-14 ${col.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10`}>
                <GraduationCap className={`w-7 h-7 ${col.icon}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 relative z-10">Year {year}</h3>
              <div className="flex items-center gap-2 mt-2 relative z-10">
                <span className="text-sm text-gray-500 font-medium">{yearSecs.length} section{yearSecs.length !== 1 ? 's' : ''}</span>
                <span className="text-gray-300">·</span>
                <span className="text-sm text-gray-500 font-medium">{yearAssignments.length} assigned</span>
              </div>
              <div className="mt-4 relative z-10">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                  <span>Coverage</span><span>{coverage}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${coverage >= 80 ? 'bg-emerald-400' : coverage >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${coverage}%` }}
                  />
                </div>
              </div>
              <ChevronRight className="absolute bottom-5 right-5 w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          );
        })}

        {availableYears.length === 0 && !loading && (
          <div className="col-span-full py-16 flex flex-col items-center text-center bg-white rounded-[24px] border border-dashed border-gray-200">
            <Folder className="w-12 h-12 text-gray-200 mb-4" />
            <h3 className="text-base font-bold text-gray-600">No Sections Found</h3>
            <p className="text-sm text-gray-400 mt-1">Please create sections in the Section Management tab first.</p>
          </div>
        )}
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────────
  // Level 2: Section + Semester Selection
  // ──────────────────────────────────────────────────────────────
  const renderSectionView = () => {
    const yearSections = sections.filter(s => s.year === selectedYear);
    const semesters = [selectedYear * 2 - 1, selectedYear * 2];

    return (
      <div className="space-y-8 mt-6">
        {/* Sections */}
        <div>
          <h3 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" /> Choose a Section
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {yearSections.map(sec => {
              const secAssignments = assignments.filter(a => a.section_id === sec.id);
              const isSelected = selectedSection?.id === sec.id;
              return (
                <div
                  key={sec.id}
                  onClick={() => { setSelectedSection(sec); setSelectedSemester(null); }}
                  className={`p-5 rounded-[20px] border-2 cursor-pointer transition-all duration-200 group flex flex-col items-center text-center ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100'
                      : 'bg-white border-gray-100 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 font-black text-xl transition-transform group-hover:scale-110 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {sec.name}
                  </div>
                  <p className={`text-xs font-semibold ${isSelected ? 'text-indigo-100' : 'text-gray-500'}`}>
                    {secAssignments.length} assigned
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Semesters */}
        {selectedSection && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-200">
            <h3 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" /> Choose a Semester
            </h3>
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              {semesters.map(sem => {
                const semAssignments = assignments.filter(a => a.section_id === selectedSection.id && a.semester === sem);
                const semCourses = courses.filter(c => c.semester === sem);
                const pct = semCourses.length > 0 ? Math.round((semAssignments.length / semCourses.length) * 100) : 0;
                return (
                  <div
                    key={sem}
                    onClick={() => setSelectedSemester(sem)}
                    className="bg-white p-5 rounded-[20px] border border-gray-100 cursor-pointer hover:border-amber-300 hover:shadow-md transition-all group flex flex-col gap-3"
                  >
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Semester {sem}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{semAssignments.length}/{semCourses.length} assigned</p>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────────
  // Level 3: Smart Matrix (Courses × Faculty)
  // ──────────────────────────────────────────────────────────────
  const renderSmartMatrix = () => {
    const semesterCourses    = courses.filter(c => c.semester === selectedSemester);
    const sectionAssignments = assignments.filter(a => a.section_id === selectedSection.id && a.semester === selectedSemester);
    const assignedCount      = sectionAssignments.length;
    const totalCount         = semesterCourses.length;

    const facultyWithWorkload = faculty
      .map(f => ({ ...f, workload: getFacultyWorkload(f.id) }))
      .sort((a, b) => a.workload - b.workload);

    const COURSE_TYPE_COLORS = {
      theory:   { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400'   },
      lab:      { bg: 'bg-emerald-50', text: 'text-emerald-700',dot: 'bg-emerald-400'},
      elective: { bg: 'bg-purple-50',  text: 'text-purple-700', dot: 'bg-purple-400' },
      project:  { bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-400'  },
    };

    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start mt-6">
        {/* ── Left: Course Cards ── */}
        <div className="xl:col-span-2 space-y-3">
          {/* Summary bar */}
          <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${assignedCount === totalCount ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-sm font-bold text-gray-900">
                {assignedCount === totalCount ? 'All courses assigned' : `${totalCount - assignedCount} unassigned`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400">{assignedCount}/{totalCount}</span>
              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${assignedCount === totalCount ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  style={{ width: `${totalCount > 0 ? (assignedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {semesterCourses.length === 0 ? (
            <div className="bg-white p-10 text-center rounded-[24px] border border-dashed border-gray-200">
              <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium text-sm">No courses for Semester {selectedSemester}.</p>
            </div>
          ) : (
            semesterCourses.map(course => {
              const assignment = sectionAssignments.find(a => a.course_id === course.id);
              const typeColors = COURSE_TYPE_COLORS[course.course_type] || { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' };
              const isAssigned = !!assignment;

              return (
                <div
                  key={course.id}
                  className={`bg-white border rounded-[20px] p-4 sm:p-5 transition-all duration-200 ${
                    isAssigned ? 'border-gray-100 shadow-sm' : 'border-red-100 bg-red-50/30 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Course Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 ${typeColors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <BookOpen className={`w-5 h-5 ${typeColors.text}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="font-mono text-xs font-bold text-gray-400">{course.code}</span>
                          <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${typeColors.bg} ${typeColors.text}`}>
                            {course.course_type}
                          </span>
                          <span className="text-[11px] text-gray-400 font-semibold">{course.credits}cr</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm truncate">{course.name}</h4>
                      </div>
                    </div>

                    {/* Assignment Action */}
                    <div className="flex-shrink-0">
                      {isAssigned ? (
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {getFacultyName(assignment.faculty_id).split(' ').map(w => w[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
                            {getFacultyName(assignment.faculty_id)}
                          </span>
                          <div className="flex items-center gap-1 ml-1">
                            {/* Reassign button */}
                            <button
                              onClick={() => {
                                setDeleteTarget({ id: assignment.id, courseName: course.name, facultyName: getFacultyName(assignment.faculty_id) });
                              }}
                              title="Remove assignment"
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenModal(course)}
                              title="Reassign to different faculty"
                              className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenModal(course)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-primary-200 text-primary-600 text-sm font-bold rounded-xl hover:bg-primary-50 hover:border-primary-400 transition-all"
                        >
                          <Plus className="w-4 h-4" /> Assign Faculty
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Right: Faculty Roster ── */}
        <div className="xl:col-span-1 bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden sticky top-6">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" /> Faculty Roster
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Live workload overview</p>
          </div>
          <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
            {facultyWithWorkload.map(f => (
              <div key={f.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-black text-sm flex-shrink-0">
                  {f.first_name[0]}{f.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{f.first_name} {f.last_name}</h4>
                  <p className="text-xs text-gray-400 truncate">{f.designation}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getWorkloadBadge(f.workload)}`}>
                    {getWorkloadLabel(f.workload)}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5 text-center">{f.workload} course{f.workload !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
            <Link2 className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Course Assignment</h1>
            <p className="text-sm text-gray-400 font-medium mt-0.5">Assign faculty to courses strategically</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm shadow-primary-100"
          >
            <Plus className="w-4 h-4" /> Manual Assignment
          </button>
        </div>
      </div>

      {/* ── Breadcrumbs ── */}
      <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-1 text-sm font-medium overflow-x-auto no-scrollbar">
        <button
          onClick={() => { setSelectedYear(null); setSelectedSection(null); setSelectedSemester(null); }}
          className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${!selectedYear ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
        >
          <Folder className="w-3.5 h-3.5" /> All Years
        </button>

        {selectedYear && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <button
              onClick={() => { setSelectedSection(null); setSelectedSemester(null); }}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${!selectedSection ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Year {selectedYear}
            </button>
          </>
        )}

        {selectedSection && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <button
              onClick={() => setSelectedSemester(null)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${!selectedSemester ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              <Users className="w-3.5 h-3.5" /> Section {selectedSection.name}
            </button>
          </>
        )}

        {selectedSemester && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <span className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 font-bold">
              <Calendar className="w-3.5 h-3.5" /> Semester {selectedSemester}
            </span>
          </>
        )}
      </div>

      {/* ── Main Content ── */}
      {error ? (
        <div className="p-8 text-center bg-white rounded-[24px] border border-red-100 shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-300 mx-auto mb-3" />
          <p className="text-red-600 font-bold">{error}</p>
        </div>
      ) : loading ? (
        <div className="p-16 flex flex-col items-center gap-3 bg-white rounded-[24px] border border-gray-100 shadow-sm mt-6">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          <p className="text-gray-400 font-medium text-sm">Loading assignments...</p>
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in-98 duration-200">
          {!selectedYear && renderYearView()}
          {selectedYear && !selectedSemester && renderSectionView()}
          {selectedSemester && renderSmartMatrix()}
        </div>
      )}

      {/* ── Assignment Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {prefillCourse ? `Assign: ${prefillCourse.code}` : 'Manual Course Assignment'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Fill in all fields to assign faculty</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setPrefillCourse(null); }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {formError}
                </div>
              )}

              {/* Faculty */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 flex justify-between">
                  <span>Faculty</span>
                  <span className="text-primary-500 normal-case font-semibold">Check workload in roster</span>
                </label>
                <select
                  required
                  value={formData.faculty_id}
                  onChange={e => setFormData({ ...formData, faculty_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all outline-none"
                >
                  {faculty.map(f => {
                    const load = getFacultyWorkload(f.id);
                    return (
                      <option key={f.id} value={f.id}>
                        {f.first_name} {f.last_name} — {load} assigned ({getWorkloadLabel(load)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Course */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Course</label>
                <select
                  required
                  value={formData.course_id}
                  onChange={e => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all outline-none"
                >
                  {courses
                    .filter(c => selectedSemester ? c.semester === selectedSemester : true)
                    .map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Section</label>
                <select
                  required
                  value={formData.section_id}
                  onChange={e => setFormData({ ...formData, section_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all outline-none"
                >
                  {sections.map(s => <option key={s.id} value={s.id}>Section {s.name} — Year {s.year} ({s.batch})</option>)}
                </select>
              </div>

              {/* Academic Year + Semester */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Academic Year</label>
                  <input
                    type="text" required
                    value={formData.academic_year}
                    onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all outline-none"
                    placeholder="e.g. 2024-2025"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Semester</label>
                  <input
                    type="number" required min="1" max="8"
                    value={formData.semester}
                    onChange={e => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setPrefillCourse(null); }}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {formLoading ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {deleteTarget && (
        <DeleteDialog
          course={deleteTarget.courseName}
          faculty={deleteTarget.facultyName}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
