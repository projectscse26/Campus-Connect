import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Users, ArrowLeft, CheckCircle, XCircle, Save, BookOpen, Layers } from 'lucide-react';

export const LMSAttendance = () => {
  const { assignmentId } = useParams();

  const today = new Date().toISOString().split('T')[0];
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  // Unit / Topic dropdown state
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [planTopics, setPlanTopics] = useState([]);
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/faculty/courses/${assignmentId}/attendance-slots`)
      .then(r => {
        setData(r.data);
        setStudents(r.data.students || []);
        const currentSlot = r.data.today_slots?.find(s => s.is_current);
        const activeSlot = r.data.today_slots?.find(s => s.is_active);
        if (currentSlot) setSelectedSlotId(currentSlot.id);
        else if (activeSlot) setSelectedSlotId(activeSlot.id);
      })
      .catch(() => setError('Failed to load attendance data'))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  // Fetch course plan topics for unit/topic dropdowns
  useEffect(() => {
    axios.get(`/api/course-plan/${assignmentId}`)
      .then(r => {
        setPlanTopics(r.data.topics || []);
      })
      .catch(() => setPlanTopics([]))
      .finally(() => setPlanLoading(false));
  }, [assignmentId]);

  // Derive unique units from plan topics
  const units = useMemo(() => {
    const seen = new Set();
    return planTopics
      .filter(t => { if (seen.has(t.unit)) return false; seen.add(t.unit); return true; })
      .map(t => t.unit);
  }, [planTopics]);

  // Filter topics by selected unit
  const filteredTopics = useMemo(() => {
    if (!selectedUnit) return [];
    return planTopics.filter(t => t.unit === selectedUnit);
  }, [planTopics, selectedUnit]);

  const toggle = (studentId) => {
    setSaved(false);
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      return { ...s, status: s.status === 'present' ? 'absent' : 'present' };
    }));
  };

  const markAll = (status) => {
    setSaved(false);
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSave = async () => {
    const activeSlot = data?.today_slots?.find(s => s.id === selectedSlotId);
    if (!activeSlot) {
      alert('Please select a period to mark attendance.');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`/api/faculty/courses/${assignmentId}/attendance`, {
        slot_start_time: activeSlot.start_time,
        topic_id: selectedTopicId ? parseInt(selectedTopicId, 10) : null,
        records: students.filter(s => s.status).map(s => ({ student_id: s.id, status: s.status }))
      });
      setSaved(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <XCircle className="w-12 h-12 mb-4" />
        <p className="font-semibold">{error}</p>
        <Link to={`/faculty/courses/${assignmentId}/lms`} className="mt-4 text-blue-600 underline">Return to Dashboard</Link>
      </div>
    );
  }

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const unmarked = students.filter(s => !s.status).length;
  const hasSlotToday = data?.today_slots?.length > 0;
  const canMark = data?.today_slots?.some(s => s.is_active);
  const nextSlot = data?.today_slots?.find(s => !s.is_active);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link
            to={`/faculty/courses/${assignmentId}/lms`}
            className="text-gray-500 hover:text-green-600 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" /> Daily Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-1">Mark attendance for today's lecture or lab sessions.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Course info + period status */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{data.course_code} — {data.course_name}</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">Section: {data.section} &nbsp;·&nbsp; {today}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!hasSlotToday ? (
                <span className="px-4 py-1.5 bg-amber-50 text-amber-700 text-sm font-bold rounded-xl border border-amber-100">
                  No class scheduled today ({data.today_day?.toUpperCase()})
                </span>
              ) : (
                data.today_slots.map(slot => {
                  const periodMap = {
                    '08:45': '1', '09:30': '2', '10:35': '3', '11:25': '4',
                    '13:00': '5', '13:50': '6', '14:50': '7', '15:40': '8'
                  };
                  const pNum = periodMap[slot.start_time];
                  return (
                    <button
                      key={slot.id}
                      onClick={() => slot.is_active && setSelectedSlotId(slot.id)}
                      disabled={!slot.is_active}
                      className={`px-4 py-1.5 text-sm font-bold rounded-xl border transition-all ${
                        slot.id === selectedSlotId ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-300 ring-offset-1' :
                        slot.is_current ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200 cursor-pointer' :
                        slot.is_active  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer' :
                        'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed opacity-75'
                      }`}
                    >
                      {pNum ? `Period ${pNum} · ` : ''}{slot.start_time}–{slot.end_time}
                      {slot.room ? ` · ${slot.room}` : ''}
                      {slot.is_current ? ' ● On going' : slot.is_active ? ' ✓ Ended' : ' ⏳ Upcoming'}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Lock message */}
          {hasSlotToday && !canMark && (
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 px-4 py-3 rounded-xl border border-amber-100">
              ⏳ Attendance will unlock when the period starts
              {nextSlot && ` at ${nextSlot.start_time}`}.
            </div>
          )}

          {/* Lesson Plan Topic Selector */}
          {hasSlotToday && canMark && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {/* Unit Selector */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5" /> Select Unit
                </label>
                <select
                  value={selectedUnit}
                  onChange={e => { setSelectedUnit(e.target.value); setSelectedTopicId(''); }}
                  disabled={planLoading || units.length === 0}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{planLoading ? 'Loading plan…' : units.length === 0 ? 'No plan found' : 'Select Unit'}</option>
                  {units.map(u => (
                    <option key={u} value={u}>Unit {u}</option>
                  ))}
                </select>
              </div>

              {/* Topic Selector */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5" /> Select Topic to Cover
                </label>
                <select
                  value={selectedTopicId}
                  onChange={e => setSelectedTopicId(e.target.value)}
                  disabled={!selectedUnit || filteredTopics.length === 0}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Topic</option>
                  {filteredTopics.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.topic.length > 80 ? t.topic.substring(0, 80) + '…' : t.topic}
                      {t.is_signed ? ' ✓' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Selected topic details preview */}
          {hasSlotToday && canMark && selectedTopicId && (() => {
            const topic = planTopics.find(t => t.id === parseInt(selectedTopicId, 10));
            if (!topic) return null;
            return (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm mt-3">
                <p className="font-bold text-green-800 mb-1 flex items-center gap-1.5">
                  📘 Unit {topic.unit} · S.No {topic.sequence_no}
                  {topic.is_signed && <span className="ml-2 text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full">Already Covered</span>}
                </p>
                <p className="text-green-700">{topic.topic}</p>
                {topic.proposed_date && (
                  <p className="text-xs text-green-600 mt-1.5">
                    Proposed Date: {topic.proposed_date} &nbsp;·&nbsp; Delivery Mode: {topic.mode_of_delivery} &nbsp;·&nbsp; Cognitive Level: {topic.cognitive_level}
                  </p>
                )}
              </div>
            );
          })()}
        </div>

        {/* Mark controls */}
        {hasSlotToday && canMark && students.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold flex-1 sm:flex-none justify-center">
              <CheckCircle className="w-5 h-5" /> {presentCount} Present
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-bold flex-1 sm:flex-none justify-center">
              <XCircle className="w-5 h-5" /> {absentCount} Absent
            </div>
            {unmarked > 0 && (
              <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-bold flex-1 sm:flex-none justify-center text-center">
                {unmarked} Unmarked
              </div>
            )}
            <div className="sm:ml-auto flex flex-wrap gap-2 w-full sm:w-auto">
              <button onClick={() => markAll('present')} className="flex-1 sm:flex-none px-4 py-2 bg-green-100 text-green-700 text-sm font-bold rounded-xl hover:bg-green-200 transition-colors">
                Mark All Present
              </button>
              <button onClick={() => markAll('absent')} className="flex-1 sm:flex-none px-4 py-2 bg-red-100 text-red-700 text-sm font-bold rounded-xl hover:bg-red-200 transition-colors">
                Mark All Absent
              </button>
            </div>
          </div>
        )}

        {/* Student list */}
        {students.length === 0 ? (
          <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-200 border-dashed">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium">No students found in this section.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
            {students.map((s, idx) => {
              const isPresent = s.status === 'present';
              const isAbsent  = s.status === 'absent';
              const isHoliday = s.status === 'holiday';
              return (
                <div key={s.id} className="flex items-center px-6 py-4 gap-4 hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-bold text-gray-400 w-6 text-right flex-shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 truncate">{s.first_name} {s.last_name}</p>
                    <p className="text-xs font-mono text-gray-500 mt-1">{s.register_number}</p>
                  </div>
                  {hasSlotToday && canMark ? (
                    <button
                      onClick={() => toggle(s.id)}
                      className={`w-32 py-2 rounded-xl text-sm font-bold flex-shrink-0 transition-all ${
                        isPresent ? 'bg-green-500 text-white shadow-md shadow-green-200' :
                        isAbsent  ? 'bg-red-500 text-white shadow-md shadow-red-200'   :
                        isHoliday ? 'bg-purple-500 text-white shadow-md shadow-purple-200' :
                        'bg-gray-100 text-gray-500 border border-dashed border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {isPresent ? '✓ Present' : isAbsent ? '✕ Absent' : isHoliday ? '🏖️ Holiday' : 'Tap to Mark'}
                    </button>
                  ) : (
                    <span className={`w-32 py-2 rounded-xl text-sm font-bold text-center flex-shrink-0 ${
                      isPresent ? 'bg-green-50 text-green-700' :
                      isAbsent  ? 'bg-red-50 text-red-700'    :
                      isHoliday ? 'bg-purple-50 text-purple-700' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {isPresent ? 'Present' : isAbsent ? 'Absent' : isHoliday ? 'Holiday' : 'Unmarked'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Save */}
        {hasSlotToday && canMark && students.length > 0 && (
          <div className="flex items-center justify-end gap-4 pt-4 pb-8">
            {saved && (
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                  ✓ Saved Successfully{selectedTopicId ? ' — Lesson Plan Updated' : ''}
                </span>
                <Link
                  to={`/faculty/courses/${assignmentId}/lms/syllabus`}
                  state={{ mode: 'record' }}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 underline"
                >
                  Verify Lesson Plan Coverage Record →
                </Link>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving || unmarked === students.length}
              className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors shadow-sm disabled:opacity-40"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : `Save Attendance (${presentCount}P / ${absentCount}A)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
