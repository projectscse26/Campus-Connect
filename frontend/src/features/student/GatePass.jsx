import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Clock, Loader, CheckCircle2, QrCode, ShieldCheck, User, Calendar, X, Trash2 } from 'lucide-react';
import { GatePassTracker } from '../gatepass/GatePassTracker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import dayjs from 'dayjs';
import { TextField } from '@mui/material';

export const GatePass = () => {
  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEPass, setSelectedEPass] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    reason: '',
    out_time: null,
    expected_in_time: null
  });

  useEffect(() => {
    fetchGatePasses();
  }, []);

  const fetchGatePasses = async () => {
    try {
      const res = await axios.get('/api/gatepass/me');
      setGatePasses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.out_time || !formData.expected_in_time) {
      alert('Please select both departure and return times.');
      return;
    }

    try {
      const payload = {
        reason: formData.reason,
        out_time: formData.out_time.toISOString(),
        expected_in_time: formData.expected_in_time.toISOString()
      };
      await axios.post('/api/gatepass/request', payload);
      setShowModal(false);
      setFormData({
        reason: '',
        out_time: null,
        expected_in_time: null
      });
      fetchGatePasses();
    } catch (err) {
      console.error(err);
      alert('Failed to request gate pass');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await axios.delete(`/api/gatepass/${deletingId}`);
      setDeletingId(null);
      fetchGatePasses();
    } catch (err) {
      console.error(err);
      alert('Failed to delete gate pass');
    }
  };

  const formatDateTime = (dtStr) => {
    if (!dtStr) return '-';
    const d = new Date(dtStr);
    return d.toLocaleString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isExpired = (gp) => {
    if (!gp.expected_in_time) return false;
    const inTime = new Date(gp.expected_in_time).getTime();
    const now = Date.now();
    return now > inTime;
  };

  const livePass = gatePasses.find(gp => !isExpired(gp) && gp.status !== 'approved' && gp.status !== 'rejected');

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gate Pass Portal</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Track and request permissions to leave campus.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-lg flex justify-center items-center gap-2 hover:bg-blue-700 transition shadow-sm font-medium"
        >
          <Plus className="w-5 h-5" />
          Raise New Request
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : (
        <>
          {/* Live Tracking Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <h2 className="font-bold text-gray-900 text-lg">Live Tracking</h2>
            </div>
            <div className="p-6">
              {livePass ? (
                <div>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{livePass.reason}</h3>
                    <p className="text-gray-500 text-sm">Requested Departure: {formatDateTime(livePass.out_time)}</p>
                  </div>
                  <GatePassTracker 
                    status={livePass.status} 
                    rejectionReason={livePass.rejection_reason} 
                    approvers={{mentor: livePass.mentor, hod: livePass.hod, om: livePass.om}} 
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 text-lg font-medium">No Live Request</p>
                  <p className="text-gray-400 text-sm mt-1">You don't have any pending gate pass requests.</p>
                </div>
              )}
            </div>
          </div>

          {/* History / All Passes */}
          <div>
            <h2 className="font-bold text-gray-900 text-lg mb-4">Request History</h2>
            {gatePasses.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
                <p className="text-gray-500">No gate passes found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gatePasses.map(gp => {
                  const expired = isExpired(gp);
                  const actualStatus = expired ? 'expired' : gp.status;
                  
                  return (
                    <div key={gp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between relative overflow-hidden transition hover:shadow-md">
                      {expired && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-10 uppercase tracking-wider">Expired</div>}
                      
                      <button 
                        onClick={() => setDeletingId(gp.id)}
                        className={`absolute ${expired ? 'top-5' : 'top-2'} right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition`}
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="pr-8 mb-4">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">{gp.reason}</h3>
                        <div className="text-xs text-gray-500 flex flex-col gap-1">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Out: {formatDateTime(gp.out_time)}</span>
                          {gp.expected_in_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> In: {formatDateTime(gp.expected_in_time)}</span>}
                        </div>
                      </div>
                      
                      <div className="mt-auto flex justify-between items-end border-t border-gray-100 pt-3">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          actualStatus === 'approved' ? 'bg-green-100 text-green-700' :
                          actualStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                          actualStatus === 'expired' ? 'bg-gray-100 text-gray-500' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {actualStatus.replace('_', ' ')}
                        </span>
                        
                        {/* Attached E-Pass Button */}
                        {actualStatus === 'approved' && (
                          <button 
                            onClick={() => setSelectedEPass(gp)}
                            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition font-medium text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            E-Pass
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* E-Gate Pass Modal */}
      {selectedEPass && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-green-600 p-6 text-center text-white relative">
              <button 
                onClick={() => setSelectedEPass(null)}
                className="absolute top-4 right-4 text-green-100 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-green-100" />
              <h2 className="text-2xl font-bold tracking-tight">E-GATE PASS</h2>
              <p className="text-green-100 text-sm font-medium mt-1">CampusConnect Authorized</p>
            </div>
            
            {/* Body */}
            <div className="p-4 sm:p-6">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-green-50 rounded-full flex items-center justify-center relative shadow-inner">
                  {/* Subtle pulsing background ring for GPay effect */}
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                  <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 relative z-10 animate-bounce" />
                </div>
              </div>
              
              <div className="text-center mb-6">
                <span className="inline-block px-4 py-1.5 bg-green-100 text-green-800 font-bold rounded-full text-xs sm:text-sm uppercase tracking-wider mb-2">
                  Approval Successful
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-2">{selectedEPass.reason}</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gray-900 text-white p-4 rounded-xl shadow-inner border border-gray-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-green-400 shrink-0 border border-gray-700">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Valid Date & Time</p>
                      <p className="text-lg sm:text-xl font-black text-green-400 tracking-tight leading-tight">
                        {new Date(selectedEPass.out_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                        {new Date(selectedEPass.out_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Approvers */}
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-3 text-center tracking-wider">Authorized Signatories</p>
                <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center divide-x divide-gray-200">
                  <div className="px-1 flex flex-col items-center">
                    <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase mb-1.5">Mentor</p>
                    <div className="inline-flex items-center justify-center bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold tracking-wide"><CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5"/> APPROVED</div>
                  </div>
                  <div className="px-1 flex flex-col items-center">
                    <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase mb-1.5">HOD</p>
                    <div className="inline-flex items-center justify-center bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold tracking-wide"><CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5"/> APPROVED</div>
                  </div>
                  <div className="px-1 flex flex-col items-center">
                    <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase mb-1.5">OM</p>
                    <div className="inline-flex items-center justify-center bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold tracking-wide"><CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5"/> APPROVED</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Request</h2>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete this gate pass request? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Request Gate Pass</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leaving</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  placeholder="Explain why you need to leave campus"
                />
              </div>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time (Today)</label>
                    <MobileTimePicker
                      value={formData.out_time}
                      onChange={(newValue) => setFormData({...formData, out_time: newValue})}
                      views={['hours', 'minutes']}
                      ampm={true}
                      format="hh:mm A"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          size: 'small',
                          placeholder: "Select Time",
                          sx: {
                            backgroundColor: 'white',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '0.5rem',
                              height: '42px',
                              '& fieldset': { borderColor: '#e5e7eb' },
                              '&:hover fieldset': { borderColor: '#d1d5db' },
                              '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '2px' }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return (Today)</label>
                    <MobileTimePicker
                      value={formData.expected_in_time}
                      onChange={(newValue) => setFormData({...formData, expected_in_time: newValue})}
                      views={['hours', 'minutes']}
                      ampm={true}
                      format="hh:mm A"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          size: 'small',
                          placeholder: "Select Time",
                          sx: {
                            backgroundColor: 'white',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '0.5rem',
                              height: '42px',
                              '& fieldset': { borderColor: '#e5e7eb' },
                              '&:hover fieldset': { borderColor: '#d1d5db' },
                              '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '2px' }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </LocalizationProvider>
              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
