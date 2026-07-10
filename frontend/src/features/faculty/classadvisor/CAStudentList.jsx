import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, GraduationCap, ChevronRight, Phone, FileText, Download, X } from 'lucide-react';

export const CAStudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({
    register_number: true,
    first_name: true,
    last_name: true,
    phone: true,
    gender: true,
    college_email: false,
    personal_email: false,
    date_of_birth: false,
    blood_group: false,
    father_name: false,
    father_phone: false,
    mother_name: false,
    mother_phone: false,
    address_line1: false,
    city: false,
    pincode: false,
    tenth_percentage: false,
    twelfth_percentage: false,
    accommodation: false,
    transportation: false
  });
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/class-advisor/students')
      .then(r => setStudents(r.data))
      .catch(() => setError('Failed to load students'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    s.register_number.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownloadReport = async (format) => {
    try {
      setReportLoading(true);
      const cols = Object.keys(selectedColumns).filter(k => selectedColumns[k]).join(',');
      const response = await axios.get(`/api/class-advisor/students/report`, {
        params: { format, columns: cols },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      link.setAttribute('download', `student_list.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowReportModal(false);
    } catch (err) {
      console.error('Failed to download report', err);
      alert('Failed to generate report.');
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Student List</h1>
              <p className="text-xs text-gray-500">{students.length} students in your class</p>
            </div>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Generate Report</span>
          </button>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or register no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white outline-none transition-all"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 text-center text-gray-500 font-medium">Loading...</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 font-medium">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center">
          <GraduationCap className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-gray-500 font-medium">No students found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => navigate(`/faculty/class-advisor/students/${s.id}`)}
              className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 active:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-sm font-extrabold text-purple-600 flex-shrink-0">
                {s.first_name.charAt(0)}{s.last_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{s.first_name} {s.last_name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs font-mono text-gray-400">{s.register_number}</span>
                  {s.phone && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Phone className="w-3 h-3" />{s.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {s.gender && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-lg">
                    {s.gender}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      )}
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Generate Report
              </h2>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Select Columns</label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                  {Object.keys(selectedColumns).map(col => (
                    <label key={col} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                      <input 
                        type="checkbox"
                        checked={selectedColumns[col]}
                        onChange={(e) => setSelectedColumns(prev => ({ ...prev, [col]: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600 flex-shrink-0"
                      />
                      <span className="text-xs font-medium text-gray-700 capitalize truncate">
                        {col.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleDownloadReport('pdf')}
                  disabled={reportLoading}
                  className="flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button
                  onClick={() => handleDownloadReport('excel')}
                  disabled={reportLoading}
                  className="flex items-center justify-center gap-2 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
