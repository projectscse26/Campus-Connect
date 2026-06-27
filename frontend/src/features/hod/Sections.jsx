import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Plus, X, Edit2, Trash2, UserCheck } from 'lucide-react';

export const Sections = () => {
  const [sections, setSections] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', year: 1, batch: '' });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [secRes, facRes] = await Promise.all([
        axios.get('/api/hod/sections'),
        axios.get('/api/hod/faculty')
      ]);
      setSections(secRes.data);
      setFaculty(facRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (sec = null) => {
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

  const handleDelete = async (id) => {
    if (window.confirm('Delete this section?')) {
      try { await axios.delete(`/api/hod/sections/${id}`); await fetchData(); }
      catch (err) { alert(err.response?.data?.detail || 'Failed to delete'); }
    }
  };

  const handleAssignAdvisor = async (sectionId, advisorId) => {
    try {
      await axios.put(`/api/hod/sections/${sectionId}`, { class_advisor_id: advisorId ? parseInt(advisorId) : null });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign advisor');
    }
  };

  const getFacultyName = (id) => {
    const f = faculty.find(fac => fac.id === id);
    return f ? `${f.first_name} ${f.last_name}` : '—';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center"><Layers className="w-6 h-6 text-purple-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Section Management</h1>
            <p className="text-sm text-gray-500 font-medium">Create sections and assign class advisors</p>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Section
        </button>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {error ? (
            <div className="p-8 text-center text-red-500 font-medium">{error}</div>
          ) : loading ? (
            <div className="p-8 text-center text-gray-500 font-medium">Loading...</div>
          ) : sections.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <Layers className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Sections Yet</h3>
              <p className="text-gray-500 text-sm">Create your first section to get started.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Year & Batch</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Class Advisor</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sections.map(sec => (
                  <tr key={sec.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-3 py-1.5 bg-purple-50 text-purple-700 font-bold text-sm rounded-lg border border-purple-100">
                        Section {sec.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">Year {sec.year}</div>
                      <div className="text-xs text-gray-500">{sec.batch}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={sec.class_advisor_id || ''}
                        onChange={(e) => handleAssignAdvisor(sec.id, e.target.value)}
                        className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                      >
                        <option value="">— No Advisor —</option>
                        {faculty.map(f => (
                          <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenModal(sec)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors mr-2" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(sec.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
    </div>
  );
};
