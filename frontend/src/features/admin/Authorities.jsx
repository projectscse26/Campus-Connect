import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Plus, X, Search, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

const TITLE_OPTIONS = [
  'Principal',
  'Vice Principal',
  'Dean',
  'Office Manager',
  'Controller of Examinations',
  'Registrar',
  'Librarian',
  'HR',
];

export const Authorities = () => {
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    title: 'Principal',
    email: '',
    phone: '',
    employee_id: '',
    password: 'password123'
  });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Password Reset state
  const [resetPasswordText, setResetPasswordText] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/authorities/');
      setAuthorities(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load authorities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (auth = null) => {
    if (auth) {
      setEditingId(auth.id);
      setEditingUserId(auth.user_id);
      setFormData({
        first_name: auth.first_name,
        last_name: auth.last_name,
        title: auth.title,
        email: auth.email,
        phone: auth.phone,
        employee_id: auth.employee_id,
        password: ''
      });
    } else {
      setEditingId(null);
      setEditingUserId(null);
      setFormData({
        first_name: '',
        last_name: '',
        title: 'Principal',
        email: '',
        phone: '',
        employee_id: '',
        password: 'password123'
      });
    }
    setFormError(null);
    setResetPasswordText('');
    setResetPasswordError(null);
    setResetPasswordSuccess(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setEditingUserId(null);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordText || resetPasswordText.length < 6) {
      setResetPasswordError("Password must be at least 6 characters.");
      return;
    }
    setIsResettingPassword(true);
    setResetPasswordError(null);
    try {
      await axios.post(`/api/admin/users/${editingUserId}/reset-password`, {
        new_password: resetPasswordText
      });
      setResetPasswordSuccess(true);
      setResetPasswordText('');
      setTimeout(() => setResetPasswordSuccess(false), 3000);
    } catch (err) {
      setResetPasswordError(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingId) {
        const payload = { ...formData };
        delete payload.password;
        delete payload.email;
        await axios.put(`/api/authorities/${editingId}`, payload);
      } else {
        await axios.post('/api/authorities/', formData);
      }
      await fetchData();
      handleCloseModal();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save authority');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This will also delete their login account.`)) {
      try {
        await axios.delete(`/api/authorities/${id}`);
        await fetchData();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete authority');
      }
    }
  };

  const filtered = authorities.filter(a =>
    a.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Authorities</h1>
            <p className="text-sm text-gray-500 font-medium">Principal, Deans & College Officers</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Authority
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {error ? (
            <div className="p-8 text-center text-red-500 font-medium">{error}</div>
          ) : loading ? (
            <div className="p-8 text-center text-gray-500 font-medium">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Authorities Found</h3>
              <p className="text-gray-500 text-sm">Add your first college authority.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((auth) => (
                  <tr key={auth.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 text-sm">{auth.first_name} {auth.last_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-lg border border-purple-100">
                        {auth.title}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{auth.email}</div>
                      <div className="text-xs text-gray-500">{auth.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{auth.employee_id}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenModal(auth)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors mr-2"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(auth.id, `${auth.first_name} ${auth.last_name}`)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Authority' : 'Add Authority'}</h3>
              <button onClick={handleCloseModal} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="auth-form" onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">{formError}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">First Name</label>
                  <input type="text" required value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Last Name</label>
                  <input type="text" required value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Title / Designation</label>
                <select value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                >
                  {TITLE_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email (Login)</label>
                  <input type="email" required disabled={!!editingId} value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Phone</label>
                  <input type="tel" required value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Employee ID</label>
                  <input type="text" required value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                  />
                </div>
                {!editingId && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Initial Password</label>
                    <input type="text" required value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                )}
              </div>
            </form>

            {editingId && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Password Management</h3>
                <div className="flex items-start sm:items-center flex-col sm:flex-row gap-3">
                  <div className="flex-1 w-full">
                    <input 
                      type="text" 
                      placeholder="New Temporary Password"
                      value={resetPasswordText}
                      onChange={(e) => setResetPasswordText(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isResettingPassword || !resetPasswordText || resetPasswordText.length < 6}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
                {resetPasswordError && <p className="text-red-500 text-xs font-bold mt-2">{resetPasswordError}</p>}
                {resetPasswordSuccess && <p className="text-green-600 text-xs font-bold mt-2 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Password reset successfully!</p>}
              </div>
            )}

            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 bg-white">
              <button type="button" onClick={handleCloseModal}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >Cancel</button>
              <button type="submit" form="auth-form" disabled={formLoading}
                className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : editingId ? 'Save Changes' : 'Add Authority'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
