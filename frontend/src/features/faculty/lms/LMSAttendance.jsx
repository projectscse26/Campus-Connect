import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Users, ArrowLeft, CheckCircle, XCircle, Save } from 'lucide-react';

export const LMSAttendance = () => {
  const { assignmentId } = useParams();
  
  const today = new Date().toISOString().split('T')[0];
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`/api/faculty/courses/${assignmentId}/attendance-slots`)
      .then(r => {
        setData(r.data);
        setStudents(r.data.students || []);
      })
      .catch(() => setError('Failed to load attendance data'))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  const toggle = (studentId) => {
    setSaved(false);
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      let nextStatus = 'present';
      if (s.status === 'present') nextStatus = 'absent';
      else if (s.status === 'absent') nextStatus = 'holiday';
      return { ...s, status: nextStatus };
    }));
  };

  const markAll = (status) => {
    setSaved(false);
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const activeSlot = data?.today_slots?.find(s => s.is_active);
      await axios.post(`/api/faculty/courses/${assignmentId}/attendance`, {
        slot_start_time: activeSlot?.start_time || null,
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
                data.today_slots.map(slot => (
                  <span
                    key={slot.id}
                    className={`px-4 py-1.5 text-sm font-bold rounded-xl border ${
                      slot.is_current ? 'bg-green-100 text-green-700 border-green-300 shadow-sm' :
                      slot.is_active  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                  >
                    {slot.start_time}–{slot.end_time}
                    {slot.room ? ` · ${slot.room}` : ''}
                    {slot.is_current ? ' ● Now' : slot.is_active ? ' ✓ Started' : ' ⏳ Upcoming'}
                  </span>
                ))
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
              <button onClick={() => markAll('holiday')} className="flex-1 sm:flex-none px-4 py-2 bg-purple-100 text-purple-700 text-sm font-bold rounded-xl hover:bg-purple-200 transition-colors">
                Mark Holiday
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
            {saved && <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-lg">✓ Saved Successfully</span>}
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
