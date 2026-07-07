import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, Search, Plus, X, User, Calendar, 
  Trash2, Edit2, Lock, ChevronRight, ChevronLeft, Building2, Layers, CheckCircle2, ChevronDown
} from 'lucide-react';
import { DisciplineAnalytics } from './DisciplineAnalytics';

// Custom Dropdown Component
const CustomSelect = ({ label, options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value == value);
  return (
    <div className="relative">
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium hover:bg-white hover:border-red-300 transition-all cursor-pointer flex justify-between items-center group"
      >
        <span className={selectedOption ? "text-gray-900 font-bold" : "text-gray-500 truncate pr-2"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-red-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 py-1">
            <div 
              className={`px-4 py-2.5 cursor-pointer text-sm font-medium transition-colors ${!value ? 'bg-red-50 text-red-700' : 'hover:bg-gray-50 text-gray-600'}`}
              onClick={() => { onChange(''); setIsOpen(false); }}
            >
              {placeholder}
            </div>
            {options.map(opt => (
              <div 
                key={opt.value}
                className={`px-4 py-2.5 cursor-pointer text-sm font-medium transition-colors ${value == opt.value ? 'bg-red-50 text-red-700' : 'hover:bg-gray-50 text-gray-700'}`}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const DisciplineManagement = ({ role }) => {
  const [records, setRecords] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [editingId, setEditingId] = useState(null);
  
  // Drill-down state
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const [formData, setFormData] = useState({
    student_id: '',
    incident_type: '',
    action_status: 'Pending',
    incident_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Student Search for Modal
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const INCIDENT_TYPES = [
    { label: "No Shoe", value: "No Shoe", icon: '👟', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100', active: 'bg-indigo-600 text-white border-indigo-700' },
    { label: "No ID Card", value: "No ID Card", icon: '🪪', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', active: 'bg-emerald-600 text-white border-emerald-700' },
    { label: "Hair/Beard", value: "Improper Haircut / Beard", icon: '✂️', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100', active: 'bg-rose-600 text-white border-rose-700' },
    { label: "Dress Code", value: "Improper Dress Code", icon: '👕', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', active: 'bg-amber-500 text-white border-amber-600' },
    { label: "Other", value: "Other Disruptive Behavior", icon: '📝', color: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100', active: 'bg-gray-700 text-white border-gray-800' }
  ];

  const ACTION_STATUSES = [
    { label: "Informed", value: "Informed", color: 'bg-blue-50 text-blue-700 border-blue-200', active: 'bg-blue-600 text-white border-blue-700' },
    { label: "Not Informed", value: "Not Informed", color: 'bg-yellow-50 text-yellow-700 border-yellow-200', active: 'bg-yellow-500 text-white border-yellow-600' },
    { label: "Letter Given", value: "Letter Given", color: 'bg-red-50 text-red-700 border-red-200', active: 'bg-red-600 text-white border-red-700' },
  ];

  const STATUS_COLORS = {
    "Informed": "bg-blue-100 text-blue-800",
    "Not Informed": "bg-yellow-100 text-yellow-800",
    "Letter Given": "bg-red-100 text-red-800"
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, analyticsRes, studentsRes, deptsRes] = await Promise.all([
        axios.get('/api/discipline/'),
        axios.get('/api/discipline/analytics'),
        axios.get('/api/students/?limit=1000'),
        axios.get('/api/departments/')
      ]);
      
      setRecords(recordsRes.data);
      setAnalytics(analyticsRes.data);
      setStudents(studentsRes.data);
      setDepartments(deptsRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load discipline data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      setFormData({
        student_id: record.student_id,
        incident_type: record.incident_type,
        action_status: record.action_status || 'Pending',
        incident_date: record.incident_date,
        remarks: record.remarks,
      });
      const s = students.find(st => st.id === record.student_id);
      setStudentSearch(s ? `${s.register_number} - ${s.first_name} ${s.last_name}` : '');
      setModalStep(2); // Jump straight to details if editing
    } else {
      setEditingId(null);
      setFormData({
        student_id: '',
        incident_type: '',
        action_status: 'Not Informed',
        incident_date: new Date().toISOString().split('T')[0],
        remarks: '',
      });
      setStudentSearch('');
      setSelectedDept('');
      setSelectedYear('');
      setSelectedSection('');
      setModalStep(1);
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleIncidentTypeClick = (val) => {
    let autoStatus = formData.action_status;
    // Smart Defaults logic
    if (val === 'Mobile Phone Usage' || val === 'Dress Code Violation') {
      autoStatus = 'Warning Letter Given';
    } else if (val === 'Misbehavior') {
      autoStatus = 'Informed to Parents';
    }
    
    setFormData({...formData, incident_type: val, action_status: autoStatus});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id) {
      setFormError('Please select a student');
      setModalStep(1);
      return;
    }
    if (!formData.incident_type) {
      setFormError('Please select an incident type');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    try {
      if (editingId && role === 'admin') {
        await axios.put(`/api/discipline/${editingId}`, formData);
      } else {
        await axios.post('/api/discipline/', formData);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to submit record');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (role !== 'admin') return;
    if (window.confirm('Are you sure you want to delete this discipline record? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/discipline/${id}`);
        await fetchData();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete record');
      }
    }
  };

  const filteredRecords = records.filter(r => 
    r.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.student_register_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.incident_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchFilteredStudents = students.filter(s => 
    s.register_number.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.first_name.toLowerCase().includes(studentSearch.toLowerCase())
  ).slice(0, 5);

  const availableYears = [...new Set(students.map(s => s.current_year))].filter(Boolean).sort();
  const availableSections = [...new Set(students.map(s => s.section?.name))].filter(Boolean).sort();

  const drillDownStudents = students.filter(s => 
    (!selectedDept || s.department_id === parseInt(selectedDept)) &&
    (!selectedYear || s.current_year === parseInt(selectedYear)) &&
    (!selectedSection || s.section?.name === selectedSection)
  );

  const canEdit = role === 'admin';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Discipline Management</h1>
            <p className="text-sm text-gray-500 font-medium">Record and monitor student conduct</p>
          </div>
        </div>
        
        {!loading && !error && role !== 'student' && (
          <button 
            onClick={() => handleOpenModal()} 
            className="flex items-center px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Report Incident
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center bg-white rounded-[24px] text-gray-500 font-bold shadow-sm border border-gray-100">Loading...</div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-[24px] text-red-500 font-bold shadow-sm border border-red-100">{error}</div>
      ) : (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Analytics Dashboard */}
          {role !== 'student' && role !== 'faculty' && analytics && (
            <DisciplineAnalytics data={analytics} />
          )}

          {/* Records Table */}
          <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-gray-900 text-lg">Recent Incidents</h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search records..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Incident</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reported By</th>
                    {canEdit && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="px-6 py-8 text-center text-gray-500 font-medium">No discipline records found</td>
                    </tr>
                  ) : (
                    filteredRecords.map(record => (
                      <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                              {record.student_name?.[0]}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{record.student_name}</div>
                              <div className="text-xs text-gray-500">{record.student_register_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                            {record.incident_type}
                          </span>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1 max-w-[200px]" title={record.remarks}>{record.remarks}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border ${
                            record.action_status === 'Pending' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                            record.action_status === 'Warning Letter Given' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            record.action_status === 'Suspended' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {record.action_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{new Date(record.incident_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">{record.reporter_name}</div>
                          <div className="text-xs text-gray-500 capitalize">{record.reporter_role}</div>
                        </td>
                        {canEdit && (
                          <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={() => handleOpenModal(record)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(record.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2-Step Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${modalStep === 1 ? 'bg-red-600 text-white' : 'bg-green-100 text-green-600'}`}>
                  {modalStep > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
                </div>
                <div className="w-8 h-0.5 bg-gray-200 rounded-full"></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${modalStep === 2 ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  2
                </div>
                <h3 className="ml-4 text-lg font-bold text-gray-900">
                  {modalStep === 1 ? 'Select Student' : 'Incident Details'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {formError && <div className="mb-5 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">{formError}</div>}
              
              {/* STEP 1: Student Selection */}
              {modalStep === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  {/* Smart Search */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Fast Search</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Type register number or name..."
                        value={studentSearch}
                        onChange={(e) => {
                          setStudentSearch(e.target.value);
                          setShowStudentDropdown(true);
                        }}
                        onFocus={() => setShowStudentDropdown(true)}
                        className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all outline-none"
                      />
                      {showStudentDropdown && studentSearch && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {searchFilteredStudents.length > 0 ? searchFilteredStudents.map(s => (
                            <div 
                              key={s.id} 
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
                              onClick={() => {
                                setFormData({...formData, student_id: s.id});
                                setStudentSearch(`${s.register_number} - ${s.first_name} ${s.last_name}`);
                                setShowStudentDropdown(false);
                                setModalStep(2); // Auto advance
                              }}
                            >
                              <div>
                                <div className="font-bold text-gray-900 text-sm">{s.first_name} {s.last_name}</div>
                                <div className="text-xs text-gray-500">{s.register_number}</div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300" />
                            </div>
                          )) : (
                            <div className="px-4 py-3 text-sm text-gray-500">No students found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-white text-xs font-bold text-gray-400 uppercase tracking-widest">Or Drill Down</span>
                    </div>
                  </div>

                  {/* Visual Drill Down */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-20">
                    <CustomSelect 
                      label="1. Department"
                      placeholder="All Depts"
                      value={selectedDept}
                      onChange={setSelectedDept}
                      options={departments.map(d => ({ label: d.code || d.name, value: d.id }))}
                    />
                    
                    <CustomSelect 
                      label="2. Year"
                      placeholder="All Years"
                      value={selectedYear}
                      onChange={setSelectedYear}
                      options={availableYears.map(y => ({ label: `Year ${y}`, value: y }))}
                    />
                    
                    <CustomSelect 
                      label="3. Section"
                      placeholder="All Sections"
                      value={selectedSection}
                      onChange={setSelectedSection}
                      options={availableSections.map(s => ({ label: `Section ${s}`, value: s }))}
                    />
                  </div>

                  <div className="mt-4 border border-gray-100 rounded-xl max-h-48 overflow-y-auto bg-gray-50/30">
                    {drillDownStudents.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
                        {drillDownStudents.map(s => (
                          <div 
                            key={s.id}
                            onClick={() => {
                              setFormData({...formData, student_id: s.id});
                              setStudentSearch(`${s.register_number} - ${s.first_name} ${s.last_name}`);
                              setModalStep(2);
                            }}
                            className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-sm cursor-pointer transition-all"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {s.first_name[0]}
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-sm font-bold text-gray-900 truncate">{s.first_name} {s.last_name}</div>
                              <div className="text-xs text-gray-500">{s.register_number}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (selectedDept || selectedYear || selectedSection) ? (
                      <div className="p-6 text-center text-sm text-gray-500">No students found matching these filters.</div>
                    ) : (
                      <div className="p-6 text-center text-sm text-gray-500">Select filters to view students</div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: Incident Details */}
              {modalStep === 2 && (
                <form id="incidentForm" onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  
                  {/* Selected Student Card */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                     <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                       {studentSearch.charAt(studentSearch.indexOf('-') + 2)}
                     </div>
                     <div>
                       <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Student Selected</p>
                       <p className="text-sm font-bold text-gray-900">{studentSearch}</p>
                     </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">What happened?</label>
                    <div className="flex flex-wrap gap-3">
                      {INCIDENT_TYPES.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleIncidentTypeClick(type.value)}
                          className={`flex items-center px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                            formData.incident_type === type.value ? type.active : type.color
                          }`}
                        >
                          <span className="mr-2 text-lg leading-none">{type.icon}</span> {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Action Status</label>
                    <div className="flex flex-wrap gap-3">
                      {ACTION_STATUSES.map(status => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => setFormData({...formData, action_status: status.value})}
                          className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                            formData.action_status === status.value ? status.active : status.color
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Date of Incident</label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input 
                          type="date" 
                          required
                          value={formData.incident_date}
                          onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Remarks / Details <span className="text-gray-400 lowercase normal-case font-normal">(Optional)</span></label>
                    <textarea 
                      rows="3"
                      placeholder="Provide detailed information about the incident..."
                      value={formData.remarks}
                      onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all outline-none resize-none"
                    ></textarea>
                  </div>
                  
                  {/* Status Note */}
                  <div className="flex items-start p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 text-xs">
                    <ShieldAlert className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Note:</strong> Upon submission, this record will be securely locked to ensure data integrity. 
                      {role !== 'admin' && " Only administrators can edit or delete locked records."}
                    </p>
                  </div>
                </form>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-between bg-gray-50/50 flex-shrink-0">
              {modalStep === 2 ? (
                <button 
                  type="button" 
                  onClick={() => setModalStep(1)} 
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </button>
              ) : (
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors">
                  Cancel
                </button>
              )}
              
              {modalStep === 2 && (
                <button 
                  type="submit" 
                  form="incidentForm"
                  disabled={formLoading} 
                  className="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center"
                >
                  {formLoading ? 'Submitting...' : (editingId ? 'Save Changes' : 'Submit Report')}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
