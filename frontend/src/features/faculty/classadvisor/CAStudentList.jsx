import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, GraduationCap, ChevronRight, Phone } from 'lucide-react';

export const CAStudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/class-advisor/students')
      .then(r => setStudents(r.data))
      .catch(() => setError('Failed to load students'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    s.register_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Student List</h1>
            <p className="text-xs text-gray-500">{students.length} students in your class</p>
          </div>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or register no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white outline-none transition-all"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 text-center text-gray-500 font-medium">Loading...</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 font-medium">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center">
          <GraduationCap className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-gray-500 font-medium">No students found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => navigate(`/faculty/class-advisor/students/${s.id}`)}
              className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 active:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-sm font-extrabold text-purple-600 flex-shrink-0">
                {s.first_name.charAt(0)}{s.last_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{s.first_name} {s.last_name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs font-mono text-gray-400">{s.register_number}</span>
                  {s.phone && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Phone className="w-3 h-3" />{s.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {s.gender && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-lg">
                    {s.gender}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
