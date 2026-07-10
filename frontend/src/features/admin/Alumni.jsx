import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Search, Mail, Phone, Loader2, Download, Users, BookOpen, ChevronRight, ArrowLeft, GraduationCap } from 'lucide-react';

import { AlumniProfileModal } from './AlumniProfileModal';
import { BatchDataView } from './BatchDataView';

export const Alumni = () => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Navigation State
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Modal State
  const [viewingStudent, setViewingStudent] = useState(null);

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/alumni', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAlumni(res.data);
    } catch (err) {
      console.error("Failed to fetch alumni", err);
    } finally {
      setLoading(false);
    }
  };

  // Level 1 Data: Batches
  const batchGroups = alumni.reduce((acc, student) => {
    const b = student.batch;
    if (!acc[b]) acc[b] = 0;
    acc[b]++;
    return acc;
  }, {});
  
  const batches = Object.keys(batchGroups).sort((a, b) => b.localeCompare(a)); // Sort descending

  // Level 2 Data: Departments in selected batch
  const departmentGroups = selectedBatch ? alumni.filter(a => a.batch === selectedBatch).reduce((acc, student) => {
    const dept = student.department?.name || 'Unknown Department';
    if (!acc[dept]) acc[dept] = 0;
    acc[dept]++;
    return acc;
  }, {}) : {};

  const departments = Object.keys(departmentGroups).sort();

  // Level 3 Data: Filtered students
  const filteredAlumni = alumni.filter(a => {
    if (selectedBatch && a.batch !== selectedBatch) return false;
    if (selectedDepartment && (a.department?.name || 'Unknown Department') !== selectedDepartment) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (a.first_name + " " + a.last_name).toLowerCase().includes(term) ||
        a.register_number.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const renderBatches = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {batches.length === 0 && !loading && (
        <div className="col-span-full p-16 flex flex-col items-center justify-center text-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-slate-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
            <Award className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Alumni Found</h3>
          <p className="text-slate-500 dark:text-gray-400 max-w-sm mt-1">
            There are no graduated students in the system yet. Once a batch completes their 8th semester, they will appear here.
          </p>
        </div>
      )}
      
      {batches.map(batch => (
        <div 
          key={batch}
          onClick={() => setSelectedBatch(batch)}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="bg-slate-50 dark:bg-gray-900 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Batch {batch}</h3>
          <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-sm font-medium">
            <Users className="w-4 h-4" />
            <span>{batchGroups[batch]} Alumni</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDepartments = () => (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300">
      <button 
        onClick={() => setSelectedBatch(null)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Batches
      </button>
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Batch {selectedBatch}</h2>
        <p className="text-slate-500 dark:text-gray-400">Select a department to view alumni</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {departments.map(dept => (
          <div 
            key={dept}
            onClick={() => setSelectedDepartment(dept)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="bg-slate-50 dark:bg-gray-900 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 line-clamp-1" title={dept}>{dept}</h3>
            <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-sm font-medium">
              <Users className="w-4 h-4" />
              <span>{departmentGroups[dept]} Alumni</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTable = () => {
    const totalAlumni = filteredAlumni.length;

    return (
      <div className="animate-in fade-in slide-in-from-right-8 duration-300 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <button 
              onClick={() => setSelectedDepartment(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white font-medium mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Departments
            </button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedDepartment}</h2>
            <p className="text-slate-500 dark:text-gray-400">Batch {selectedBatch} • {totalAlumni} Alumni</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or register number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl font-medium hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors w-full sm:w-auto">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Batch Overall Data UI */}
        {selectedBatch && selectedDepartment && (
          <BatchDataView batch={selectedBatch} departmentName={selectedDepartment} />
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          {filteredAlumni.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No matches found</h3>
              <p className="text-slate-500 dark:text-gray-400 max-w-sm mt-1">
                No students matched your search criteria in this department.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-gray-900/50 border-b border-slate-200 dark:border-gray-700 text-sm font-semibold text-slate-500 dark:text-gray-400">
                    <th className="p-4 pl-6">Student Info</th>
                    <th className="p-4">Contact Details</th>
                    <th className="p-4 text-right pr-6">Historical Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                  {filteredAlumni.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/20 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-gray-400 font-mono mt-0.5">{student.register_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[200px]">{student.college_email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{student.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button 
                          onClick={() => setViewingStudent(student)}
                          className="px-4 py-2 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 text-sm font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          View Records
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header section (only show on Level 1) */}
      {!selectedBatch && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-500">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Award className="w-8 h-8 text-primary-500" />
              Alumni Directory
            </h1>
            <p className="text-slate-500 dark:text-gray-400 mt-1">Browse graduated students by batch and department</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary-500" />
          <p>Loading alumni records...</p>
        </div>
      ) : (
        <>
          {!selectedBatch && renderBatches()}
          {selectedBatch && !selectedDepartment && renderDepartments()}
          {selectedBatch && selectedDepartment && renderTable()}
        </>
      )}

      {/* Render Modal */}
      {viewingStudent && (
        <AlumniProfileModal 
          student={viewingStudent} 
          onClose={() => setViewingStudent(null)} 
        />
      )}
    </div>
  );
};
