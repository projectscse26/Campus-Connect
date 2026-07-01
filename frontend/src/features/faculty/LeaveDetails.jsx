import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Edit3, XCircle, CheckCircle, Clock, Check, Users, Lock, ChevronRight } from 'lucide-react';

export const LeaveDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`/api/leave/requests/${id}`);
      setRequest(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!request) {
    return <div className="text-center py-12 text-gray-500">Request not found.</div>;
  }

  const getStatusBadge = () => {
    if (request.status === 'approved') return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Approved</span>;
    if (request.status === 'rejected') return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Rejected</span>;
    return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending</span>;
  };

  const timelineSteps = [
    { label: 'Submitted', date: request.created_at, status: 'completed' },
    { label: 'Alt Faculty Approval', status: request.status === 'pending_substitute' ? 'current' : 'completed' },
    { label: 'HOD Approval', status: ['pending_substitute'].includes(request.status) ? 'upcoming' : request.status === 'pending_hod' ? 'current' : 'completed' },
    { label: 'Dean Approval', status: ['pending_substitute', 'pending_hod'].includes(request.status) ? 'upcoming' : request.status === 'pending_dean' ? 'current' : 'completed' },
    { label: 'Principal Approval', status: ['pending_substitute', 'pending_hod', 'pending_dean'].includes(request.status) ? 'upcoming' : request.status === 'pending_om' ? 'current' : 'completed' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-6">
        <Link to="/faculty/leave" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Requests
        </Link>
        <div className="flex items-center space-x-3 mb-1">
          <span className="bg-gray-800 text-white px-2 py-0.5 rounded text-xs font-bold">REQ-{request.id}</span>
          {getStatusBadge()}
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-4 sm:gap-0">
          <div>
            <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight mt-2">{request.leave_type} Application</h1>
            <p className="text-sm text-gray-500 mt-1">
              Submitted on {new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto mt-2">
            <button className="flex-1 sm:flex-none justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm flex items-center">
              <Edit3 className="w-4 h-4 mr-2" /> Modify
            </button>
            <button className="flex-1 sm:flex-none justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm flex items-center">
              <XCircle className="w-4 h-4 mr-2" /> Withdraw
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="flex-1 space-y-6">
          
          {/* General Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">General Information</h2>
            
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Leave Type</p>
                <div className="flex items-center text-sm font-semibold text-gray-900">
                  <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center mr-2">
                    <Clock className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  {request.leave_type}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Duration</p>
                <div className="flex items-center text-sm font-semibold text-gray-900">
                  <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center mr-2">
                    <Clock className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  {new Date(request.from_date).toLocaleDateString()} — {new Date(request.to_date).toLocaleDateString()}
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-8">{request.duration_days} Working Days</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reason for Absence</p>
              <div className="bg-[#f8fbfd] border border-blue-100 rounded-lg p-4 text-sm text-gray-700 italic">
                "{request.reason}"
              </div>
            </div>
          </div>

          {/* Duty Arrangements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-800">Duty Arrangements</h2>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            
            {request.arrangements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {request.arrangements.map(arr => (
                  <div key={arr.id} className="border border-gray-200 rounded-xl p-4 flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <Users className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Substitute Instructor</p>
                      <p className="text-sm font-bold text-gray-900">{arr.substitute_faculty_name}</p>
                      <p className="text-xs text-gray-500 mb-2">{arr.subject} ({arr.class_section})</p>
                      
                      {arr.status === 'accepted' ? (
                        <div className="inline-flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> ACCEPTED
                        </div>
                      ) : arr.status === 'rejected' ? (
                        <div className="inline-flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> REJECTED
                        </div>
                      ) : (
                        <div className="inline-flex items-center text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                          <Clock className="w-3.5 h-3.5 mr-1" /> PENDING
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No duty arrangements needed.</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Approval Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Approval Timeline</h2>
            
            <div className="absolute right-[-20px] top-4 opacity-5 pointer-events-none">
              <CheckCircle className="w-32 h-32" />
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  
                  {/* Icon */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${
                    step.status === 'completed' ? 'bg-[#0f172a] border-[#0f172a] text-white' :
                    step.status === 'current' ? 'bg-yellow-50 border-yellow-400 text-yellow-600' :
                    'bg-white border-gray-200 text-gray-300'
                  }`}>
                    {step.status === 'completed' ? <Check className="w-4 h-4" /> :
                     step.status === 'current' ? <div className="w-2 h-2 bg-yellow-500 rounded-full"></div> :
                     <Lock className="w-3.5 h-3.5" />}
                  </div>
                  
                  {/* Content */}
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] ml-4 md:ml-0">
                    <h3 className={`font-bold text-sm ${step.status === 'upcoming' ? 'text-gray-400' : 'text-gray-900'}`}>
                      {step.label}
                    </h3>
                    {step.status === 'completed' && step.date && (
                      <time className="block text-xs font-medium text-gray-500">
                        {new Date(step.date).toLocaleDateString()}
                      </time>
                    )}
                    {step.status === 'current' && (
                      <p className="text-xs font-semibold text-yellow-600 mt-0.5">Pending Review</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1e3a5f] rounded-xl shadow-sm overflow-hidden text-white p-5">
            <div className="flex items-start">
              <div className="w-5 h-5 rounded-full border border-blue-300 text-blue-300 flex items-center justify-center text-xs font-bold mr-3 shrink-0">i</div>
              <div className="text-sm">
                <p className="font-bold mb-1">Leave Balance Note</p>
                <p className="text-blue-100 text-xs leading-relaxed">
                  Approving this request will leave you with <span className="underline font-bold">12 days</span> of Casual Leave for the remaining semester.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
