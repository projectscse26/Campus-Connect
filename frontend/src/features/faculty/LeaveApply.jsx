import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User as UserIcon, Calendar, Users, Paperclip, UploadCloud, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LeaveApply = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [balance, setBalance] = useState({
    casual_leaves_total: 15, casual_leaves_used: 0,
    sick_leaves_total: 10, sick_leaves_used: 0,
    earned_leaves_total: 30, earned_leaves_used: 0
  });
  const [facultyProfile, setFacultyProfile] = useState(null);
  const [allFaculty, setAllFaculty] = useState([]);
  
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

  const fetchData = async () => {
    try {
      const [balRes, facRes, allFacRes] = await Promise.all([
        axios.get('/api/leave/balances'),
        axios.get(`/api/faculty/${user.id}`), // Assuming this endpoint exists, or we can use another one
        axios.get('/api/hod/faculty') // Just fetching all faculty to use in dropdown
      ]);
      setBalance(balRes.data);
      setFacultyProfile(facRes.data);
      setAllFaculty(allFacRes.data);
    } catch (err) {
      console.error(err);
      // Fallback if APIs fail just for UI demo purposes
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    
    try {
      const payload = {
        ...formData,
        arrangements: arrangements.filter(a => a.substitute_faculty_id !== '')
      };
      await axios.post('/api/leave/request', payload);
      navigate('/faculty/leave');
    } catch (err) {
      console.error(err);
      setError('Failed to submit leave request.');
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
        <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">Apply for Leave</h1>
        <p className="text-sm text-gray-500 mt-1">Submit a new leave request and arrange for class substitutions.</p>
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
                <p className="text-sm font-semibold text-gray-900">{user.name || 'Current User'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Department</p>
                <p className="text-sm font-semibold text-gray-900">Computer Science & Engineering</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Designation</p>
                <p className="text-sm font-semibold text-gray-900">Professor</p>
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
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none"
                    required
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Earned Leave">Earned Leave</option>
                    <option value="On Duty Permission">On Duty Permission</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">From Date</label>
                    <input 
                      type="date" 
                      name="from_date"
                      value={formData.from_date}
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
              <div className="p-6">
                <div className="hidden md:grid grid-cols-12 gap-4 mb-2 px-2">
                  <div className="col-span-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Alt. Faculty</div>
                  <div className="col-span-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subject</div>
                  <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Class/Sec</div>
                  <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Period</div>
                  <div className="col-span-1"></div>
                </div>
                
                <div className="space-y-3">
                  {arrangements.map((arr, idx) => (
                    <div key={idx} className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-center bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-lg md:rounded-none">
                      <div className="col-span-4 w-full">
                        <select 
                          value={arr.substitute_faculty_id}
                          onChange={(e) => handleArrangementChange(idx, 'substitute_faculty_id', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-500"
                        >
                          <option value="">Select Faculty...</option>
                          {allFaculty.map(f => (
                            <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>
                          ))}
                          {/* Fallbacks if empty */}
                          {allFaculty.length === 0 && <option value="2">Dr. Alan Turing</option>}
                        </select>
                      </div>
                      <div className="col-span-3 w-full">
                        <input 
                          type="text" placeholder="e.g. CS-402"
                          value={arr.subject} onChange={(e) => handleArrangementChange(idx, 'subject', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-500"
                        />
                      </div>
                      <div className="col-span-2 w-full">
                        <input 
                          type="text" placeholder="B.Tech 4A"
                          value={arr.class_section} onChange={(e) => handleArrangementChange(idx, 'class_section', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-500"
                        />
                      </div>
                      <div className="col-span-2 w-full">
                        <input 
                          type="text" placeholder="II (10:30)"
                          value={arr.period} onChange={(e) => handleArrangementChange(idx, 'period', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-500"
                        />
                      </div>
                      <div className="col-span-1 w-full md:w-auto flex justify-end">
                        <button type="button" onClick={() => removeArrangementRow(idx)} className="text-red-400 hover:text-red-600 p-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
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
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
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
                <span className="text-blue-100">Casual Leaves</span>
                <span className="text-lg font-bold">{balance.casual_leaves_total - balance.casual_leaves_used}/{balance.casual_leaves_total}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-blue-100">Sick Leaves</span>
                <span className="text-lg font-bold">{balance.sick_leaves_total - balance.sick_leaves_used}/{balance.sick_leaves_total}</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-blue-100">Earned Leaves</span>
                <span className="text-lg font-bold">{balance.earned_leaves_total - balance.earned_leaves_used}/{balance.earned_leaves_total}</span>
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
                <div className="mt-0.5 mr-3 w-4 h-4 rounded-full border border-blue-200 text-blue-500 flex items-center justify-center text-[10px] flex-shrink-0">i</div>
                <p>Ensure substitution is confirmed by the alternate faculty members.</p>
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
