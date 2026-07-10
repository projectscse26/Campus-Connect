import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Users, ArrowLeft, Save, Send, CheckCircle, AlertCircle, Calendar, Edit3 } from 'lucide-react';

export const LMSSeminars = () => {
  const { assignmentId } = useParams();

  const [gradeRoster, setGradeRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishingTopics, setPublishingTopics] = useState(false);
  const [publishingMarks, setPublishingMarks] = useState(false);
  const [maxMarks, setMaxMarks] = useState(100);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        const response = await axios.get(`/api/faculty/courses/${assignmentId}/seminars`);
        setGradeRoster(response.data.roster.map(r => ({ ...r, _dirty: false })));
        if (response.data.roster.length > 0) {
          setMaxMarks(response.data.roster[0].max_marks);
        }
      } catch (err) {
        console.error("Failed to fetch seminar roster:", err);
        setToast({ text: 'Failed to load seminar roster', type: 'error' });
        setTimeout(() => setToast(null), 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchRoster();
  }, [assignmentId]);

  const handleDateChange = (idx, val) => {
    setGradeRoster(prev => prev.map((r, i) =>
      i === idx ? { ...r, seminar_date: val, _dirty: true } : r
    ));
  };

  const handleTopicChange = (idx, val) => {
    setGradeRoster(prev => prev.map((r, i) =>
      i === idx ? { ...r, seminar_topic: val, _dirty: true } : r
    ));
  };

  const handleMarksChange = (idx, val) => {
    setGradeRoster(prev => prev.map((r, i) =>
      i === idx ? { ...r, marks_obtained: val === '' ? null : Number(val), _dirty: true } : r
    ));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await axios.post(`/api/faculty/courses/${assignmentId}/seminars`, {
        entries: gradeRoster.map(r => ({
          student_id: r.student_id,
          seminar_date: r.seminar_date,
          seminar_topic: r.seminar_topic,
          marks_obtained: r.marks_obtained,
          max_marks: Number(maxMarks)
        }))
      });
      setToast({ text: 'Seminar details saved successfully!', type: 'success' });
      setGradeRoster(prev => prev.map(r => ({ ...r, _dirty: false })));
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast({ text: err.response?.data?.detail || 'Failed to save seminar details', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishTopics = async () => {
    if (!window.confirm("Publish seminar dates and topics to student pages?")) return;
    setPublishingTopics(true);
    try {
      // Auto save first
      await axios.post(`/api/faculty/courses/${assignmentId}/seminars`, {
        entries: gradeRoster.map(r => ({
          student_id: r.student_id,
          seminar_date: r.seminar_date,
          seminar_topic: r.seminar_topic,
          marks_obtained: r.marks_obtained,
          max_marks: Number(maxMarks)
        }))
      });
      await axios.post(`/api/faculty/courses/${assignmentId}/seminars/publish-topics`);
      setToast({ text: 'Seminar dates & topics published to students!', type: 'success' });
      setGradeRoster(prev => prev.map(r => ({ ...r, is_topic_published: true, _dirty: false })));
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast({ text: 'Failed to publish topics', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setPublishingTopics(false);
    }
  };

  const handlePublishMarks = async () => {
    if (!window.confirm("Publish seminar marks to students? They will be visible in their grade sheets.")) return;
    setPublishingMarks(true);
    try {
      // Auto save first
      await axios.post(`/api/faculty/courses/${assignmentId}/seminars`, {
        entries: gradeRoster.map(r => ({
          student_id: r.student_id,
          seminar_date: r.seminar_date,
          seminar_topic: r.seminar_topic,
          marks_obtained: r.marks_obtained,
          max_marks: Number(maxMarks)
        }))
      });
      await axios.post(`/api/faculty/courses/${assignmentId}/seminars/publish-marks`);
      setToast({ text: 'Seminar marks published to student portals!', type: 'success' });
      setGradeRoster(prev => prev.map(r => ({ ...r, is_marks_published: true, _dirty: false })));
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast({ text: 'Failed to publish marks', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setPublishingMarks(false);
    }
  };

  const dirtyCount = gradeRoster.filter(r => r._dirty).length;
  const isTopicsPublished = gradeRoster.some(r => r.is_topic_published);
  const isMarksPublished = gradeRoster.some(r => r.is_marks_published);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold
          ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={`/faculty/courses/${assignmentId}/lms`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-pink-600 font-medium mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-pink-650" />
            Seminar Grade Book
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Assign seminar dates, topics, and evaluate student marks.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={saving || dirtyCount === 0}
            className="flex items-center gap-2 bg-gray-950 hover:bg-black disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : `Save Draft${dirtyCount ? ` (${dirtyCount})` : ''}`}
          </button>

          <button
            onClick={handlePublishTopics}
            disabled={publishingTopics}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4" /> {publishingTopics ? 'Publishing...' : 'Publish Topics'}
          </button>

          <button
            onClick={handlePublishMarks}
            disabled={publishingMarks}
            className="flex items-center gap-2 bg-pink-700 hover:bg-pink-800 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" /> {publishingMarks ? 'Publishing...' : isMarksPublished ? 'Re-Publish Marks' : 'Publish Marks'}
          </button>
        </div>
      </div>

      {/* Max Marks Selector */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-[13px] font-bold text-gray-700 uppercase tracking-wide mb-1">Set Maximum Marks</h3>
          <p className="text-xs text-gray-400">Specify total marks for seminar evaluation.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={1000}
            value={maxMarks}
            onChange={(e) => setMaxMarks(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-24 text-center border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none font-bold text-gray-85"
          />
          <span className="text-sm font-semibold text-gray-500">marks</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-bold text-gray-600 w-12">#</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600 w-36">Reg. No.</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600 w-48">Student Name</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600 w-44">Date</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Seminar Topic</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600 w-36">Marks Obtained</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {gradeRoster.map((row, idx) => {
                  return (
                    <tr key={row.student_id} className={`hover:bg-gray-50/50 transition-colors ${row._dirty ? 'bg-pink-50/10' : ''}`}>
                      <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.register_number}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {row.first_name} {row.last_name}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={row.seminar_date || ''}
                          onChange={(e) => handleDateChange(idx, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-700"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.seminar_topic || ''}
                          onChange={(e) => handleTopicChange(idx, e.target.value)}
                          placeholder="Enter seminar topic..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-700 font-medium"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={maxMarks || 100}
                          step={0.5}
                          value={row.marks_obtained ?? ''}
                          onChange={(e) => handleMarksChange(idx, e.target.value)}
                          className="w-20 text-center border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 font-semibold text-gray-800"
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  );
                })}
                {gradeRoster.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 text-sm font-medium">
                      No students found in this course section.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
