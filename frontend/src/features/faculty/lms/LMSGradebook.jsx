import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, BookOpen, Download, Send, Save,
  CheckCircle, AlertCircle, ChevronDown, RefreshCw,
} from 'lucide-react';

// ── Assessment config ─────────────────────────────────────────────────────────
const ASSESSMENTS = [
  { value: 'internal_1',  label: 'CIA 1',       max: 50,  pass: 25  },
  { value: 'internal_2',  label: 'CIA 2',       max: 50,  pass: 25  },
  { value: 'model_exam',  label: 'Model Exam',  max: 60,  pass: 30  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const Badge = ({ children, color }) => {
  const colors = {
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100   text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    gray:   'bg-gray-100  text-gray-500',
    blue:   'bg-blue-100  text-blue-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[color] ?? colors.gray}`}>
      {children}
    </span>
  );
};

const statusBadge = (row, passmark) => {
  if (row.is_absent) return <Badge color="gray">Absent</Badge>;
  if (row.marks_obtained == null) return <Badge color="gray">—</Badge>;
  if (passmark != null && row.marks_obtained < passmark) return <Badge color="red">Fail</Badge>;
  return <Badge color="green">Pass</Badge>;
};

// ── Main component ────────────────────────────────────────────────────────────
export const LMSGradebook = () => {
  const { assignmentId } = useParams();

  const [assessment, setAssessment] = useState(ASSESSMENTS[0]);
  const [data, setData]             = useState(null);
  const [rows, setRows]             = useState([]);   // local editable copy
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast]           = useState(null); // { msg, type }

  // ── Retest state ───────────────────────────────────────────────────────────
  const [retestData, setRetestData]         = useState(null);   // eligible list from API
  const [retestRows, setRetestRows]         = useState([]);     // local editable copy
  const [retestLoading, setRetestLoading]   = useState(false);
  const [retestSaving, setRetestSaving]     = useState(false);
  const [retestPublishing, setRetestPublishing] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch roster ───────────────────────────────────────────────────────────
  const fetchGradebook = useCallback(async (gradeType) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/faculty/courses/${assignmentId}/gradebook`,
        { params: { grade_type: gradeType } }
      );
      setData(res.data);
      setRows(res.data.roster.map(r => ({ ...r, _dirty: false })));
    } catch (err) {
      showToast('Failed to load gradebook', 'error');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchGradebook(assessment.value);
  }, [assessment, fetchGradebook]);

  // ── Fetch retest eligible list ─────────────────────────────────────────────
  const fetchRetest = useCallback(async (gradeType) => {
    setRetestLoading(true);
    setRetestData(null);
    setRetestRows([]);
    try {
      const res = await axios.get(
        `/api/retest/courses/${assignmentId}/eligible`,
        { params: { grade_type: gradeType } }
      );
      setRetestData(res.data);
      setRetestRows(
        res.data.eligible_students.map(s => ({
          ...s,
          _retest_marks:   s.retest_marks ?? '',
          _retest_remarks: s.retest_remarks ?? '',
          _dirty: false,
        }))
      );
    } catch (err) {
      if (err.response?.status !== 400) {
        showToast('Failed to load retest data', 'error');
      }
    } finally {
      setRetestLoading(false);
    }
  }, [assignmentId]);

  // Load retest section only after grades are published
  useEffect(() => {
    if (rows.some(r => r.is_published)) {
      fetchRetest(assessment.value);
    } else {
      setRetestData(null);
      setRetestRows([]);
    }
  }, [data, rows, assessment.value, fetchRetest]);

  // ── Retest cell handlers ───────────────────────────────────────────────────
  const handleRetestMarks = (idx, value) => {
    setRetestRows(prev => prev.map((r, i) =>
      i === idx ? { ...r, _retest_marks: value, _dirty: true } : r
    ));
  };

  const handleRetestRemarks = (idx, value) => {
    setRetestRows(prev => prev.map((r, i) =>
      i === idx ? { ...r, _retest_remarks: value, _dirty: true } : r
    ));
  };

  // ── Save retest draft ──────────────────────────────────────────────────────
  const handleRetestSave = async () => {
    setRetestSaving(true);
    try {
      await axios.post(`/api/retest/courses/${assignmentId}/save`, {
        grade_type: assessment.value,
        entries: retestRows.map(r => ({
          student_id:     r.student_id,
          grade_id:       r.grade_id,
          marks_obtained: r._retest_marks === '' ? null : Number(r._retest_marks),
          remarks:        r._retest_remarks || '',
        })),
      });
      showToast('Retest marks saved as draft');
      fetchRetest(assessment.value);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Retest save failed', 'error');
    } finally {
      setRetestSaving(false);
    }
  };

  // ── Publish retest marks ───────────────────────────────────────────────────
  const handleRetestPublish = async () => {
    if (!window.confirm(`Publish retest marks for ${assessment.label}? Each student will see only their own mark.`)) return;
    setRetestPublishing(true);
    try {
      await axios.post(`/api/retest/courses/${assignmentId}/save`, {
        grade_type: assessment.value,
        entries: retestRows.map(r => ({
          student_id:     r.student_id,
          grade_id:       r.grade_id,
          marks_obtained: r._retest_marks === '' ? null : Number(r._retest_marks),
          remarks:        r._retest_remarks || '',
        })),
      });
      await axios.post(`/api/retest/courses/${assignmentId}/publish`, {
        grade_type: assessment.value,
      });
      showToast('Retest marks published — each student sees only their own');
      fetchRetest(assessment.value);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Retest publish failed', 'error');
    } finally {
      setRetestPublishing(false);
    }
  };
  const handleMarks = (idx, value) => {
    setRows(prev => prev.map((r, i) =>
      i === idx ? { ...r, marks_obtained: value === '' ? null : Number(value), is_absent: false, _dirty: true } : r
    ));
  };

  const handleAbsent = (idx, checked) => {
    setRows(prev => prev.map((r, i) =>
      i === idx ? { ...r, is_absent: checked, marks_obtained: checked ? null : r.marks_obtained, _dirty: true } : r
    ));
  };

  const handleRemarks = (idx, value) => {
    setRows(prev => prev.map((r, i) =>
      i === idx ? { ...r, remarks: value, _dirty: true } : r
    ));
  };

  // ── Save (draft) ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`/api/faculty/courses/${assignmentId}/gradebook`, {
        grade_type: assessment.value,
        entries: rows.map(r => ({
          student_id:    r.student_id,
          marks_obtained: r.marks_obtained,
          is_absent:     r.is_absent,
          remarks:       r.remarks || '',
        })),
      });
      showToast('Grades saved as draft');
      fetchGradebook(assessment.value);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Publish ────────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!window.confirm(`Publish all ${assessment.label} grades? Students will be able to see them.`)) return;
    setPublishing(true);
    try {
      // Save first, then publish
      await axios.post(`/api/faculty/courses/${assignmentId}/gradebook`, {
        grade_type: assessment.value,
        entries: rows.map(r => ({
          student_id:    r.student_id,
          marks_obtained: r.marks_obtained,
          is_absent:     r.is_absent,
          remarks:       r.remarks || '',
        })),
      });
      await axios.post(`/api/faculty/courses/${assignmentId}/gradebook/publish`, {
        grade_type: assessment.value,
      });
      showToast('Grades published successfully');
      fetchGradebook(assessment.value);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Publish failed', 'error');
    } finally {
      setPublishing(false);
    }
  };

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    const url = `/api/faculty/courses/${assignmentId}/gradebook/export?grade_type=${assessment.value}`;
    window.open(url, '_blank');
  };

  const isPublished = data?.is_published ?? false;
  // Show retest section if at least some grades are published (even if not all students have entries)
  const hasAnyPublished = isPublished || (rows.some(r => r.is_published));
  const dirtyCount  = rows.filter(r => r._dirty).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold
          ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {toast.type === 'error'
            ? <AlertCircle className="w-4 h-4" />
            : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={`/faculty/courses/${assignmentId}/lms`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 font-medium mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Course Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-600" />
            Grade Book
          </h1>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">
              {data.course_code} — {data.course_name} &nbsp;·&nbsp; {data.section} &nbsp;·&nbsp; {data.academic_year} Sem {data.semester}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handleSave}
            disabled={saving || dirtyCount === 0}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : `Save${dirtyCount ? ` (${dirtyCount})` : ''}`}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" /> {publishing ? 'Publishing...' : isPublished ? 'Re-Publish' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Assessment selector */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Select Assessment</p>
        <div className="flex flex-wrap gap-2">
          {ASSESSMENTS.map(a => (
            <button
              key={a.value}
              onClick={() => setAssessment(a)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors
                ${assessment.value === a.value
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:text-primary-600'}`}
            >
              {a.label}
              <span className="ml-1.5 text-xs opacity-70">/{a.max}</span>
            </button>
          ))}
        </div>

        {/* Retest eligibility note removed */}
      </div>

      {/* Status bar */}
      {data && !loading && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {rows.length} students &nbsp;·&nbsp; Max marks: <strong>{assessment.max}</strong>
            {assessment.pass != null && <> &nbsp;·&nbsp; Pass: <strong>{assessment.pass}</strong></>}
          </span>
          {isPublished
            ? <Badge color="green">Published</Badge>
            : <Badge color="yellow">Draft</Badge>}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-bold text-gray-600 w-10">#</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Reg. No.</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Name</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600">
                    Marks <span className="font-normal text-gray-400">/ {assessment.max}</span>
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600">Absent</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600 hidden md:table-cell">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, idx) => (
                  <tr
                    key={row.student_id}
                    className={`hover:bg-gray-50 transition-colors ${row._dirty ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.register_number}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.first_name} {row.last_name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={assessment.max}
                        step={0.5}
                        value={row.marks_obtained ?? ''}
                        disabled={row.is_absent}
                        onChange={e => handleMarks(idx, e.target.value)}
                        className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-primary-300
                                   disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="—"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.is_absent}
                        onChange={e => handleAbsent(idx, e.target.checked)}
                        className="w-4 h-4 accent-primary-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {statusBadge(row, assessment.pass)}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <input
                        type="text"
                        value={row.remarks || ''}
                        onChange={e => handleRemarks(idx, e.target.value)}
                        placeholder="Optional note..."
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs
                                   focus:outline-none focus:ring-2 focus:ring-primary-300"
                      />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                      No students found in this section.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary stats */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: rows.length, color: 'text-gray-700' },
            { label: 'Entered', value: rows.filter(r => r.marks_obtained != null || r.is_absent).length, color: 'text-blue-600' },
            { label: 'Pass', value: rows.filter(r => !r.is_absent && r.marks_obtained != null && assessment.pass != null && r.marks_obtained >= assessment.pass).length, color: 'text-green-600' },
            { label: 'Fail / Absent', value: rows.filter(r => r.is_absent || (r.marks_obtained != null && assessment.pass != null && r.marks_obtained < assessment.pass)).length, color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Retest Marks Section — visible only after main grades are published ── */}
      {rows.some(r => r.is_published) && assessment.pass != null && (
        <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">

          {/* Retest header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-orange-50 border-b border-orange-100">
            <div>
              <h2 className="text-base font-bold text-orange-800 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Retest Marks — {assessment.label}
              </h2>
              <p className="text-xs text-orange-600 mt-0.5">
                Only failed / absent students appear here. After publishing, each student sees only their own mark.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => fetchRetest(assessment.value)}
                className="flex items-center gap-1.5 border border-orange-300 bg-white text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <button
                onClick={handleRetestSave}
                disabled={retestSaving || retestRows.filter(r => r._dirty).length === 0}
                className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {retestSaving ? 'Saving…' : `Save${retestRows.filter(r => r._dirty).length ? ` (${retestRows.filter(r => r._dirty).length})` : ''}`}
              </button>
              <button
                onClick={handleRetestPublish}
                disabled={retestPublishing || retestRows.length === 0 || retestRows.every(r => r.retest_published)}
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {retestPublishing ? 'Publishing…' : retestRows.every(r => r.retest_published) ? 'All Published' : 'Publish Retest'}
              </button>
            </div>
          </div>

          {/* Retest table */}
          {retestLoading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-500" />
            </div>
          ) : retestRows.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              {retestData ? 'No students eligible for retest — everyone passed!' : 'Loading…'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-bold text-gray-600 w-10">#</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Reg. No.</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Name</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-600">Original</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-600">
                      Retest Marks <span className="font-normal text-gray-400">/ {assessment.max}</span>
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600 hidden md:table-cell">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {retestRows.map((row, idx) => (
                    <tr
                      key={row.student_id}
                      className={`hover:bg-orange-50/30 transition-colors ${row._dirty ? 'bg-orange-50/50' : ''}`}
                    >
                      <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.register_number}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{row.first_name} {row.last_name}</td>
                      <td className="px-4 py-3 text-center">
                        {row.original_absent
                          ? <Badge color="gray">Absent</Badge>
                          : <span className="font-mono text-sm text-red-600">{row.original_marks ?? '—'}</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.retest_published ? (
                          <span className="font-mono text-sm text-gray-700">
                            {row.retest_marks != null ? row.retest_marks : '—'}
                          </span>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            max={assessment.max}
                            step={0.5}
                            value={row._retest_marks}
                            onChange={e => handleRetestMarks(idx, e.target.value)}
                            className="w-20 text-center border border-orange-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                            placeholder="—"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.retest_published
                          ? <Badge color="green">Published</Badge>
                          : row.retest_id
                            ? <Badge color="yellow">Draft</Badge>
                            : <Badge color="gray">Not entered</Badge>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {row.retest_published ? (
                          <span className="text-xs text-gray-500">{row.retest_remarks || '—'}</span>
                        ) : (
                          <input
                            type="text"
                            value={row._retest_remarks}
                            onChange={e => handleRetestRemarks(idx, e.target.value)}
                            placeholder="Optional note…"
                            className="w-full border border-orange-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
