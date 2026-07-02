import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, BookOpen, Clock, X, GraduationCap, Calendar } from 'lucide-react';

export const FacultyList = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workloadModal, setWorkloadModal] = useState({ open: false, data: null, loading: false });

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

  const handleViewWorkload = async (facultyMember) => {
    setWorkloadModal({ open: true, data: null, loading: true });
    try {
      const res = await axios.get(`/api/faculty/${facultyMember.id}/workload`);
      setWorkloadModal({ open: true, data: res.data, loading: false });
    } catch (err) {
      console.error('Failed to load workload:', err);
      setWorkloadModal({ open: true, data: { error: 'Failed to load workload data' }, loading: false });
    }
  };

  const closeWorkloadModal = () => {
    setWorkloadModal({ open: false, data: null, loading: false });
  };

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
                      <button 
                        onClick={() => handleViewWorkload(f)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
                      >
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

      {/* Workload Modal */}
      {workloadModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-[24px] shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Faculty Workload</h2>
                  {workloadModal.data && !workloadModal.loading && !workloadModal.data.error && (
                    <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">
                      {workloadModal.data.faculty_name} • {workloadModal.data.employee_id}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={closeWorkloadModal}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {workloadModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : workloadModal.data?.error ? (
                <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-xl text-xs sm:text-sm font-medium border border-red-100">
                  {workloadModal.data.error}
                </div>
              ) : workloadModal.data ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Total Courses</p>
                          <p className="text-2xl sm:text-3xl font-bold text-blue-900">{workloadModal.data.total_active_courses}</p>
                        </div>
                        <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mt-2 sm:mt-0" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-purple-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[10px] sm:text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">Total Hours</p>
                          <p className="text-2xl sm:text-3xl font-bold text-purple-900">{workloadModal.data.total_hours}</p>
                        </div>
                        <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mt-2 sm:mt-0" />
                      </div>
                    </div>
                  </div>

                  {/* Course List */}
                  {workloadModal.data.courses.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 sm:p-12 text-center">
                      <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">No Courses Assigned</h3>
                      <p className="text-gray-500 text-xs sm:text-sm">This faculty member has no active course assignments.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {workloadModal.data.courses.map((course) => (
                        <div key={course.id} className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-2 sm:space-x-3 mb-2">
                                <span className="bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded uppercase tracking-wide">
                                  {course.course_code}
                                </span>
                                <span className="bg-gray-100 text-gray-700 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded">
                                  Sem {course.semester}
                                </span>
                                <span className="bg-purple-50 text-purple-700 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded">
                                  {course.periods} {course.periods === 1 ? 'Hour' : 'Hours'}/Week
                                </span>
                              </div>
                              <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2 break-words">{course.course_name}</h4>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-600">
                                <span className="flex items-center">
                                  <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{course.section}</span>
                                </span>
                                <span className="flex items-center">
                                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{course.course_type}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-4 sm:p-6 bg-gray-50">
              <button
                onClick={closeWorkloadModal}
                className="w-full px-4 py-2 sm:py-2.5 bg-gray-900 text-white text-sm sm:text-base font-bold rounded-lg sm:rounded-xl hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
