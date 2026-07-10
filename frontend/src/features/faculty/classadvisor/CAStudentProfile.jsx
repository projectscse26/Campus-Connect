import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, BookOpen, User } from 'lucide-react';

export const CAStudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`/api/class-advisor/students/${studentId}`)
      .then(r => setStudent(r.data))
      .catch(() => setError('Failed to load student profile'))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading...</div>;
  if (error)   return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;
  if (!student) return null;

  const attPct = student.overall_attendance_percentage;
  const attLow = attPct < 75;

  const infoRows = [
    { label: 'Register No.',  value: student.register_number },
    { label: 'Department',    value: `${student.department_code}` },
    { label: 'Year',          value: `Year ${student.year}` },
    { label: 'Semester',      value: student.semester ? `Sem ${student.semester}` : '—' },
    { label: 'Section',       value: student.section_name },
    { label: 'Mobile',        value: student.phone },
    { label: 'Gender',        value: student.gender || '—' },
    { label: 'Father Phone',  value: student.father_phone ? <a href={`tel:${student.father_phone}`} className="text-blue-600 hover:underline">{student.father_phone}</a> : '—' },
    { label: 'Mother Phone',  value: student.mother_phone ? <a href={`tel:${student.mother_phone}`} className="text-blue-600 hover:underline">{student.mother_phone}</a> : '—' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Back */}
      <button
        onClick={() => navigate('/faculty/class-advisor/students')}
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 active:text-gray-800 py-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Student List
      </button>

      {/* Avatar + name */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-xl font-extrabold text-purple-600 flex-shrink-0">
          {student.first_name.charAt(0)}{student.last_name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">{student.first_name} {student.last_name}</h1>
          <p className="text-xs text-gray-400 font-mono">{student.register_number}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-xl font-bold text-sm flex-shrink-0 ${attLow ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {attPct}%
        </div>
      </div>

      {/* Info grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> Personal Info
        </p>
        <div className="grid grid-cols-2 gap-2">
          {infoRows.map(row => (
            <div key={row.label} className="bg-gray-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-400 font-semibold mb-0.5">{row.label}</p>
              <p className="text-sm font-bold text-gray-900 break-all">
                {typeof row.value === 'string' ? row.value : row.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Attendance</p>
        <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${attLow ? 'bg-red-50' : 'bg-green-50'}`}>
          <span className={`text-sm font-semibold ${attLow ? 'text-red-700' : 'text-green-700'}`}>
            Overall Attendance
          </span>
          <span className={`text-lg font-extrabold ${attLow ? 'text-red-700' : 'text-green-700'}`}>
            {attPct}%
          </span>
        </div>
        {attLow && (
          <p className="mt-2 text-xs text-red-600 font-semibold px-1">⚠ Below 75% threshold</p>
        )}
      </div>

      {/* Enrolled subjects */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> Enrolled Subjects
        </p>
        {student.enrolled_subjects.length === 0 ? (
          <p className="text-sm text-gray-400 font-medium">No subjects enrolled yet.</p>
        ) : (
          <div className="space-y-2">
            {student.enrolled_subjects.map(sub => (
              <div key={sub.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-gray-400 mr-2">{sub.code}</span>
                  <span className="text-sm font-semibold text-gray-900">{sub.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-400 flex-shrink-0 ml-2">{sub.credits} cr</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
