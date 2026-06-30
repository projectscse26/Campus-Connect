import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Info, Building2, Users, GraduationCap, BookOpen, Hash } from 'lucide-react';

export const CAClassInfo = () => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/class-advisor/my-class')
      .then(r => setInfo(r.data))
      .catch(() => setError('Failed to load class information'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading...</div>;
  if (error)   return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;
  if (!info)   return null;

  const rows = [
    { label: 'Department',     value: `${info.department_name} (${info.department_code})`, icon: Building2 },
    { label: 'Year',           value: `Year ${info.year}`,         icon: GraduationCap },
    { label: 'Semester',       value: `Semester ${info.semester}`, icon: BookOpen },
    { label: 'Section',        value: info.section_name,           icon: Hash },
    { label: 'Batch',          value: info.batch,                  icon: Info },
    { label: 'Total Students', value: info.total_students,         icon: Users },
    { label: 'Class Advisor',  value: info.advisor_name,           icon: GraduationCap },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Info className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Class Information</h1>
          <p className="text-xs text-gray-500">Your assigned class details</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
        {rows.map(row => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                <span className="text-xs font-semibold text-gray-400 flex-shrink-0">{row.label}</span>
                <span className="text-sm font-bold text-gray-900 text-right">{row.value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
