import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link2, Plus, X, Trash2 } from 'lucide-react';

export const FacultyAssignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const yr = new Date().getFullYear();
  const [formData, setFormData] = useState({ faculty_id: '', course_id: '', section_id: '', academic_year: `${yr}-${yr+1}`, semester: 1 });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aRes, fRes, cRes, sRes] = await Promise.all([
        axios.get('/api/hod/assignments'),
        axios.get('/api/hod/faculty'),
        axios.get('/api/hod/courses'),
        axios.get('/api/hod/sections')
      ]);
      setAssignments(aRes.data);
      setFaculty(fRes.data);
      setCourses(cRes.data);
      setSections(sRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      await axios.post('/api/hod/assignments', {
        ...formData,
        faculty_id: parseInt(formData.faculty_id),
        course_id: parseInt(formData.course_id),
        section_id: parseInt(formData.section_id),
        semester: parseInt(formData.semester)
      });
      await fetchData();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create assignment');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remove this course assignment?')) {
      try { await axios.delete(`/api/hod/assignments/${id}`); await fetchData(); }
      catch (err) { alert(err.response?.data?.detail || 'Failed to delete'); }
    }
  };

  const getName = (list, id, fields = ['first_name', 'last_name']) => {
    const item = list.find(i => i.id === id);
    if (!item) return `#${id}`;
    if (fields.length === 2) return `${item[fields[0]]} ${item[fields[1]]}`;
    return item[fields[0]];
  };

  const getCourseName = (id) => { const c = courses.find(i => i.id === id); return c ? `${c.code} — ${c.name}` : `#${id}`; };
  const getSectionName = (id) => { const s = sections.find(i => i.id === id); return s ? `Section ${s.name} (Year ${s.year})` : `#${id}`; };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center"><Link2 className="w-6 h-6 text-blue-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Course Assignments</h1>
            <p className="text-sm text-gray-500 font-medium">Assign faculty to courses and sections</p>
          </div>
        </div>
        <button onClick={() => { setFormData({ faculty_id: faculty[0]?.id || '', course_id: courses[0]?.id || '', section_id: sections[0]?.id || '', academic_year: `${yr}-${yr+1}`, semester: 1 }); setFormError(null); setIsModalOpen(true); }} className="flex items-center px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> New Assignment
        </button>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {error ? (
            <div className="p-8 text-center text-red-500 font-medium">{error}</div>
          ) : loading ? (
            <div className="p-8 text-center text-gray-500 font-medium">Loading...</div>
          ) : assignments.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <Link2 className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Assignments Yet</h3>
              <p className="text-gray-500 text-sm">Assign a faculty member to a course to get started.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Faculty</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Year & Sem</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignments.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{getName(faculty, a.faculty_id)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{getCourseName(a.course_id)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{getSectionName(a.section_id)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{a.academic_year}</div>
                      <div className="text-xs text-gray-500">Sem {a.semester}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(a.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">New Course Assignment</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">{formError}</div>}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Faculty</label>
                <select required value={formData.faculty_id} onChange={(e) => setFormData({...formData, faculty_id: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none">
                  {faculty.map(f => <option key={f.id} value={f.id}>{f.first_name} {f.last_name} ({f.employee_id})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Course</label>
                <select required value={formData.course_id} onChange={(e) => setFormData({...formData, course_id: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none">
                  {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Section</label>
                <select required value={formData.section_id} onChange={(e) => setFormData({...formData, section_id: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none">
                  {sections.map(s => <option key={s.id} value={s.id}>Section {s.name} (Year {s.year}, {s.batch})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Academic Year</label>
                  <input type="text" required value={formData.academic_year} onChange={(e) => setFormData({...formData, academic_year: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Semester</label>
                  <input type="number" required min="1" max="8" value={formData.semester} onChange={(e) => setFormData({...formData, semester: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50">
                  {formLoading ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
