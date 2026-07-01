import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, Send, User, Briefcase, Shield } from 'lucide-react';

export const GatePassTracker = ({ status, rejectionReason, approvers }) => {
  const steps = [
    { key: 'requested', label: 'Requested', defaultIcon: Send },
    { key: 'pending_mentor', label: 'Mentor Approval', role: 'Mentor', user: approvers?.mentor, defaultIcon: User },
    { key: 'pending_hod', label: 'HOD Approval', role: 'HOD', user: approvers?.hod, defaultIcon: Briefcase },
    { key: 'pending_om', label: 'OM Approval', role: 'Office Manager', user: approvers?.om, defaultIcon: Shield },
    { key: 'final', label: 'Final Status', defaultIcon: CheckCircle2 }
  ];

  const getStepStatus = (stepKey, currentStatus) => {
    if (currentStatus === 'rejected') {
      if (stepKey === 'final') return 'rejected';
      return 'past'; 
    }

    const flow = ['requested', 'pending_mentor', 'pending_hod', 'pending_om', 'approved'];
    let currentIdx = flow.indexOf(currentStatus);
    if (currentStatus === 'approved') currentIdx = 4;
    
    let stepIdx = flow.indexOf(stepKey);
    if (stepKey === 'final') stepIdx = 4;

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full py-4 px-2 sm:px-4">
      <div className="flex flex-col relative">
        {/* Connecting line */}
        <div className="absolute left-3 top-3 bottom-8 w-0.5 bg-gray-200" />
        
        {steps.map((step, idx) => {
          const stepStatus = getStepStatus(step.key, status);
          
          const StepIcon = step.defaultIcon;
          let icon = <StepIcon className="w-3.5 h-3.5 text-gray-400" />;
          let bgClass = "bg-white border-2 border-gray-300";
          let textClass = "text-gray-500";
          
          if (stepStatus === 'completed') {
            icon = <CheckCircle2 className="w-3.5 h-3.5 text-white" />;
            bgClass = "bg-green-500 border-2 border-green-500";
            textClass = "text-green-700 font-medium";
          } else if (stepStatus === 'current') {
            icon = <StepIcon className="w-3.5 h-3.5 text-blue-600" />;
            bgClass = "bg-blue-50 border-2 border-blue-600";
            textClass = "text-blue-700 font-bold";
          } else if (status === 'rejected' && step.key === 'final') {
            icon = <XCircle className="w-3.5 h-3.5 text-white" />;
            bgClass = "bg-red-500 border-2 border-red-500";
            textClass = "text-red-700 font-bold";
          } else if (status === 'approved' && step.key === 'final') {
             icon = <CheckCircle2 className="w-3.5 h-3.5 text-white" />;
             bgClass = "bg-green-500 border-2 border-green-500";
             textClass = "text-green-700 font-bold";
          }

          return (
            <div key={idx} className="relative z-10 flex items-start gap-3 mb-6 last:mb-0">
              <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center ${bgClass} transition-colors duration-200 shadow-sm relative z-10 bg-white`}>
                {icon}
              </div>
              <div className="flex flex-col pt-0.5">
                <span className={`text-[13px] ${textClass}`}>{step.label}</span>
                {step.user && stepStatus === 'completed' && (
                  <span className="text-[11px] text-gray-400">
                    {step.user.first_name} {step.user.last_name}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {status === 'rejected' && rejectionReason && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Gate Pass Rejected</h4>
            <p className="text-xs text-red-600 mt-1">{rejectionReason}</p>
          </div>
        </div>
      )}
    </div>
  );
};
