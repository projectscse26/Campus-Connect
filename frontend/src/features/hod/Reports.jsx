import React from 'react';
import { DownloadCloud, FileText, FileSpreadsheet } from 'lucide-react';

export const Reports = () => {
  const handleDownload = (type) => {
    // Note: Since this is frontend only for now, we just simulate a download.
    // In reality, this would hit an API endpoint that generates a PDF or Excel file.
    alert(`Generating ${type} report... (Simulated)`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
          <DownloadCloud className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 font-medium">Generate and export department data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 text-gray-400 mr-2" /> PDF Reports
          </h3>
          <div className="space-y-3">
            <button onClick={() => handleDownload('Attendance PDF')} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-colors">
              Class-wise Attendance Report
            </button>
            <button onClick={() => handleDownload('Results PDF')} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-colors">
              Semester Results Analysis
            </button>
            <button onClick={() => handleDownload('Faculty Workload PDF')} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-colors">
              Faculty Workload Report
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <FileSpreadsheet className="w-5 h-5 text-green-500 mr-2" /> Excel Exports
          </h3>
          <div className="space-y-3">
            <button onClick={() => handleDownload('Attendance Excel')} className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl text-sm font-bold text-green-800 transition-colors">
              Export Attendance Data (Raw)
            </button>
            <button onClick={() => handleDownload('Results Excel')} className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl text-sm font-bold text-green-800 transition-colors">
              Export Grades Data (Raw)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
