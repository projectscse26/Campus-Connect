import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp } from 'lucide-react';

export const CACourseProgress = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/class-advisor/course-progress')
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load course progress'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Course Progress</h1>
          <p className="text-xs text-gray-500">Syllabus coverage per subject</p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500 font-medium">Loading...</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 font-medium">{error}</div>
      ) : data.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center">
          <TrendingUp className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-gray-500 font-medium">No course progress data yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map(item => {
            const pct = Math.min(100, Math.round((item.units_completed / item.total_units) * 100));
            const barColor = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-400';
            const textColor = pct >= 80 ? 'text-green-700' : pct >= 50 ? 'text-yellow-700' : 'text-red-600';
            return (
              <div key={item.course_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.subject_name}</p>
                    <p className="text-xs text-gray-500">{item.subject_code} · {item.faculty_name}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`text-lg font-extrabold ${textColor}`}>{pct}%</span>
                    <p className="text-xs text-gray-400">{item.units_completed}/{item.total_units} units</p>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
