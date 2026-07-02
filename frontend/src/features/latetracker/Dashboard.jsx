import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, Search, User as UserIcon, Calendar, CheckCircle2, CheckCircle, X, AlertCircle, ChevronRight, ChevronDown, Plus, LogOut, Bell, Info } from 'lucide-react';
import axios from 'axios';

// Custom Dropdown Component
const CustomSelect = ({ label, options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value == value);
  return (
    <div className="relative">
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium hover:bg-white hover:border-primary-300 transition-all cursor-pointer flex justify-between items-center group"
      >
        <span className={selectedOption ? "text-gray-900 font-bold" : "text-gray-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 py-1">
            <div 
              className={`px-4 py-2.5 cursor-pointer text-sm font-medium transition-colors ${!value ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50 text-gray-600'}`}
              onClick={() => { onChange(''); setIsOpen(false); }}
            >
              {placeholder}
            </div>
            {options.map(opt => (
              <div 
                key={opt.value}
                className={`px-4 py-2.5 cursor-pointer text-sm font-medium transition-colors ${value == opt.value ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50 text-gray-700'}`}
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

export const LateTrackerDashboard = () => {
  const { user, logout } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState('Not Informed');
  const [recentRecords, setRecentRecords] = useState([]);
  const [lateNotifications, setLateNotifications] = useState([]);
  
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const actionStatuses = ["Not Informed", "Informed", "Letter Given"];

  React.useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [deptRes, studentsRes, recordsRes, notificationsRes] = await Promise.all([
          axios.get('/api/departments', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/students?limit=1000', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/late?limit=5', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/late/notifications?date_filter=' + new Date().toISOString().split('T')[0], { 
            headers: { Authorization: `Bearer ${token}` } 
          })
        ]);
        setDepartments(deptRes.data);
        setStudents(studentsRes.data);
        setRecentRecords(recordsRes.data);
        setLateNotifications(notificationsRes.data);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      }
    };
    fetchInitialData();
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setModalStep(1);
    setSelectedStudent(null);
    setStudentSearch('');
    setSuccessMessage('');
    setError(null);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setStudentSearch(`${student.register_number} - ${student.first_name} ${student.last_name}`);
    setShowStudentDropdown(false);
    setModalStep(2);
    setSuccessMessage('');
    setError(null);
    setActionStatus('Not Informed');
  };

  const availableYears = [...new Set(students.map(s => s.current_year))].filter(Boolean).sort();
  const availableSections = [...new Set(students.map(s => s.section?.name))].filter(Boolean).sort();

  // Check if student has a late entry notification for today
  const getStudentNotification = (studentId) => {
    return lateNotifications.find(n => n.student_id === studentId);
  };

  const searchFilteredStudents = students.filter(s => 
    studentSearch && (
      s.register_number.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.first_name.toLowerCase().includes(studentSearch.toLowerCase())
    )
  ).slice(0, 5);

  const drillDownStudents = students.filter(s => 
    (!selectedDept || s.department_id === parseInt(selectedDept)) &&
    (!selectedYear || s.current_year === parseInt(selectedYear)) &&
    (!selectedSection || s.section?.name === selectedSection)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage('');

    try {
      const token = localStorage.getItem("token");
      await axios.post('/api/late', {
        student_id: selectedStudent.id,
        action_status: actionStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage(`Late record for ${selectedStudent.first_name} ${selectedStudent.last_name} submitted successfully.`);
      
      // Refresh recent records and notifications
      const [recordsRes, notificationsRes] = await Promise.all([
        axios.get('/api/late?limit=5', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/late/notifications?date_filter=' + new Date().toISOString().split('T')[0], { 
          headers: { Authorization: `Bearer ${token}` } 
        })
      ]);
      setRecentRecords(recordsRes.data);
      setLateNotifications(notificationsRes.data);

      setTimeout(() => {
        setIsModalOpen(false);
        setActionStatus('Not Informed');
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick action to add informed student to late records
  const handleQuickAddToLateRecords = async (notification) => {
    try {
      const token = localStorage.getItem("token");
      
      // Step 1: Add to late records
      await axios.post('/api/late', {
        student_id: notification.student_id,
        action_status: 'Informed',
        reason: notification.reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Step 2: Mark notification as acknowledged by security
      await axios.patch(
        `/api/late/notifications/${notification.id}/acknowledge`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Step 3: Refresh data
      const [recordsRes, notificationsRes] = await Promise.all([
        axios.get('/api/late?limit=5', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/late/notifications?date_filter=' + new Date().toISOString().split('T')[0], { 
          headers: { Authorization: `Bearer ${token}` } 
        })
      ]);
      setRecentRecords(recordsRes.data);
      setLateNotifications(notificationsRes.data);

      alert(`✓ ${notification.student_name} added to late records and marked as arrived`);
    } catch (err) {
      alert('Failed to add to late records: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-primary-600">
            ^ CampusConnect
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-bold text-gray-900">Late Tracker</div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{user?.email}</div>
          </div>
          <button 
            onClick={logout}
            className="p-2 sm:px-4 sm:py-2 text-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors flex items-center space-x-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Late Tracker Portal</h1>
            <p className="text-sm text-gray-500 font-medium">Record student tardiness quickly</p>
          </div>
        </div>
        
        <button 
          onClick={handleOpenModal} 
          className="flex items-center justify-center w-full sm:w-auto px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" /> Record Late Student
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-12 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-primary-500" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Ready to Record</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Click the button above or on the top right to open the tracker wizard and log a student's late arrival.
        </p>
        <button 
          onClick={handleOpenModal} 
          className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" /> Start Tracking
        </button>
      </div>

      {/* Today's Late Entry Notifications */}
      {lateNotifications.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-100 bg-white/50 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Pre-Informed Students (Today)</h3>
                <p className="text-sm text-gray-600">Students who submitted late entry notifications</p>
              </div>
            </div>
            <span className="px-3 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg">
              {lateNotifications.length}
            </span>
          </div>
          <div className="p-4 sm:p-6 space-y-3">
            {lateNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className="bg-white rounded-xl p-4 border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Student Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base uppercase flex-shrink-0 shadow-md">
                      {notification.student_name?.[0] || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-gray-900 truncate">
                        {notification.student_name}
                      </div>
                      <div className="text-sm font-semibold text-gray-600">
                        {notification.student_register_number}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {notification.department_name}
                        {notification.section_name && ` • Section ${notification.section_name}`}
                      </div>
                    </div>
                  </div>

                  {/* Mentor & Time Info */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    {/* Mentor Info */}
                    {notification.mentor_name && (
                      <div className="bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                        <div className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-0.5">
                          Mentor Informed
                        </div>
                        <div className="text-sm font-bold text-purple-900">
                          {notification.mentor_name}
                        </div>
                      </div>
                    )}

                    {/* Expected Arrival */}
                    <div className="bg-orange-50 rounded-lg px-3 py-2 border border-orange-100">
                      <div className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-0.5">
                        Expected At
                      </div>
                      <div className="text-sm font-bold text-orange-900 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(`2000-01-01T${notification.expected_arrival_time}`).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center">
                      {notification.acknowledged_by_security ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Arrived
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reason */}
                {notification.reason && (
                  <div className="mt-3 pt-3 border-t border-blue-50">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Reason: </span>
                        <span className="text-sm text-gray-700">{notification.reason}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submitted Time */}
                <div className="mt-2 text-xs text-gray-400">
                  Submitted: {new Date(notification.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>

                {/* Quick Action Button - Add to Late Records */}
                {!notification.acknowledged_by_security && (
                  <div className="mt-4 pt-3 border-t border-blue-100">
                    <button
                      onClick={() => handleQuickAddToLateRecords(notification)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm font-bold rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Add to Late Records (Informed)
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Quick action: Record this student as late with "Informed" status
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {recentRecords.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Recent Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-4 sm:px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">Time</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">Student</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">Action Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-xs text-gray-500">{new Date(record.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 min-w-[200px]">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                          {record.student_name?.[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{record.student_name}</div>
                          <div className="text-xs font-semibold text-gray-500">{record.student_register_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                        record.action_status === 'Letter Given' ? 'bg-red-50 text-red-600 border-red-100' :
                        record.action_status === 'Informed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-gray-50 text-gray-600 border-gray-100'
                      }`}>
                        {record.action_status || 'Not Informed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2-Step Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[24px] sm:shadow-2xl sm:max-w-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold text-xs sm:text-sm ${modalStep === 1 ? 'bg-primary-600 text-white' : 'bg-green-100 text-green-600'}`}>
                  {modalStep > 1 ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : '1'}
                </div>
                <div className="w-4 sm:w-8 h-0.5 bg-gray-200 rounded-full"></div>
                <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold text-xs sm:text-sm ${modalStep === 2 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  2
                </div>
                <h3 className="ml-2 sm:ml-4 text-base sm:text-lg font-bold text-gray-900 truncate max-w-[150px] sm:max-w-none">
                  {modalStep === 1 ? 'Select Student' : 'Late Details'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 sm:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {error && <div className="mb-5 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">{error}</div>}
              {successMessage && <div className="mb-5 p-3 bg-green-50 text-green-700 text-sm font-medium rounded-xl border border-green-100 flex items-center"><CheckCircle2 className="w-5 h-5 mr-2"/>{successMessage}</div>}
              
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
                        className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none"
                      />
                      {showStudentDropdown && studentSearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {searchFilteredStudents.length > 0 ? searchFilteredStudents.map(s => (
                            <div 
                              key={s.id} 
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
                              onClick={() => handleSelectStudent(s)}
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
                            onClick={() => handleSelectStudent(s)}
                            className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm cursor-pointer transition-all"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs flex-shrink-0 uppercase">
                              {s.first_name[0]}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{s.first_name} {s.last_name}</div>
                              <div className="text-xs text-gray-500">{s.register_number}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm font-medium">No students match this drill down</div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: Record Details */}
              {modalStep === 2 && selectedStudent && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-white text-primary-600 flex items-center justify-center font-bold text-sm shadow-sm uppercase">
                      {selectedStudent.first_name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{selectedStudent.first_name} {selectedStudent.last_name}</div>
                      <div className="text-xs font-semibold text-primary-600">{selectedStudent.register_number}</div>
                    </div>
                  </div>

                  <form id="recordForm" onSubmit={handleSubmit}>
                    <div className="mb-8">
                      <label className="block text-sm font-bold text-gray-700 mb-4">Action Status *</label>
                      <div className="flex flex-col gap-3">
                        {actionStatuses.map(status => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setActionStatus(status)}
                            className={`px-6 py-4 rounded-xl text-left font-bold transition-all border-2 ${
                              actionStatus === status 
                              ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm' 
                              : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{status}</span>
                              {actionStatus === status && <CheckCircle2 className="w-5 h-5 text-primary-500" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
            
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-gray-100 bg-gray-50 flex justify-between items-center sm:rounded-b-[24px]">
              <button 
                onClick={() => modalStep === 2 ? setModalStep(1) : setIsModalOpen(false)}
                className="px-4 sm:px-5 py-2 sm:py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors text-sm"
              >
                {modalStep === 2 ? 'Back' : 'Cancel'}
              </button>
              
              {modalStep === 2 && (
                <button
                  type="submit"
                  form="recordForm"
                  disabled={isSubmitting}
                  className="flex items-center px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-sm"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  ) : <Calendar className="w-4 h-4 mr-2" />}
                  {isSubmitting ? 'Recording...' : 'Record Late'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
