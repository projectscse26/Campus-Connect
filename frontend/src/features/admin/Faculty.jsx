import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Users, Plus, Upload, X, Search, FileUp, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

export const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const fileInputRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({ 
    first_name: '', 
    last_name: '',
    college_email: '', 
    phone: '',
    employee_id: '',
    password: 'password123', // Default password 
    designation: 'Assistant Professor',
    department_id: '',
    specialization: ''
  });
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Password Reset state
  const [resetPasswordText, setResetPasswordText] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facRes, deptRes] = await Promise.all([
        axios.get('/api/faculty/'),
        axios.get('/api/departments/')
      ]);
      setFaculty(facRes.data);
      setDepartments(deptRes.data);
      setError(null);
    } catch (err) {
      console.error('Faculty fetch error:', err?.response?.status, err?.response?.data, err?.config?.url, err?.message);
      setError(`Failed to load faculty data: ${err?.response?.status || ''} ${err?.response?.data?.detail || err?.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (fac = null) => {
    if (fac) {
      setEditingId(fac.id);
      setEditingUserId(fac.user_id);
      setFormData({
        first_name: fac.first_name,
        last_name: fac.last_name,
        college_email: fac.college_email,
        phone: fac.phone,
        employee_id: fac.employee_id,
        password: '', // Leave empty for edit
        designation: fac.designation || 'Assistant Professor',
        department_id: fac.department_id,
        specialization: fac.specialization || ''
      });
    } else {
      setEditingId(null);
      setEditingUserId(null);
      setFormData({ 
        first_name: '', 
        last_name: '',
        college_email: '', 
        phone: '',
        employee_id: '',
        password: 'password123',
        designation: 'Assistant Professor',
        department_id: departments.length > 0 ? departments[0].id : '',
        specialization: ''
      });
    }
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const payload = {
        ...formData,
        department_id: parseInt(formData.department_id)
      };

      if (editingId) {
        // If password is empty during edit, don't update it. Wait, the API doesn't accept password in FacultyUpdate schema anyway, so we can just delete it to prevent issues.
        delete payload.password;
        await axios.put(`/api/faculty/${editingId}`, payload);
      } else {
        await axios.post('/api/faculty/', payload);
      }
      
      await fetchData();
      handleCloseModal();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save faculty member');
    } finally {
      setFormLoading(false);
    }
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

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This will also delete their login account.`)) {
      try {
        await axios.delete(`/api/faculty/${id}`);
        await fetchData();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete faculty member');
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/faculty/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchData();
      alert(`Success! ${response.data.success_count} faculty members imported.\n\nErrors (if any):\n${response.data.errors.join('\n')}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to upload CSV');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredFaculty = faculty.filter(f => 
    f.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.last_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDeptCode = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.code : `#${deptId}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Faculty Members</h1>
            <p className="text-sm text-gray-500 font-medium">Onboard and manage teaching staff</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            <FileUp className="w-4 h-4 mr-2" /> Bulk Import CSV
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Onboard Faculty
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {error ? (
            <div className="p-8 text-center text-red-500 font-medium">{error}</div>
          ) : loading ? (
            <div className="p-8 text-center text-gray-500 font-medium">Loading faculty...</div>
          ) : filteredFaculty.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Faculty Found</h3>
              <p className="text-gray-500 text-sm">Get started by onboarding a new faculty member.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Faculty Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Designation</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFaculty.map((fac) => (
                  <tr key={fac.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 text-sm">{fac.first_name} {fac.last_name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Emp ID: {fac.employee_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{fac.college_email}</div>
                      <div className="text-xs text-gray-500">{fac.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {/* Enhanced Designation Badge */}
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border-2 shadow-sm transition-all hover:shadow-md ${
                        fac.designation === 'Professor' 
                          ? 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200' 
                          : fac.designation === 'Associate Professor'
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200'
                          : fac.designation === 'Assistant Professor'
                          ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200'
                          : fac.designation === 'HOD'
                          ? 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200'
                          : fac.designation === 'Dean'
                          ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200'
                          : fac.designation === 'Lecturer'
                          ? 'bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 border-teal-200'
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {/* Icon based on designation */}
                        <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          {fac.designation === 'Professor' || fac.designation === 'HOD' || fac.designation === 'Dean' ? (
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          ) : (
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          )}
                        </svg>
                        {fac.designation}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{getDeptCode(fac.department_id)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(fac)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors mr-2"
                        title="Edit Faculty"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(fac.id, `${fac.first_name} ${fac.last_name}`)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Faculty"
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

      {/* Onboard / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Faculty Member' : 'Onboard Faculty Member'}</h3>
              <button 
                onClick={handleCloseModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form id="onboard-form" onSubmit={handleSubmit} className="space-y-5">
                {formError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                    {formError}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">First Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Last Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">College Email (Login)</label>
                    <input 
                      type="email" 
                      required
                      value={formData.college_email}
                      onChange={(e) => setFormData({...formData, college_email: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Employee ID</label>
                    <input 
                      type="text" 
                      required
                      value={formData.employee_id}
                      onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  {!editingId && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Initial Password</label>
                      <input 
                        type="text" 
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Designation</label>
                    <select 
                      value={formData.designation}
                      onChange={(e) => setFormData({...formData, designation: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                    >
                      <option value="Professor">Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="HOD">HOD</option>
                      <option value="Lecturer">Lecturer</option>
                      <option value="Lab Assistant">Lab Assistant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Department</label>
                    <select 
                      required
                      value={formData.department_id}
                      onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 focus:bg-white transition-all outline-none shadow-sm hover:border-gray-300 cursor-pointer appearance-none bg-no-repeat bg-right pr-10"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.5em 1.5em'
                      }}
                    >
                      {departments.length === 0 && <option value="">No Departments</option>}
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id} className="font-semibold py-2">{dept.code}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Specialization</label>
                  <input 
                    type="text" 
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                    placeholder="e.g. Artificial Intelligence"
                  />
                </div>
              </form>
            </div>

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

            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 shrink-0 bg-white">
              <button 
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="onboard-form"
                disabled={formLoading || departments.length === 0}
                className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : editingId ? 'Save Changes' : 'Onboard Faculty Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
