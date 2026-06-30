import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GraduationCap, Search, Filter, ChevronLeft, Users, UserPlus } from 'lucide-react';
import AssignStudentsKanban from './AssignStudentsKanban';

export const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Navigation State
  // Navigation State
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  // Search state for detailed view
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get('/api/hod/students');
        setStudents(res.data);
      } catch (err) {
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [isAssignModalOpen]); // Re-fetch when modal closes to reflect changes

  // Compute unique sections from students data
  const availableSections = Array.from(new Map(
    students.filter(s => s.section).map(s => [s.section.id, s.section])
  ).values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.name.localeCompare(b.name);
  });

  // Calculate student counts per section
  const sectionCounts = students.reduce((acc, student) => {
    if (student.section) {
      acc[student.section.id] = (acc[student.section.id] || 0) + 1;
    }
    return acc;
  }, {});

  // Section Cards View (Default)
  const renderSectionsView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {availableSections.map(sec => (
          <div 
            key={sec.id}
            onClick={() => {
              setSelectedSectionId(sec.id);
              setSearchTerm('');
            }}
            className="bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 cursor-pointer hover:border-indigo-300 hover:shadow-[0_4px_15px_rgb(0,0,0,0.05)] transition-all group flex flex-col items-center text-center h-full"
          >
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Year {sec.year}
            </h3>
            <span className="text-sm font-medium text-gray-500 mb-4 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
              Section {sec.name}
            </span>
            <div className="mt-auto w-full pt-4 border-t border-gray-100">
              <p className="text-indigo-600 font-bold text-sm">
                {sectionCounts[sec.id] || 0} Students Enrolled
              </p>
            </div>
          </div>
        ))}
        {availableSections.length === 0 && !loading && !error && (
           <div className="col-span-full p-16 flex flex-col items-center justify-center text-center bg-white rounded-[24px] border border-gray-100">
             <GraduationCap className="w-12 h-12 text-gray-300 mb-4" />
             <h3 className="text-lg font-bold text-gray-900 mb-1">No Sections Found</h3>
             <p className="text-gray-500 text-sm">There are no students with assigned sections in your department.</p>
           </div>
        )}
      </div>
    );
  };

  // Detailed Table View
  const renderStudentTableView = () => {
    const selectedSection = availableSections.find(s => s.id === selectedSectionId);
    const filteredStudents = students.filter(s => {
      if (!s.section || s.section.id !== selectedSectionId) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        s.register_number.toLowerCase().includes(term) ||
        s.first_name.toLowerCase().includes(term) ||
        s.last_name.toLowerCase().includes(term)
      );
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => setSelectedSectionId(null)}
            className="flex items-center text-gray-500 hover:text-indigo-600 font-bold transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Back to Sections
          </button>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Year {selectedSection?.year} - Section {selectedSection?.name}
              </h2>
              <p className="text-sm font-medium text-gray-500">{filteredStudents.length} Students</p>
            </div>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search in section..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
            />
          </div>
          <button 
            onClick={() => setIsAssignModalOpen(true)}
            className="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Assign Students
          </button>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <GraduationCap className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No Students Found</h3>
                <p className="text-gray-500 text-sm">No students match your search in this section.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reg No</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Batch</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{s.register_number}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{s.first_name} {s.last_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{s.batch}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{s.current_semester}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">
                          View Profile
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {selectedSectionId === null && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
              <p className="text-sm text-gray-500 font-medium">Select a section to view students</p>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="p-8 text-center text-red-500 font-medium bg-red-50 rounded-2xl border border-red-100">{error}</div>
      ) : loading ? (
        <div className="p-8 text-center text-gray-500 font-medium bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          Loading students...
        </div>
      ) : selectedSectionId === null ? (
        renderSectionsView()
      ) : (
        renderStudentTableView()
      )}

      {/* Assign Students Kanban Modal */}
      {isAssignModalOpen && selectedSectionId && (
        <AssignStudentsKanban 
          section={availableSections.find(s => s.id === selectedSectionId)}
          onClose={() => setIsAssignModalOpen(false)}
          onSaveComplete={() => setIsAssignModalOpen(false)}
        />
      )}
    </div>
  );
};
