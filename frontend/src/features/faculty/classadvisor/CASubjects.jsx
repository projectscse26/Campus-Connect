import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen } from 'lucide-react';

const TYPE_BADGE = {
  theory:   'bg-blue-50 text-blue-700',
  lab:      'bg-green-50 text-green-700',
  elective: 'bg-purple-50 text-purple-700',
  project:  'bg-orange-50 text-orange-700',
};

export const CASubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/class-advisor/subjects')
      .then(r => setSubjects(r.data))
      .catch(() => setError('Failed to load subjects'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Class Subjects</h1>
          <p className="text-xs text-gray-500">{subjects.length} subjects this semester</p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500 font-medium">Loading...</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 font-medium">{error}</div>
      ) : subjects.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-gray-500 font-medium">No subjects assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subjects.map(sub => (
            <div key={sub.course_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold font-mono text-gray-400">{sub.code}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold capitalize ${TYPE_BADGE[sub.course_type] || 'bg-gray-100 text-gray-600'}`}>
                      {sub.course_type}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mt-1">{sub.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{sub.faculty_name}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="text-lg font-extrabold text-gray-700">{sub.credits}</span>
                  <p className="text-xs text-gray-400">credits</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
