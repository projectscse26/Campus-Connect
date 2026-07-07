/**
 * StudentMarks.jsx
 *
 * Dedicated page for students to view their own published marks + retest marks.
 * - Calls GET /api/retest/my-grades/:courseId  → published grades (own only)
 * - Calls GET /api/retest/my-marks             → published retest marks (own only)
 *
 * Security: both endpoints enforce student.user_id == current_user.id on the backend.
 * No student can see another student's data.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Award, BookOpen, RefreshCw, ChevronRight, Loader2,
  AlertCircle, GraduationCap,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const GRADE_LABELS = {
  internal_1: 'CIA 1',
  internal_2: 'CIA 2',
  model_exam: 'Model Exam',
  assignment: 'Assignment',
  lab:        'Lab',
  external:   'External',
};

const PASS_MARKS = {
  internal_1: 25,
  internal_2: 25,
  model_exam: 30,
};

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const Pill = ({ children, color }) => {
  const map = {
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-600',
    gray:   'bg-gray-100 text-gray-500',
    orange: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${map[color] ?? map.gray}`}>
      {children}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const StudentMarks = () => {
  const navigate = useNavigate();

  // We fetch all courses, then their grades + retests
  const [courses, setCourses]   = useState([]);
  const [allRetests, setAllRetests] = useState([]);
  const [gradesByCourse, setGradesByCourse] = useState({});  // { courseId: [] }
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeCourse, setActiveCourse] = useState(null);   // courseId currently expanded

  // ── Step 1: load enrolled courses ─────────────────────────────────────────
  useEffect(() => {
    axios.get('/api/student-portal/courses')
      .then(res => setCourses(res.data || []))
      .catch(() => setError('Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  // ── Step 2: load all retest marks (one call, already student-scoped) ───────
  useEffect(() => {
    axios.get('/api/retest/my-marks')
      .then(res => setAllRetests(res.data || []))
      .catch(() => {});  // silent — student may have no retests
  }, []);

  // ── Step 3: load grades for a course when expanded ─────────────────────────
  const loadGrades = async (courseId) => {
    if (gradesByCourse[courseId] !== undefined) return;  // already loaded
    try {
      const res = await axios.get(`/api/retest/my-grades/${courseId}`);
      setGradesByCourse(prev => ({ ...prev, [courseId]: res.data || [] }));
    } catch {
      setGradesByCourse(prev => ({ ...prev, [courseId]: [] }));
    }
  };

  const toggleCourse = async (courseId) => {
    if (activeCourse === courseId) {
      setActiveCourse(null);
    } else {
      setActiveCourse(courseId);
      await loadGrades(courseId);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        <p className="text-sm text-gray-400">Loading your marks…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 m-4">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4 md:p-6">

      {/* Page header */}
      <div>
        <button
          onClick={() => navigate('/student')}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-primary-600 font-medium mb-2"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-500" />
          My Marks
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Your published assessment marks and retest results. Only you can see this.
        </p>
      </div>

      {courses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <GraduationCap className="w-12 h-12 text-gray-200 mb-4" />
          <p className="text-gray-400 text-sm font-medium">No enrolled courses found.</p>
        </div>
      )}

      {/* Course accordion */}
      {courses.map(course => {
        const isOpen    = activeCourse === course.id;
        const grades    = gradesByCourse[course.id] ?? null;   // null = not yet loaded
        const retests   = allRetests.filter(r => String(r.course_id) === String(course.id));

        // Build retest map by grade_type
        const retestMap = {};
        retests.forEach(r => { if (r.grade_type) retestMap[r.grade_type] = r; });

        return (
          <div
            key={course.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Course row — click to expand */}
            <button
              onClick={() => toggleCourse(course.id)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-gray-900 truncate">{course.name}</p>
                <p className="text-[12px] text-gray-400 font-medium">{course.code} · Sem {course.semester}</p>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
              />
            </button>

            {/* Expanded marks panel */}
            {isOpen && (
              <div className="border-t border-gray-50 px-5 pb-5 pt-4 space-y-4">

                {/* Loading grades */}
                {grades === null && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading marks…
                  </div>
                )}

                {/* No marks yet */}
                {grades !== null && grades.length === 0 && retests.length === 0 && (
                  <p className="text-sm text-gray-400 italic">
                    No published marks for this course yet.
                  </p>
                )}

                {/* Grade cards */}
                {grades !== null && grades.map(g => {
                  const passmark = PASS_MARKS[g.grade_type];
                  const passed   = !g.is_absent && g.marks_obtained != null
                    && (passmark == null || g.marks_obtained >= passmark);
                  const retest   = retestMap[g.grade_type];
                  
                  // Only show retest if current grade is still failing or absent
                  const shouldShowRetest = retest && !passed;

                  return (
                    <div
                      key={g.grade_type}
                      className="rounded-xl border border-gray-100 overflow-hidden"
                    >
                      {/* Top colour bar */}
                      <div className={`h-1 ${passed ? 'bg-green-400' : 'bg-red-400'}`} />

                      <div className="p-4">
                        {/* Assessment name + pass/fail badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[14px] font-bold text-gray-800">
                            {GRADE_LABELS[g.grade_type] || g.grade_type}
                          </span>
                          {g.is_absent
                            ? <Pill color="gray">Absent</Pill>
                            : passed
                              ? <Pill color="green">Pass</Pill>
                              : <Pill color="red">Fail</Pill>}
                        </div>

                        {/* Marks */}
                        <div className="flex items-end gap-1 mb-1">
                          <span className={`text-[32px] font-extrabold leading-none
                            ${g.is_absent ? 'text-gray-300' : passed ? 'text-green-600' : 'text-red-500'}`}>
                            {g.is_absent ? '—' : (g.marks_obtained ?? '—')}
                          </span>
                          <span className="text-[14px] font-bold text-gray-300 mb-0.5">
                            / {g.max_marks}
                          </span>
                        </div>

                        {passmark != null && (
                          <p className="text-[11px] text-gray-400 font-medium mb-2">
                            Pass mark: {passmark}
                          </p>
                        )}

                        {/* Progress bar */}
                        {!g.is_absent && g.marks_obtained != null && (
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${passed ? 'bg-green-400' : 'bg-red-400'}`}
                              style={{ width: `${Math.min(100, (g.marks_obtained / g.max_marks) * 100)}%` }}
                            />
                          </div>
                        )}

                        {g.remarks && (
                          <p className="text-[11px] text-gray-400 italic mt-2">{g.remarks}</p>
                        )}

                        {/* Retest result — only show if current grade is still failing/absent */}
                        {shouldShowRetest && (
                          <div className="mt-3 pt-3 border-t border-orange-100">
                            <div className="flex items-center gap-2 mb-1">
                              <RefreshCw className="w-3.5 h-3.5 text-orange-500" />
                              <span className="text-[12px] font-bold text-orange-700">
                                Retest Result
                              </span>
                              <Pill color="orange">Published</Pill>
                            </div>
                            <div className="flex items-end gap-1">
                              <span className="text-[24px] font-extrabold text-orange-600 leading-none">
                                {retest.retest_marks != null ? retest.retest_marks : '—'}
                              </span>
                              <span className="text-[13px] font-bold text-orange-300 mb-0.5">
                                / {retest.max_marks}
                              </span>
                            </div>
                            {retest.remarks && (
                              <p className="text-[11px] text-orange-500 italic mt-1">
                                {retest.remarks}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Retest marks for grade_types with NO original grade shown
                    (edge case: retest exists but grade was filtered out) */}
                {grades !== null && retests
                  .filter(r => !grades.find(g => g.grade_type === r.grade_type))
                  .map(r => (
                    <div key={r.grade_type} className="rounded-xl border border-orange-100 overflow-hidden">
                      <div className="h-1 bg-orange-400" />
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[14px] font-bold text-gray-800">
                            {GRADE_LABELS[r.grade_type] || r.grade_type} — Retest
                          </span>
                          <Pill color="orange">Retest</Pill>
                        </div>
                        <div className="flex items-end gap-1">
                          <span className="text-[28px] font-extrabold text-orange-600 leading-none">
                            {r.retest_marks != null ? r.retest_marks : '—'}
                          </span>
                          <span className="text-[13px] font-bold text-orange-300 mb-0.5">/ {r.max_marks}</span>
                        </div>
                        {r.remarks && (
                          <p className="text-[11px] text-orange-500 italic mt-1">{r.remarks}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StudentMarks;
