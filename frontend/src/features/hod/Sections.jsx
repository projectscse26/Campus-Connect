import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Plus, X, Edit2, Trash2, UserPlus, Users, ChevronLeft, GraduationCap } from 'lucide-react';
import AssignStudentsKanban from './AssignStudentsKanban';

export const Sections = () => {
  const [sections, setSections] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal and Edit States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', year: 1, batch: '' });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Detailed View and Kanban States
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [secRes, facRes, stuRes] = await Promise.all([
        axios.get('/api/hod/sections'),
        axios.get('/api/hod/faculty'),
        axios.get('/api/hod/students')
      ]);
      setSections(secRes.data);
      setFaculty(facRes.data);
      setStudents(stuRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [isAssignModalOpen]); // Refresh when kanban closes

  const handleOpenModal = (sec = null, e = null) => {
    if (e) e.stopPropagation(); // Prevent triggering card click
    if (sec) {
      setEditingId(sec.id);
      setFormData({ name: sec.name, year: sec.year, batch: sec.batch });
    } else {
      setEditingId(null);
      const yr = new Date().getFullYear();
      setFormData({ name: '', year: 1, batch: `${yr}-${yr + 4}` });
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const payload = { ...formData, year: parseInt(formData.year) };
      if (editingId) {
        await axios.put(`/api/hod/sections/${editingId}`, payload);
      } else {
        await axios.post('/api/hod/sections', payload);
      }
      await fetchData();
      setIsModalOpen(false);
      setEditingId(null);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save section');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Delete this section?')) {
      try { 
        await axios.delete(`/api/hod/sections/${id}`); 
        if (selectedSectionId === id) setSelectedSectionId(null);
        await fetchData(); 
      }
      catch (err) { alert(err.response?.data?.detail || 'Failed to delete'); }
    }
  };

  const handleAssignAdvisor = async (sectionId, advisorId, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(`/api/hod/sections/${sectionId}`, { class_advisor_id: advisorId ? parseInt(advisorId) : null });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign advisor');
    }
  };

  const sectionCounts = students.reduce((acc, student) => {
    if (student.section) {
      acc[student.section.id] = (acc[student.section.id] || 0) + 1;
    }
    return acc;
  }, {});

  const renderSectionsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sections.length === 0 && !loading && (
        <div className="col-span-full p-16 flex flex-col items-center justify-center text-center bg-white rounded-[32px] border border-gray-100 shadow-sm">
          <Layers className="w-16 h-16 text-gray-200 mb-6" />
          <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">No Sections Yet</h3>
          <p className="text-gray-500 font-medium max-w-sm">Create your first section to organize your students and assign class advisors.</p>
        </div>
      )}
      {sections.map(sec => {
        const studentCount = sectionCounts[sec.id] || 0;
        
        const getOrdinalYear = (year) => {
          if (year === 1) return '1st';
          if (year === 2) return '2nd';
          if (year === 3) return '3rd';
          return `${year}th`;
        };

        return (
          <div 
            key={sec.id}
            onClick={() => setSelectedSectionId(sec.id)}
            className="bg-white p-6 rounded-[24px] shadow-[0_2px_12px_rgb(0,0,0,0.04)] border border-gray-200 cursor-pointer transition-all duration-300 group flex flex-col h-full relative overflow-hidden transform hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgb(0,0,0,0.08)] hover:border-indigo-300"
          >
            {/* Top Badges and Actions */}
            <div className="flex items-center justify-between mb-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-full border border-gray-200 shadow-sm">
                  Batch: {sec.batch}
                </span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={e => e.stopPropagation()}>
                <button onClick={(e) => handleOpenModal(sec, e)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={(e) => handleDelete(sec.id, e)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Combined Section Name */}
            <div className="mb-6 relative z-10">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                {getOrdinalYear(sec.year)} Year - {sec.name} Section
              </h3>
            </div>
            
            <div className="space-y-4 flex-1 relative z-10">
              <div onClick={e => e.stopPropagation()} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <label className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Class Advisor
                  {sec.class_advisor_id && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>}
                </label>
                <select
                  value={sec.class_advisor_id || ''}
                  onChange={(e) => handleAssignAdvisor(sec.id, e.target.value, e)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none cursor-pointer hover:border-indigo-200 transition-all shadow-sm"
                >
                  <option value="">+ Assign Advisor</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[...Array(Math.min(3, studentCount))].map((_, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm z-[${3-i}] ${['bg-indigo-400', 'bg-blue-400', 'bg-teal-400'][i]}`}>
                      <Users className="w-3.5 h-3.5" />
                    </div>
                  ))}
                  {studentCount === 0 && (
                     <div className="w-8 h-8 rounded-full border-2 border-gray-100 border-dashed flex items-center justify-center bg-gray-50 text-gray-400">
                       <UserPlus className="w-3.5 h-3.5" />
                     </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-black text-gray-900">{studentCount}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Students</div>
                </div>
              </div>
              
              <div className="flex items-center justify-center w-10 h-10 bg-gray-50 rounded-full shadow-sm border border-gray-200 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white text-gray-400 transition-all duration-300">
                <ChevronLeft className="w-5 h-5 rotate-180" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSectionDetails = () => {
    const selectedSection = sections.find(s => s.id === selectedSectionId);
    if (!selectedSection) return null;
    
    const sectionStudents = students.filter(s => s.section && s.section.id === selectedSectionId);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => setSelectedSectionId(null)}
            className="flex items-center text-gray-500 hover:text-purple-600 font-bold transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Back to Sections
          </button>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
              <Layers className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Year {selectedSection.year} - Section {selectedSection.name}
              </h2>
              <p className="text-sm font-medium text-gray-500">{selectedSection.batch} • {sectionStudents.length} Students Assigned</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAssignModalOpen(true)}
            className="flex-shrink-0 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Assign Students
          </button>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {sectionStudents.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <GraduationCap className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No Students Assigned</h3>
                <p className="text-gray-500 text-sm">Click the Assign Students button above to add students to this section.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reg No</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Semester</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sectionStudents.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{s.register_number}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{s.first_name} {s.last_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{s.current_semester}</td>
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
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
              <Layers className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Section Management</h1>
              <p className="text-sm text-gray-500 font-medium">Create sections and manage students & advisors</p>
            </div>
          </div>
          <button onClick={() => handleOpenModal()} className="flex items-center px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Section
          </button>
        </div>
      )}

      {error ? (
        <div className="p-8 text-center text-red-500 font-medium bg-red-50 rounded-2xl border border-red-100">{error}</div>
      ) : loading ? (
        <div className="p-8 text-center text-gray-500 font-medium bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          Loading sections...
        </div>
      ) : selectedSectionId === null ? (
        renderSectionsCards()
      ) : (
        renderSectionDetails()
      )}

      {/* Create/Edit Section Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Section' : 'Create Section'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">{formError}</div>}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Section Name (A, B, C...)</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Year</label>
                  <input type="number" required min="1" max="4" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Batch (e.g. 2024-2028)</label>
                  <input type="text" required value={formData.batch} onChange={(e) => setFormData({...formData, batch: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50">
                  {formLoading ? 'Saving...' : editingId ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Students Kanban Modal */}
      {isAssignModalOpen && selectedSectionId && (
        <AssignStudentsKanban 
          section={sections.find(s => s.id === selectedSectionId)}
          onClose={() => setIsAssignModalOpen(false)}
          onSaveComplete={() => setIsAssignModalOpen(false)}
        />
      )}
    </div>
  );
};
