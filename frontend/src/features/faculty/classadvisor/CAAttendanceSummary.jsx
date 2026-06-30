import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart2, AlertTriangle } from 'lucide-react';

export const CAAttendanceSummary = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    axios.get('/api/class-advisor/attendance-summary')
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load attendance summary'))
      .finally(() => setLoading(false));
  }, []);

  const displayed = filter === 'below75' ? data.filter(s => s.percentage < 75) : data;
  const below75Count = data.filter(s => s.percentage < 75).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Attendance Summary</h1>
            <p className="text-xs text-gray-500">{data.length} students · {below75Count} below 75%</p>
          </div>
        </div>
        {/* Filter tabs */}
        <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-xl p-1">
          {[
            { key: 'all',      label: 'All Students' },
            { key: 'below75',  label: `Below 75% ${below75Count > 0 ? `(${below75Count})` : ''}` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`py-2 rounded-lg text-sm font-bold transition-all ${
                filter === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500 font-medium">Loading...</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 font-medium">{error}</div>
      ) : displayed.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center">
          <BarChart2 className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-gray-500 font-medium">
            {filter === 'below75' ? 'No students below 75% — great!' : 'No attendance data yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(s => {
            const low = s.percentage < 75;
            return (
              <div
                key={s.student_id}
                className={`bg-white rounded-2xl border shadow-sm p-4 ${low ? 'border-red-200' : 'border-gray-100'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${low ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {s.first_name.charAt(0)}{s.last_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-gray-900 truncate">{s.first_name} {s.last_name}</p>
                      {low && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs font-mono text-gray-400">{s.register_number}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-lg font-extrabold ${low ? 'text-red-600' : 'text-green-600'}`}>
                      {s.percentage}%
                    </span>
                    <p className="text-xs text-gray-400">{s.present_days}/{s.total_days} days</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${low ? 'bg-red-400' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, s.percentage)}%` }}
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
