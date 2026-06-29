import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { GraduationCap, Plus, X, Search, FileUp, Edit2, Trash2, ArrowUpRight, ChevronRight, Folder, Calendar, Building2, ChevronDown } from 'lucide-react';

export const Students = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drill-down UI state
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);
  
  // Custom dropdown state
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDeptDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form state
  const [formData, setFormData] = useState({ 
    first_name: '', 
    last_name: '',
    college_email: '', 
    phone: '',
    register_number: '',
    password: 'password123',
    department_id: '',
    batch: new Date().getFullYear() + '-' + (new Date().getFullYear() + 4),
    current_semester: 1
  });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stuRes, deptRes] = await Promise.all([
        axios.get('/api/students?limit=10000'),
        axios.get('/api/departments')
      ]);
      setStudents(stuRes.data);
      setDepartments(deptRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (stu = null) => {
    if (stu) {
      setEditingId(stu.id);
      setFormData({
        first_name: stu.first_name,
        last_name: stu.last_name,
        college_email: stu.college_email,
        phone: stu.phone,
        register_number: stu.register_number,
        password: '',
        department_id: stu.department_id,
        batch: stu.batch,
        current_semester: stu.current_semester || 1
      });
    } else {
      setEditingId(null);

      // Derive batch and semester from the current drill-down context
      const currentYear = new Date().getFullYear();
      let autoDeptId = selectedDeptId || (departments.length > 0 ? departments[0].id : '');
      let autoBatch = currentYear + '-' + (currentYear + 4);
      let autoSemester = 1;

      if (selectedYear) {
        // Batch start year = current year minus (selectedYear - 1)
        const batchStart = currentYear - (selectedYear - 1);
        autoBatch = batchStart + '-' + (batchStart + 4);
        // Semester: year 1 → sem 1, year 2 → sem 3, year 3 → sem 5, year 4 → sem 7
        autoSemester = (selectedYear - 1) * 2 + 1;
      }

      setFormData({ 
        first_name: '', 
        last_name: '',
        college_email: '', 
        phone: '',
        register_number: '',
        password: 'password123',
        department_id: autoDeptId,
        batch: autoBatch,
        current_semester: autoSemester
      });
    }
    setFormError(null);
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

    try {
      const payload = {
        ...formData,
        department_id: parseInt(formData.department_id),
        current_semester: parseInt(formData.current_semester)
      };

      if (editingId) {
        delete payload.password;
        await axios.put(`/api/students/${editingId}`, payload);
      } else {
        await axios.post('/api/students', payload);
      }
      
      await fetchData();
      handleCloseModal();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save student member');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This will also delete their login account.`)) {
      try {
        await axios.delete(`/api/students/${id}`);
        await fetchData();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete student');
      }
    }
  };

  const handlePromoteStudents = async () => {
    setIsPromoting(true);
    try {
      const response = await axios.post('/api/students/promote');
      alert(`Success! ${response.data.message}`);
      await fetchData();
      setIsPromoteModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to promote students');
    } finally {
      setIsPromoting(false);
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
      const response = await axios.post('/api/students/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchData();
      alert(`Success! ${response.data.success_count} students imported.\n\nErrors (if any):\n${response.data.errors.join('\n')}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to upload CSV');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredStudents = students.filter(s => {
    const matchSearch = s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.register_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = selectedDeptId ? s.department_id === selectedDeptId : true;
    const matchYear = selectedYear ? s.current_year === selectedYear : true;
    return matchSearch && matchDept && matchYear;
  });

  const getDeptCode = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.code : `#${deptId}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
            <p className="text-sm text-gray-500 font-medium">Manage student enrollments</p>
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
            onClick={() => setIsPromoteModalOpen(true)}
            className="flex items-center px-4 py-2.5 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-200 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Promote Students
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Onboard Student
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden min-h-[500px]">
        {/* Toolbar & Breadcrumbs */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2 text-sm font-medium">
            <button 
              onClick={() => { setSelectedDeptId(null); setSelectedYear(null); }}
              className={`hover:text-primary-600 transition-colors ${!selectedDeptId ? 'text-gray-900 font-bold' : 'text-gray-500'}`}
            >
              All Departments
            </button>
            {selectedDeptId && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button 
                  onClick={() => setSelectedYear(null)}
                  className={`hover:text-primary-600 transition-colors ${!selectedYear ? 'text-gray-900 font-bold' : 'text-gray-500'}`}
                >
                  {getDeptCode(selectedDeptId)}
                </button>
              </>
            )}
            {selectedYear && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 font-bold">Year {selectedYear}</span>
              </>
            )}
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or register number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none"
            />
          </div>
        </div>

        {/* Content View */}
        <div className="overflow-x-auto">
          {error ? (
            <div className="p-8 text-center text-red-500 font-medium">{error}</div>
          ) : loading ? (
            <div className="p-8 text-center text-gray-500 font-medium">Loading data...</div>
          ) : !selectedDeptId ? (
            // Department Cards View
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {departments.map(dept => {
                const deptStudents = students.filter(s => s.department_id === dept.id).length;
                return (
                  <div 
                    key={dept.id}
                    onClick={() => setSelectedDeptId(dept.id)}
                    className="group bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-primary-100 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-full">
                        {dept.code}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{dept.name}</h3>
                    <p className="text-sm font-medium text-gray-500 flex items-center">
                      <Folder className="w-4 h-4 mr-1.5" />
                      {deptStudents} Students Enrolled
                    </p>
                  </div>
                );
              })}
            </div>
          ) : selectedDeptId && !selectedYear ? (
            // Year Cards View
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
              {[1, 2, 3, 4].map(year => {
                const yearStudents = students.filter(s => s.department_id === selectedDeptId && s.current_year === year).length;
                return (
                  <div 
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className="group bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-primary-100 cursor-pointer transition-all duration-200"
                  >
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Year {year}</h3>
                    <p className="text-sm font-medium text-gray-500 flex items-center">
                      <GraduationCap className="w-4 h-4 mr-1.5" />
                      {yearStudents} Students
                    </p>
                  </div>
                );
              })}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Students Found</h3>
              <p className="text-gray-500 text-sm">Get started by onboarding a new student.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department & Batch</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 text-sm">{stu.first_name} {stu.last_name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Reg No: {stu.register_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{stu.college_email}</div>
                      <div className="text-xs text-gray-500">{stu.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{getDeptCode(stu.department_id)}</div>
                      <div className="text-xs text-gray-500">{stu.batch}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-bold text-xs rounded-lg border border-gray-200">
                        Semester {stu.current_semester}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(stu)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors mr-2"
                        title="Edit Student"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(stu.id, `${stu.first_name} ${stu.last_name}`)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Student"
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
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Student' : 'Onboard Student'}</h3>
              <button 
                onClick={handleCloseModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form id="onboard-form" onSubmit={handleSubmit} className="space-y-5 pb-32">
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
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Register Number</label>
                    <input 
                      type="text" 
                      required
                      value={formData.register_number}
                      onChange={(e) => setFormData({...formData, register_number: e.target.value})}
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
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Department</label>
                    <div 
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 focus-within:bg-white transition-all cursor-pointer flex justify-between items-center text-gray-900"
                      onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                    >
                      <span className="truncate pr-2">
                        {formData.department_id 
                          ? departments.find(d => d.id == formData.department_id)?.code 
                          : 'All Depts'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDeptDropdown ? 'rotate-180' : ''}`} />
                    </div>
                    
                    {showDeptDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] max-h-60 overflow-y-auto py-2">
                        {departments.length === 0 ? (
                          <div className="px-5 py-3 text-sm text-gray-500">No Depts Available</div>
                        ) : (
                          departments.map(dept => (
                            <div 
                              key={dept.id}
                              className={`px-5 py-3 text-sm cursor-pointer transition-colors ${formData.department_id == dept.id ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                              onClick={() => {
                                setFormData({...formData, department_id: dept.id});
                                setShowDeptDropdown(false);
                              }}
                            >
                              {dept.code}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Batch (e.g. 2024-2028)</label>
                    <input 
                      type="text" 
                      required
                      value={formData.batch}
                      onChange={(e) => setFormData({...formData, batch: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Semester</label>
                    <input 
                      type="number" 
                      required
                      min="1" max="8"
                      value={formData.current_semester}
                      onChange={(e) => setFormData({...formData, current_semester: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                </div>
              </form>
            </div>

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
                {formLoading ? 'Saving...' : editingId ? 'Save Changes' : 'Onboard Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote Students Confirmation Modal */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                <ArrowUpRight className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Promote All Active Students?</h2>
              <p className="text-gray-600 text-sm mb-6">
                Are you sure you want to promote all active students to the next semester? 
                Students currently in their 8th semester will be graduated and moved to the Alumni database. 
                This action cannot be easily undone.
              </p>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsPromoteModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handlePromoteStudents}
                  disabled={isPromoting}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {isPromoting ? 'Promoting...' : 'Confirm Promotion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
