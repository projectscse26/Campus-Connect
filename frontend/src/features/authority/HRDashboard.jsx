import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users } from 'lucide-react';

const HRDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight mb-1">
            HR Dashboard 👥
          </h1>
          <p className="text-[14px] text-gray-500">
            Welcome to the HR Portal
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-12 text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">HR Module Coming Soon</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          This portal is currently a blank slate. New features for human resources management will be implemented here soon.
        </p>
      </div>
    </div>
  );
};

export default HRDashboard;
