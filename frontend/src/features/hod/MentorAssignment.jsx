import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, X, Trash2 } from 'lucide-react';

export const MentorAssignment = () => {
  const [mentors, setMentors] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const yr = new Date().getFullYear();
  const [formData, setFormData] = useState({ mentor_id: '', student_id: '', academic_year: `${yr}-${yr+1}` });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, fRes, sRes] = await Promise.all([
        axios.get('/api/hod/mentors'),
        axios.get('/api/hod/faculty'),
        axios.get('/api/hod/students')
      ]);
      setMentors(mRes.data);
      setFaculty(fRes.data);
      setStudents(sRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Filter out students who already have a mentor
  const assignedStudentIds = new Set(mentors.map(m => m.student_id));
  const availableStudents = students.filter(s => !assignedStudentIds.has(s.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      await axios.post('/api/hod/mentors', {
        mentor_id: parseInt(formData.mentor_id),
        student_id: parseInt(formData.student_id),
        academic_year: formData.academic_year
      });
      await fetchData();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to assign mentor');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remove this mentor assignment?')) {
      try { await axios.delete(`/api/hod/mentors/${id}`); await fetchData(); }
      catch (err) { alert(err.response?.data?.detail || 'Failed to delete'); }
    }
  };

  const getFacultyName = (id) => { const f = faculty.find(i => i.id === id); return f ? `${f.first_name} ${f.last_name}` : `#${id}`; };
  const getStudentName = (id) => { const s = students.find(i => i.id === id); return s ? `${s.first_name} ${s.last_name} (${s.register_number})` : `#${id}`; };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center"><Users className="w-6 h-6 text-emerald-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mentor Assignments</h1>
            <p className="text-sm text-gray-500 font-medium">Assign faculty mentors to students</p>
          </div>
        </div>
        <button onClick={() => { setFormData({ mentor_id: faculty[0]?.id || '', student_id: availableStudents[0]?.id || '', academic_year: `${yr}-${yr+1}` }); setFormError(null); setIsModalOpen(true); }} className="flex items-center px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Assign Mentor
        </button>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {error ? (
            <div className="p-8 text-center text-red-500 font-medium">{error}</div>
          ) : loading ? (
            <div className="p-8 text-center text-gray-500 font-medium">Loading...</div>
          ) : mentors.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <Users className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Mentor Assignments Yet</h3>
              <p className="text-gray-500 text-sm">Assign a faculty mentor to a student.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mentor (Faculty)</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Academic Year</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mentors.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{getFacultyName(m.mentor_id)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{getStudentName(m.student_id)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{m.academic_year}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(m.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove"><Trash2 className="w-4 h-4" /></button>
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
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Assign Mentor</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">{formError}</div>}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Faculty Mentor</label>
                <select required value={formData.mentor_id} onChange={(e) => setFormData({...formData, mentor_id: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none">
                  {faculty.map(f => <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Student</label>
                <select required value={formData.student_id} onChange={(e) => setFormData({...formData, student_id: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none">
                  {availableStudents.length === 0 && <option value="">All students already assigned</option>}
                  {availableStudents.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.register_number})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Academic Year</label>
                <input type="text" required value={formData.academic_year} onChange={(e) => setFormData({...formData, academic_year: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none" />
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={formLoading || availableStudents.length === 0} className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50">
                  {formLoading ? 'Assigning...' : 'Assign Mentor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
