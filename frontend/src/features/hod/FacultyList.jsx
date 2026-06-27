import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, BookOpen, Clock } from 'lucide-react';

export const FacultyList = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await axios.get('/api/hod/faculty');
        setFaculty(res.data);
      } catch (err) {
        setError('Failed to load faculty');
      } finally {
        setLoading(false);
      }
    };
    fetchFaculty();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center"><Users className="w-6 h-6 text-blue-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
            <p className="text-sm text-gray-500 font-medium">View and monitor faculty in your department</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {error ? (
            <div className="p-8 text-center text-red-500 font-medium">{error}</div>
          ) : loading ? (
            <div className="p-8 text-center text-gray-500 font-medium">Loading...</div>
          ) : faculty.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <Users className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Faculty Yet</h3>
              <p className="text-gray-500 text-sm">Faculty assigned to your department will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Faculty ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name & Designation</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {faculty.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{f.employee_id}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{f.first_name} {f.last_name}</div>
                      <div className="text-xs text-gray-500">{f.designation || 'Faculty'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{f.college_email}</div>
                      <div className="text-xs text-gray-500">{f.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Placeholder for future detailed view (workload, etc) */}
                      <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">
                        View Workload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
