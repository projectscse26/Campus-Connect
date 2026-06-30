import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CalendarDays, Save } from 'lucide-react';

export const CADailyAttendance = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const fetchAttendance = useCallback((dateStr) => {
    setLoading(true);
    setError(null);
    setSaved(false);
    axios.get(`/api/class-advisor/attendance?date=${dateStr}`)
      .then(r => setStudents(r.data))
      .catch(() => setError('Failed to load students'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAttendance(selectedDate); }, [selectedDate, fetchAttendance]);

  // Toggle: unmarked → present → absent → present
  const toggle = (studentId) => {
    setStudents(prev => prev.map(s => {
      if (s.student_id !== studentId) return s;
      const next = s.status === 'present' ? 'absent' : 'present';
      return { ...s, status: next };
    }));
    setSaved(false);
  };

  const markAll = (status) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
    setSaved(false);
  };

  const handleSave = async () => {
    if (selectedDate !== today) { alert('Attendance can only be saved for today.'); return; }
    setSaving(true);
    try {
      await axios.post('/api/class-advisor/attendance', {
        date: selectedDate,
        records: students.filter(s => s.status).map(s => ({ student_id: s.student_id, status: s.status }))
      });
      setSaved(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const isToday = selectedDate === today;
  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount  = students.filter(s => s.status === 'absent').length;
  const unmarked     = students.filter(s => !s.status).length;

  return (
    <div className="max-w-lg mx-auto pb-24">

      {/* Date picker */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 flex items-center gap-3">
        <CalendarDays className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={e => setSelectedDate(e.target.value)}
          className="flex-1 bg-transparent text-sm font-bold text-gray-800 outline-none"
        />
        {!isToday && (
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Read-only</span>
        )}
      </div>

      {/* Counts + mark-all */}
      {students.length > 0 && isToday && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 rounded-xl">
            <span className="text-base font-extrabold text-green-600">{presentCount}</span>
            <span className="text-xs font-semibold text-green-700">P</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 rounded-xl">
            <span className="text-base font-extrabold text-red-600">{absentCount}</span>
            <span className="text-xs font-semibold text-red-700">A</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 rounded-xl">
            <span className="text-base font-extrabold text-gray-500">{unmarked}</span>
            <span className="text-xs font-semibold text-gray-400">—</span>
          </div>
          <button
            onClick={() => markAll('present')}
            className="px-3 py-2 bg-green-500 text-white text-xs font-bold rounded-xl active:bg-green-600"
          >
            All P
          </button>
          <button
            onClick={() => markAll('absent')}
            className="px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-xl active:bg-red-600"
          >
            All A
          </button>
        </div>
      )}

      {/* Student list */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 text-sm">{error}</div>
      ) : students.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">No students found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
          {students.map((s, idx) => {
            const isPresent = s.status === 'present';
            const isAbsent  = s.status === 'absent';

            return (
              <div key={s.student_id} className="flex items-center px-4 py-3 gap-3">
                {/* Serial */}
                <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0 text-right">{idx + 1}</span>

                {/* Name + reg */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate leading-tight">{s.first_name} {s.last_name}</p>
                  <p className="text-xs font-mono text-gray-400 leading-tight">{s.register_number}</p>
                </div>

                {/* Toggle — tap to cycle present/absent */}
                {isToday ? (
                  <button
                    onClick={() => toggle(s.student_id)}
                    className={`w-20 py-1.5 rounded-xl text-xs font-extrabold flex-shrink-0 transition-colors active:scale-95 ${
                      isPresent ? 'bg-green-500 text-white' :
                      isAbsent  ? 'bg-red-500 text-white'  :
                      'bg-gray-100 text-gray-400 border border-dashed border-gray-300'
                    }`}
                  >
                    {isPresent ? '✓ Present' : isAbsent ? '✕ Absent' : 'Tap'}
                  </button>
                ) : (
                  <span className={`w-20 py-1.5 rounded-xl text-xs font-bold text-center flex-shrink-0 ${
                    isPresent ? 'bg-green-50 text-green-700' :
                    isAbsent  ? 'bg-red-50 text-red-700'    :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {s.status ? (isPresent ? 'Present' : 'Absent') : '—'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky save */}
      {isToday && students.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur border-t border-gray-100 shadow-lg z-40">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            {saved && <span className="text-sm font-semibold text-green-600">✓ Saved</span>}
            <button
              onClick={handleSave}
              disabled={saving || unmarked === students.length}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white text-sm font-bold rounded-xl active:bg-primary-700 disabled:opacity-40 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : `Save  ·  ${presentCount}P  ${absentCount}A`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
