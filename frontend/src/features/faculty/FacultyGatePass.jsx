import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Clock, Loader, CheckCircle2, FileText, Calendar, X, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import { useAuth } from '../../context/AuthContext';
import FacultyEPassCard from './FacultyEPassCard';

export default function FacultyGatePass() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEPassReq, setSelectedEPassReq] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const [formData, setFormData] = useState({
    reason: '',
    out_time: null,
    expected_in_time: null
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/faculty-gatepass/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching gate passes:', err);
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
      const token = localStorage.getItem('token');
      const payload = {
        reason: formData.reason,
        out_time: formData.out_time.toISOString(),
        expected_in_time: formData.expected_in_time.toISOString()
      };
      await axios.post('/api/faculty-gatepass/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData({ reason: '', out_time: null, expected_in_time: null });
      setShowModal(false);
      fetchRequests();
      alert('Gate pass request raised successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to raise request. Please check your inputs.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/faculty-gatepass/${deletingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeletingId(null);
      fetchRequests();
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

  const isReqExpired = (req) => {
    if (!req.expected_in_time) return false;
    const inTime = new Date(req.expected_in_time).getTime();
    const now = Date.now();
    return now > inTime;
  };

  const livePass = requests.find(req => !isReqExpired(req) && req.status !== 'approved' && req.status !== 'rejected');

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Gate Pass Portal</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Track and request permissions to leave campus.</p>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-750 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">Live Tracking</h2>
            </div>
            <div className="p-6">
              {livePass ? (
                <div>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{livePass.reason}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Requested Departure: {formatDateTime(livePass.out_time)}</p>
                  </div>
                  
                  {/* Faculty Tracker Visualization */}
                  <div className="relative pt-4 max-w-2xl mx-auto">
                    <div className="absolute top-8 left-6 w-[calc(100%-3rem)] h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
                    <div className="flex justify-between relative z-10">
                      {/* HOD Step */}
                      <div className="flex flex-col items-center bg-white dark:bg-gray-800 px-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${livePass.hod_approved_at ? 'bg-green-500 text-white' : livePass.status === 'rejected' && livePass.status.includes('hod') ? 'bg-red-500 text-white' : livePass.status === 'pending_hod' ? 'bg-orange-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                          {livePass.hod_approved_at ? <CheckCircle className="w-5 h-5"/> : livePass.status === 'rejected' && livePass.status.includes('hod') ? <XCircle className="w-5 h-5"/> : <Clock className="w-4 h-4"/>}
                        </div>
                        <span className="mt-2 text-xs font-medium text-gray-900 dark:text-white">HOD</span>
                        {livePass.hod_approved_at && <span className="text-[10px] text-gray-500 mt-1">{new Date(livePass.hod_approved_at).toLocaleDateString()}</span>}
                      </div>

                      {/* Dean Step */}
                      <div className="flex flex-col items-center bg-white dark:bg-gray-800 px-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${livePass.dean_approved_at ? 'bg-green-500 text-white' : livePass.status === 'rejected' && livePass.status.includes('dean') ? 'bg-red-500 text-white' : livePass.status === 'pending_dean' ? 'bg-yellow-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                          {livePass.dean_approved_at ? <CheckCircle className="w-5 h-5"/> : livePass.status === 'rejected' && livePass.status.includes('dean') ? <XCircle className="w-5 h-5"/> : <Clock className="w-4 h-4"/>}
                        </div>
                        <span className="mt-2 text-xs font-medium text-gray-900 dark:text-white">Dean</span>
                        {livePass.dean_approved_at && <span className="text-[10px] text-gray-500 mt-1">{new Date(livePass.dean_approved_at).toLocaleDateString()}</span>}
                      </div>

                      {/* OM Step */}
                      <div className="flex flex-col items-center bg-white dark:bg-gray-800 px-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${livePass.om_approved_at ? 'bg-green-500 text-white' : livePass.status === 'rejected' && livePass.status.includes('om') ? 'bg-red-500 text-white' : livePass.status === 'pending_om' ? 'bg-blue-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                          {livePass.om_approved_at ? <CheckCircle className="w-5 h-5"/> : livePass.status === 'rejected' && livePass.status.includes('om') ? <XCircle className="w-5 h-5"/> : <Clock className="w-4 h-4"/>}
                        </div>
                        <span className="mt-2 text-xs font-medium text-gray-900 dark:text-white">OM</span>
                        {livePass.om_approved_at && <span className="text-[10px] text-gray-500 mt-1">{new Date(livePass.om_approved_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>

                  {livePass.rejection_reason && (
                    <div className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">Rejection Reason</p>
                        <p className="text-sm text-red-600 dark:text-red-300">{livePass.rejection_reason}</p>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No Live Request</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">You don't have any pending gate pass requests.</p>
                </div>
              )}
            </div>
          </div>

          {/* History / All Passes */}
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4">Request History</h2>
            {requests.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-10 text-center">
                <p className="text-gray-500 dark:text-gray-400">No gate passes found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.map(gp => {
                  const expired = isReqExpired(gp);
                  const actualStatus = expired ? 'expired' : gp.status;
                  
                  return (
                    <div key={gp.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex flex-col justify-between relative overflow-hidden transition hover:shadow-md">
                      {expired && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-10 uppercase tracking-wider">Expired</div>}
                      
                      <button 
                        onClick={() => setDeletingId(gp.id)}
                        className={`absolute ${expired ? 'top-5' : 'top-2'} right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition`}
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="pr-8 mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 line-clamp-1">{gp.reason}</h3>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Out: {formatDateTime(gp.out_time)}</span>
                          {gp.expected_in_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> In: {formatDateTime(gp.expected_in_time)}</span>}
                        </div>
                      </div>
                      
                      <div className="mt-auto flex justify-between items-end border-t border-gray-100 dark:border-gray-700 pt-3">
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
                            onClick={() => setSelectedEPassReq(gp)}
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

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-2xl dark:border dark:border-gray-700 w-full max-w-sm p-6 text-center transform transition-all">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-100 dark:border-red-500/20">
              <Trash2 className="w-7 h-7 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Request</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Are you sure you want to delete this gate pass request? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition"
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
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-2xl dark:border dark:border-gray-700 w-full max-w-md p-6 transform transition-all">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Request Gate Pass</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reason for Leaving</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  placeholder="Explain why you need to leave campus"
                />
              </div>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departure Time (Today)</label>
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
                              backgroundColor: 'white',
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Return (Today)</label>
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
                              backgroundColor: 'white',
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
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E-Pass Modal */}
      {selectedEPassReq && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEPassReq(null)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedEPassReq(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <FacultyEPassCard req={selectedEPassReq} />
          </div>
        </div>
      )}
    </div>
  );
}
