import React from 'react';
import { Check, X } from 'lucide-react';

export default function FacultyEPassCard({ req }) {
  const isExpired = req.expected_in_time && new Date(req.expected_in_time) < new Date();
  const departmentName = req.faculty?.department?.code || req.faculty?.department?.name || 'FACULTY';
  
  return (
    <div className="mt-8 border rounded-[32px] overflow-hidden shadow-2xl w-[92vw] max-w-[420px] mx-auto bg-[#fafafa] relative font-sans flex flex-col items-center">
      
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-[250px] z-0 overflow-hidden">
        {/* Navy wave approximation */}
        <div className="absolute top-0 left-0 w-full h-[180px] bg-[#0f3a61]" style={{ clipPath: 'ellipse(110% 100% at 50% 0%)' }}></div>
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <svg width="100%" height="250" viewBox="0 0 400 250" preserveAspectRatio="none">
          {/* Yellow swoosh */}
          <path d="M-50,150 Q100,50 200,150 T450,150 L450,0 L-50,0 Z" fill="#efc958" />
          {/* Navy swoosh */}
          <path d="M-50,140 Q100,40 200,140 T450,140 L450,0 L-50,0 Z" fill="#0f3a61" />
        </svg>
      </div>

      {/* Date watermark to prevent cheating */}
      <div className="absolute top-4 right-4 text-[10px] sm:text-xs font-bold text-white z-20 opacity-80">
        {new Date().toLocaleDateString('en-GB')}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center pt-6 pb-4">
        
        {/* Logo Pill */}
        <div className="bg-white rounded-full px-5 py-1.5 flex items-center space-x-2 shadow-sm mb-6">
          <img src="/logo2.png" alt="SVCET" className="w-7 h-7 object-contain rounded-full border border-[#0f3a61] p-0.5" />
          <span className="text-[#0f3a61] font-black text-lg tracking-[0.2em] uppercase">SVCET</span>
        </div>
        
        {/* Avatar Placeholder */}
        <div className="w-[120px] h-[120px] bg-[#efc958] rounded-full flex flex-col items-center justify-end shadow-md relative overflow-hidden mt-1">
          {/* Internal white circle & semi-circle */}
          <div className="w-10 h-10 rounded-full border-[3px] border-[#1a1a1a] bg-white absolute top-5"></div>
          <div className="w-[85px] h-[45px] border-[3px] border-[#1a1a1a] border-b-0 rounded-t-full bg-white absolute bottom-[-4px]"></div>
        </div>

        {/* Name */}
        <h2 className="mt-4 text-xl lg:text-2xl font-extrabold text-gray-900 uppercase tracking-tight text-center px-4 leading-tight flex flex-col items-center">
          <span>{req.faculty?.first_name}</span>
          {req.faculty?.last_name && <span>{req.faculty?.last_name}</span>}
        </h2>
        
        {/* Department Pill */}
        <div className="mt-2 bg-[#efc958] text-black px-8 py-1.5 rounded-full text-base font-medium tracking-[0.1em] uppercase">
          {departmentName}
        </div>

        {/* Email */}
        <div className="mt-4 text-black text-base text-center px-4" style={{ fontFamily: 'sans-serif' }}>
          E-mail : {req.faculty?.college_email}
        </div>
        
        {/* Out Time */}
        <div className="mt-3 text-[#0f3a61] text-lg font-bold text-center px-4 bg-blue-50 py-1.5 rounded-xl w-3/4 shadow-sm border border-blue-100">
          Out Time: {new Date(req.out_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
        </div>
        
        {/* Date Time for anti-cheat */}
        <div className="mt-2 text-black text-xs font-semibold text-center px-4 bg-gray-200 py-1 px-3 rounded-lg">
          Generated: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
        </div>

        {/* Checkmark/Cross */}
        <div className="mt-5">
          {isExpired ? (
            <div className="w-[100px] h-[100px] bg-red-50 rounded-full flex items-center justify-center shadow-inner relative">
              <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-20"></div>
              <div className="w-[65px] h-[65px] border-[5px] border-[#e1251b] rounded-full flex items-center justify-center relative z-10">
                <X className="w-[32px] h-[32px] text-[#e1251b]" strokeWidth={5} />
              </div>
            </div>
          ) : (
            <div className="w-[100px] h-[100px] bg-green-50 rounded-full flex items-center justify-center shadow-inner relative">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
              <div className="w-[65px] h-[65px] border-[5px] border-[#00b91e] rounded-full flex items-center justify-center relative z-10">
                <Check className="w-[32px] h-[32px] text-[#00b91e]" strokeWidth={5} />
              </div>
            </div>
          )}
        </div>

        {/* Status Button */}
        <div className={`mt-5 mb-2 w-[85%] py-3 rounded-[16px] text-center text-2xl font-black text-white uppercase tracking-wider shadow-lg transition-transform hover:scale-105 ${isExpired ? 'bg-[#e1251b]' : 'bg-[#00b91e]'}`}>
          {isExpired ? 'EXPIRED' : 'APPROVED'}
        </div>
      </div>
    </div>
  );
}
