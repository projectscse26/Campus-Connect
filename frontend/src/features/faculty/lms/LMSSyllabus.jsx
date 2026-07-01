import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Settings, ArrowLeft, Construction } from 'lucide-react';

export const LMSSyllabus = () => {
  const { assignmentId } = useParams();

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link 
            to={`/faculty/courses/${assignmentId}/lms`} 
            className="text-gray-500 hover:text-orange-600 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-orange-600" /> Syllabus Configuration
          </h1>
          <p className="text-sm text-gray-500 mt-1">Define course outcomes, modules, and grading criteria.</p>
        </div>
      </div>

      <div className="bg-orange-50/50 rounded-3xl border border-orange-100 p-12 text-center shadow-sm">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Construction className="w-10 h-10 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Module Under Construction</h2>
        <p className="text-gray-600 max-w-lg mx-auto leading-relaxed">
          The Syllabus configuration tool is currently being built. Soon, you will be able to dynamically link resources and assignments to specific syllabus units.
        </p>
      </div>
    </div>
  );
};
