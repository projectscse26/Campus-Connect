import React, { useState } from 'react';
import { FacultyLeaveApprovals } from './FacultyLeaveApprovals';
import { StudentLeaveApprovals } from './StudentLeaveApprovals';

export const LeaveApprovals = () => {
  const [activeTab, setActiveTab] = useState('faculty');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="max-w-5xl mx-auto flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('faculty')}
          className={`py-3 px-6 font-semibold text-[14px] border-b-2 transition-colors ${
            activeTab === 'faculty'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Faculty Leaves
        </button>
        <button
          onClick={() => setActiveTab('student')}
          className={`py-3 px-6 font-semibold text-[14px] border-b-2 transition-colors ${
            activeTab === 'student'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Student Leaves
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'faculty' && <FacultyLeaveApprovals />}
        {activeTab === 'student' && <StudentLeaveApprovals />}
      </div>
    </div>
  );
};
