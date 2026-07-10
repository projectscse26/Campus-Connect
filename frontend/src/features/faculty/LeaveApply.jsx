import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User as UserIcon, Calendar, Users, Paperclip, UploadCloud, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LeaveApply = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  const [balance, setBalance] = useState({
    casual_leaves_total: 1, casual_leaves_used: 0,
    earned_leaves_total: 1, earned_leaves_used: 0,
    vacation_leaves_total: 12, vacation_leaves_used: 0,
    compensation_leaves_total: 5, compensation_leaves_used: 0,
    academic_leaves_total: 10, academic_leaves_used: 0,
    restricted_leaves_total: 1, restricted_leaves_used: 0
  });
  const [facultyProfile, setFacultyProfile] = useState(null);
  const [allFaculty, setAllFaculty] = useState([]);
  const [leaveData, setLeaveData] = useState(null); // New: holds schedule + faculty + advisor duties
  
  const [formData, setFormData] = useState({
    leave_type: 'Casual Leave',
    from_date: '',
    to_date: '',
    reason: ''
  });
  
  const [arrangements, setArrangements] = useState([
    { substitute_faculty_id: '', subject: '', class_section: '', period: '' }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.from_date && formData.to_date && !editId) {
      fetchLeaveData();
    }
  }, [formData.from_date, formData.to_date]);

  const fetchData = async () => {
    try {
      const [balRes, facRes] = await Promise.all([
        axios.get('/api/leave/balances'),
        axios.get('/api/auth/profile')
      ]);
      setBalance(balRes.data);
      setFacultyProfile(facRes.data);

      if (editId) {
        const editRes = await axios.get(`/api/leave/requests/${editId}`);
        const requestData = editRes.data;
        setFormData({
          leave_type: requestData.leave_type,
          from_date: requestData.from_date,
          to_date: requestData.to_date,
          reason: requestData.reason
        });
        if (requestData.arrangements && requestData.arrangements.length > 0) {
          setArrangements(requestData.arrangements.map(a => ({
            substitute_faculty_id: a.substitute_faculty_id.toString(),
            subject: a.subject,
            class_section: a.class_section,
            period: a.period
          })));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch leave-specific data when dates are selected
  const fetchLeaveData = async () => {
    if (!formData.from_date || !formData.to_date) return;
    
    try {
      const res = await axios.get('/api/leave/leave-preparation-data', {
        params: {
          from_date: formData.from_date,
          to_date: formData.to_date
        }
      });
      setLeaveData(res.data);
      setAllFaculty(res.data.available_faculty || []);
      
      // Auto-populate arrangements based on timetable
      if (res.data.my_schedule && res.data.my_schedule.length > 0) {
        const autoArrangements = res.data.my_schedule.map(slot => ({
          substitute_faculty_id: '',
          subject: slot.course_code,
          class_section: slot.class_section,
          period: slot.period_display,
          day: slot.day
        }));
        
        // Add class advisor duty if exists
        if (res.data.class_advisor_duties && res.data.class_advisor_duties.length > 0) {
          res.data.class_advisor_duties.forEach(duty => {
            autoArrangements.push({
              substitute_faculty_id: '',
              subject: 'Class Advisor',
              class_section: duty.class_display,
              period: 'All Periods',
              day: 'All Days'
            });
          });
        }
        
        setArrangements(autoArrangements);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (updated.from_date && updated.to_date) {
        if (new Date(updated.from_date) > new Date(updated.to_date)) {
          setError('To Date cannot be earlier than From Date.');
        } else {
          setError('');
        }
      }
      return updated;
    });
  };

  const handleArrangementChange = (index, field, value) => {
    const newArr = [...arrangements];
    newArr[index][field] = value;
    setArrangements(newArr);
  };

  const addArrangementRow = () => {
    setArrangements([...arrangements, { substitute_faculty_id: '', subject: '', class_section: '', period: '' }]);
  };

  const removeArrangementRow = (index) => {
    const newArr = [...arrangements];
    newArr.splice(index, 1);
    setArrangements(newArr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    if (formData.from_date && formData.to_date) {
      if (new Date(formData.from_date) > new Date(formData.to_date)) {
        setError('To Date cannot be earlier than From Date.');
        setIsSubmitting(false);
        return;
      }
    }
    
    // Validate that at least one substitute arrangement is provided
    const validArrangements = arrangements.filter(a => a.substitute_faculty_id !== '');
    if (validArrangements.length === 0) {
      setError('At least one substitute faculty arrangement is required. Your leave request will only be forwarded to HOD after all substitutes accept.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const payload = {
        ...formData,
        arrangements: validArrangements
      };
      if (editId) {
        await axios.put(`/api/leave/requests/${editId}`, payload);
      } else {
        await axios.post('/api/leave/request', payload);
      }
      navigate('/faculty/leave');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-6">
        <Link to="/faculty/leave" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Requests
        </Link>
        <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">{editId ? 'Modify Leave Request' : 'Apply for Leave'}</h1>
        <p className="text-sm text-gray-500 mt-1">{editId ? 'Update your pending leave request and class substitutions.' : 'Submit a new leave request and arrange for class substitutions.'}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Form */}
        <div className="flex-1 space-y-6">
          
          {/* Faculty Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center bg-gray-50/50">
              <UserIcon className="w-5 h-5 text-gray-500 mr-2" />
              <h2 className="text-sm font-bold text-gray-800">Faculty Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Faculty Name</p>
                <p className="text-sm font-semibold text-gray-900">
                  {facultyProfile ? `${facultyProfile.first_name} ${facultyProfile.last_name}` : (user.name || 'Current User')}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Department</p>
                <p className="text-sm font-semibold text-gray-900">
                  {facultyProfile?.department_name || 'Computer Science & Engineering'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Designation</p>
                <p className="text-sm font-semibold text-gray-900">
                  {facultyProfile?.designation || 'Professor'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center bg-gray-50/50">
                <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                <h2 className="text-sm font-bold text-gray-800">Leave Details</h2>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Leave Type</label>
                  <select 
                    name="leave_type" 
                    value={formData.leave_type}
                    onChange={handleInputChange}
                    className="w-full px-3 md:px-4 py-1.5 md:py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs md:text-sm font-medium focus:outline-none focus:border-blue-300 transition-all appearance-none text-slate-700"
                    required
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Earned Leave">Earned Leave</option>
                    <option value="Vacation Leave">Vacation Leave</option>
                    <option value="Compensation Leave">Compensation Leave</option>
                    <option value="Academic Leave">Academic Leave</option>
                    <option value="Restricted Leave">Restricted Leave</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">From Date</label>
                     <input 
                      type="date" 
                      name="from_date"
                      value={formData.from_date}
                      max={formData.to_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">To Date</label>
                    <input 
                      type="date" 
                      name="to_date"
                      value={formData.to_date}
                      min={formData.from_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Reason for Leave</label>
                  <textarea 
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="Please provide a brief justification..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Duty Arrangement */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-gray-500 mr-2" />
                  <h2 className="text-sm font-bold text-gray-800">Duty Arrangement</h2>
                </div>
                <button type="button" onClick={addArrangementRow} className="text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors">
                  + Add Row
                </button>
              </div>
              
              {/* Important Notice */}
              <div className="px-6 pt-4 pb-2">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                  <div className="mt-0.5 text-amber-600 flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 text-xs text-amber-800">
                    <p className="font-bold mb-1">Required: Substitute Faculty Approval</p>
                    <p>Your leave request will remain <strong>pending</strong> until <strong>ALL substitute faculty accept</strong> their assigned duties. Only then will it be forwarded to HOD for approval.</p>
                  </div>
                </div>
              </div>
              
              {/* My Teaching Schedule Helper */}
              {leaveData && leaveData.my_schedule && leaveData.my_schedule.length > 0 && (
                <div className="px-6 pt-4 pb-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-bold text-blue-900 mb-2">📚 Your Classes During Leave Period ({leaveData.total_periods_to_cover} periods)</p>
                    <div className="space-y-1.5">
                      {leaveData.my_schedule.map((sched, idx) => (
                        <div key={idx} className="text-xs text-blue-800 bg-white rounded px-2 py-1.5 flex justify-between items-center">
                          <span><strong>{sched.day.toUpperCase()}</strong> - {sched.course_code} ({sched.course_name})</span>
                          <span className="text-blue-600 font-medium">{sched.class_section} • {sched.period_display}</span>
                        </div>
                      ))}
                      {leaveData.class_advisor_duties && leaveData.class_advisor_duties.length > 0 && (
                        leaveData.class_advisor_duties.map((duty, idx) => (
                          <div key={`advisor-${idx}`} className="text-xs text-purple-800 bg-purple-50 rounded px-2 py-1.5 flex justify-between items-center border border-purple-200">
                            <span><strong>Class Advisor</strong> - {duty.class_display}</span>
                            <span className="text-purple-600 font-medium">{duty.batch}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <p className="text-[10px] text-blue-700 mt-2 italic">💡 Assign substitutes below - one row per class/duty</p>
                  </div>
                </div>
              )}
              
              {leaveData && leaveData.total_periods_to_cover === 0 && !leaveData.requires_class_advisor_substitute && (
                <div className="px-6 pt-4 pb-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-sm font-bold text-green-900">✓ No classes scheduled during this period</p>
                    <p className="text-xs text-green-700 mt-1">You may still need to assign substitutes for administrative duties if required</p>
                  </div>
                </div>
              )}
              
              <div className="p-6 pt-4">
                <div className="hidden md:grid grid-cols-12 gap-2 mb-2 px-2">
                  <div className="col-span-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Alt. Faculty</div>
                  <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</div>
                  <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Class/Sec</div>
                  <div className="col-span-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Period</div>
                  <div className="col-span-1"></div>
                </div>
                
                <div className="space-y-3">
                  {arrangements.map((arr, idx) => (
                    <div key={idx} className="flex flex-col md:grid md:grid-cols-12 gap-1.5 md:gap-1.5 items-center bg-gray-50 md:bg-transparent p-2 md:p-1.5 rounded-lg md:rounded-none border md:border-0 border-gray-200">
                      {arr.day && (
                        <div className="col-span-12 md:hidden text-xs font-bold text-gray-600 uppercase">
                          {arr.day} {arr.day !== 'All Days' && `• ${arr.period}`}
                        </div>
                      )}
                      <div className="col-span-4 w-full">
                        <label className="block md:hidden text-xs font-bold text-gray-500 uppercase mb-0.5">Substitute Faculty</label>
                        <select 
                          value={arr.substitute_faculty_id}
                          onChange={(e) => handleArrangementChange(idx, 'substitute_faculty_id', e.target.value)}
                          className="w-full px-2 md:px-2 py-1.5 md:py-1.5 bg-blue-50 border border-blue-200 rounded text-sm md:text-sm focus:outline-none focus:border-blue-300 font-medium text-slate-700 transition-all"
                          style={{ maxHeight: '200px' }}
                          required
                        >
                          <option value="">Select Faculty...</option>
                          {allFaculty.map(f => (
                            <option key={f.id} value={f.id}>{f.name} ({f.designation || 'Faculty'})</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2 w-full">
                        <label className="block md:hidden text-xs font-bold text-gray-500 uppercase mb-0.5">Subject</label>
                        <input 
                          type="text" 
                          placeholder="CS-402"
                          value={arr.subject} 
                          onChange={(e) => handleArrangementChange(idx, 'subject', e.target.value)}
                          className="w-full px-1.5 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-500 font-medium"
                          readOnly={arr.subject === 'Class Advisor'}
                          required
                        />
                      </div>
                      <div className="col-span-2 w-full">
                        <label className="block md:hidden text-xs font-bold text-gray-500 uppercase mb-0.5">Class/Sec</label>
                        <input 
                          type="text" 
                          placeholder="CSE-4A"
                          value={arr.class_section} 
                          onChange={(e) => handleArrangementChange(idx, 'class_section', e.target.value)}
                          className="w-full px-1.5 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-500 font-medium"
                          required
                        />
                      </div>
                      <div className="col-span-3 w-full">
                        <label className="block md:hidden text-xs font-bold text-gray-500 uppercase mb-0.5">Period</label>
                        <input 
                          type="text" 
                          placeholder="08:45 - 09:30"
                          value={arr.period} 
                          onChange={(e) => handleArrangementChange(idx, 'period', e.target.value)}
                          className="w-full px-1.5 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-500 font-medium"
                          required
                        />
                      </div>
                      <div className="col-span-1 w-full md:w-auto flex justify-end">
                        <button type="button" onClick={() => removeArrangementRow(idx)} className="text-red-400 hover:text-red-600 p-1.5">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {arrangements.length === 0 && (
                    <div className="text-center py-6 text-gray-500 text-sm italic">
                      Select leave dates to see your schedule and add substitute arrangements
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center bg-gray-50/50">
                <Paperclip className="w-5 h-5 text-gray-500 mr-2" />
                <h2 className="text-sm font-bold text-gray-800">Attachments</h2>
              </div>
              <div className="p-6">
                <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 p-8 flex flex-col items-center justify-center text-center hover:bg-gray-100 transition-colors cursor-pointer">
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-3" />
                  <p className="text-sm font-bold text-gray-700">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPEG, or PNG (Max 5MB)</p>
                  <p className="text-[10px] text-gray-400 italic mt-3">Required for Medical or Duty Leaves exceeding 2 days.</p>
                </div>
              </div>
            </div>

            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

            <div className="flex gap-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : editId ? 'Save Changes' : 'Submit Request'}
              </button>
              <button 
                type="button" 
                className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl text-sm transition-colors shadow-sm"
              >
                Save as Draft
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Balance Summary & Tips */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-[#1e3a5f] rounded-xl shadow-sm overflow-hidden text-white">
            <div className="px-6 py-5 border-b border-white/10">
              <h2 className="text-base font-bold">Balance Summary</h2>
            </div>
            <div className="p-6 space-y-4 text-sm font-medium">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex flex-col">
                  <span className="text-blue-100">Casual Leave</span>
                  <span className="text-[10px] text-blue-200">1 per month</span>
                </div>
                <span className="text-lg font-bold">{(balance.casual_leaves_total || 1) - (balance.casual_leaves_used || 0)}/{balance.casual_leaves_total || 1}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex flex-col">
                  <span className="text-blue-100">Restricted Leave</span>
                  <span className="text-[10px] text-blue-200">1 per sem</span>
                </div>
                <span className="text-lg font-bold">{(balance.restricted_leaves_total || 1) - (balance.restricted_leaves_used || 0)}/{balance.restricted_leaves_total || 1}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex flex-col">
                  <span className="text-blue-100">Earned Leave</span>
                  <span className="text-[10px] text-blue-200">1 per month (accrued)</span>
                </div>
                <span className="text-lg font-bold">{(balance.earned_leaves_total || 1) - (balance.earned_leaves_used || 0)}/{balance.earned_leaves_total || 1}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-blue-100">Vacation Leave</span>
                <span className="text-lg font-bold">{(balance.vacation_leaves_total || 12) - (balance.vacation_leaves_used || 0)}/{balance.vacation_leaves_total || 12}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-blue-100">Compensation Leave</span>
                <span className="text-lg font-bold">{(balance.compensation_leaves_total || 5) - (balance.compensation_leaves_used || 0)}/{balance.compensation_leaves_total || 5}</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-blue-100">Academic Leave</span>
                <span className="text-lg font-bold">{(balance.academic_leaves_total || 10) - (balance.academic_leaves_used || 0)}/{balance.academic_leaves_total || 10}</span>
              </div>
            </div>
            <div className="px-6 py-4 bg-black/10">
              <p className="text-[10px] text-blue-200 italic leading-relaxed">
                Calculated based on the current academic year ending June 2024.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Submission Tips</h2>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="mt-0.5 mr-3 w-4 h-4 rounded-full border border-red-200 text-red-500 flex items-center justify-center text-[10px] flex-shrink-0 font-bold">!</div>
                <p><strong>Important:</strong> Your leave request will only be sent to HOD <strong>after ALL substitute faculty accept</strong> their arrangements.</p>
              </div>
              <div className="flex items-start">
                <div className="mt-0.5 mr-3 w-4 h-4 rounded-full border border-blue-200 text-blue-500 flex items-center justify-center text-[10px] flex-shrink-0">i</div>
                <p>Ensure you inform substitute faculty before submitting the request.</p>
              </div>
              <div className="flex items-start">
                <div className="mt-0.5 mr-3 w-4 h-4 rounded-full border border-blue-200 text-blue-500 flex items-center justify-center text-[10px] flex-shrink-0">i</div>
                <p>Applications for more than 3 days require HOD approval.</p>
              </div>
              <div className="flex items-start">
                <div className="mt-0.5 mr-3 w-4 h-4 rounded-full border border-blue-200 text-blue-500 flex items-center justify-center text-[10px] flex-shrink-0">i</div>
                <p>Check the academic calendar for "No Leave" exam blocks.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
