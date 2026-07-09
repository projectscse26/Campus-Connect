import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart2, AlertTriangle, Users, ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle, XCircle, Clock, Download, FileText, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const CAAttendanceSummary = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFormat, setReportFormat] = useState('excel');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);

  const openReportModal = () => {
    const tzDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setReportStartDate(tzDate);
    setReportEndDate(tzDate);
    setShowReportModal(true);
  };

  useEffect(() => {
    setLoading(true);
    // Format date properly accounting for timezone offset
    const tzOffsetDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    axios.get(`/api/class-advisor/attendance?date=${tzOffsetDate}`)
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load attendance records'))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  // Calendar Logic
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day) => {
    return selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  };

  // Report Generation
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      if (!reportStartDate || !reportEndDate) {
        alert("Please select both start and end dates.");
        setGeneratingReport(false);
        return;
      }
      
      const sDateObj = new Date(reportStartDate);
      const eDateObj = new Date(reportEndDate);

      if (sDateObj > eDateObj) {
        alert("Start date cannot be after end date.");
        setGeneratingReport(false);
        return;
      }

      const startDate = reportStartDate;
      const endDate = reportEndDate;

      // Load logo image as base64
      let logoData = null;
      try {
        logoData = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve({
              data: canvas.toDataURL('image/png'),
              width: img.width,
              height: img.height
            });
          };
          img.onerror = () => resolve(null);
          img.src = '/logo.png';
        });
      } catch (e) {
        console.error('Failed to load logo', e);
      }

      const res = await axios.get(`/api/class-advisor/attendance-report?start_date=${startDate}&end_date=${endDate}`);
      const reportData = res.data;

      // Deterministically generate all dates for the range
      const dates = [];
      const columnHeaders = [];
      let curr = new Date(sDateObj);
      while (curr <= eDateObj) {
        const dateStr = new Date(curr.getTime() - (curr.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        dates.push(dateStr);
        const [y, m, d] = dateStr.split('-');
        columnHeaders.push(`${d}/${m}`);
        curr.setDate(curr.getDate() + 1);
      }

      const sDateFmt = startDate.split('-').reverse().join('/');
      const eDateFmt = endDate.split('-').reverse().join('/');
      const reportTitle = startDate === endDate 
        ? `Attendance Report - ${sDateFmt}`
        : `Attendance Report - ${sDateFmt} to ${eDateFmt}`;

      const headers = ['Register Number', 'Name', ...columnHeaders];
      
      const rows = reportData.map(s => {
        const row = [s.register_number, `${s.first_name} ${s.last_name}`];
        dates.forEach(d => {
          const status = s.attendance ? s.attendance[d] : null;
          if (status === 'present') row.push('P');
          else if (status === 'absent') row.push('A');
          else row.push('-');
        });
        return row;
      });

      if (reportFormat === 'excel') {
        const ws = XLSX.utils.aoa_to_sheet([[reportTitle], headers, ...rows]);
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
        XLSX.writeFile(wb, `Attendance_Report_${startDate}_to_${endDate}.xlsx`);
      } else {
        const doc = new jsPDF({ orientation: dates.length > 7 ? 'landscape' : 'portrait' });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        let tableStartY = 20;
        let logoTargetWidth = 0;
        let logoTargetHeight = 0;

        if (logoData) {
          // Span the width with 14mm margins
          logoTargetWidth = pageWidth - 28;
          logoTargetHeight = (logoData.height / logoData.width) * logoTargetWidth;
          
          // Cap height in case it's a square logo, preventing it from taking up too much vertical space
          if (logoTargetHeight > 40) {
            logoTargetHeight = 40;
            logoTargetWidth = (logoData.width / logoData.height) * logoTargetHeight;
          }
          
          // 10mm top margin + logo height + 12mm gap for the title + 5mm gap before table
          tableStartY = 10 + logoTargetHeight + 17;
        } else {
          tableStartY = 30;
        }

        doc.autoTable({
          head: [headers],
          body: rows,
          startY: tableStartY,
          margin: { top: tableStartY },
          theme: 'grid',
          styles: { fontSize: 7, cellPadding: 1, halign: 'center' },
          columnStyles: { 0: { halign: 'left', cellWidth: 'auto' }, 1: { halign: 'left', cellWidth: 'auto' } },
          headStyles: { fillColor: [79, 70, 229], halign: 'center' },
          didDrawPage: function (data) {
            if (logoData) {
              const xPos = (pageWidth - logoTargetWidth) / 2;
              doc.addImage(logoData.data, 'PNG', xPos, 10, logoTargetWidth, logoTargetHeight);
              
              doc.setFontSize(14);
              doc.setTextColor(40);
              doc.text(reportTitle, pageWidth / 2, 10 + logoTargetHeight + 10, { align: 'center' });
            } else {
              doc.setFontSize(14);
              doc.setTextColor(40);
              doc.text(reportTitle, pageWidth / 2, 20, { align: 'center' });
            }
          }
        });
        doc.save(`Attendance_Report_${startDate}_to_${endDate}.pdf`);
      }
      setShowReportModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Stats
  const presentCount = data.filter(s => s.status === 'present').length;
  const absentCount = data.filter(s => s.status === 'absent').length;
  const unmarkedCount = data.filter(s => !s.status).length;
  const formattedSelectedDate = selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Generate Report</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Report Date Range</label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">From</label>
                      <input 
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">To</label>
                      <input 
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Format</label>
                  <div className="flex gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input type="radio" className="peer sr-only" name="format" checked={reportFormat === 'excel'} onChange={() => setReportFormat('excel')} />
                      <div className="p-3 flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 peer-checked:border-green-600 peer-checked:bg-green-50 dark:peer-checked:bg-green-900/20 text-gray-600 dark:text-gray-300 peer-checked:text-green-700 dark:peer-checked:text-green-400 font-medium transition-all">
                        <FileSpreadsheet className="w-5 h-5" /> Excel
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input type="radio" className="peer sr-only" name="format" checked={reportFormat === 'pdf'} onChange={() => setReportFormat('pdf')} />
                      <div className="p-3 flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 peer-checked:border-red-600 peer-checked:bg-red-50 dark:peer-checked:bg-red-900/20 text-gray-600 dark:text-gray-300 peer-checked:text-red-700 dark:peer-checked:text-red-400 font-medium transition-all">
                        <FileText className="w-5 h-5" /> PDF
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGenerateReport}
                  disabled={generatingReport}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {generatingReport ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Generating...</>
                  ) : (
                    <><Download className="w-4 h-4" /> Generate</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 mb-1">
            <CalendarIcon className="w-6 h-6 text-indigo-600" /> Daily Attendance Records
          </h1>
          <p className="text-sm text-gray-500">Select a date to view attendance records for your class.</p>
        </div>
        
        <button 
          onClick={openReportModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm shadow-indigo-600/20 w-fit"
        >
          <Download className="w-4 h-4" /> Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        
        {/* Left Column: Summary & Calendar */}
        <div className="lg:col-span-1 space-y-6 sticky top-0">
          
          {/* Calendar UI */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {currentMonth.toLocaleString('default', { month: 'long' })} {year}
              </h2>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs font-bold text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const today = isToday(day);
                const selected = isSelected(day);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    className={`
                      w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-semibold transition-all relative
                      ${selected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                      ${today && !selected ? 'ring-2 ring-indigo-200 dark:ring-indigo-700 text-indigo-700 dark:text-indigo-400 font-bold' : ''}
                    `}
                  >
                    {day}
                    {selected && (
                      <span className="absolute bottom-1.5 w-1 h-1 bg-white rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Day Overview</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Stats for {selectedDate.toLocaleDateString()}</p>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Enrolled</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{data.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">Present</span>
                <span className="text-sm font-bold text-green-700 dark:text-green-400">{presentCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">Absent</span>
                <span className="text-sm font-bold text-red-700 dark:text-red-400">{absentCount}</span>
              </div>
              {unmarkedCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Not Marked</span>
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{unmarkedCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Student Records (Scrollable) */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col max-h-[calc(100vh-140px)]">
            
            {/* Records Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4 flex-shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Student Records
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formattedSelectedDate}</p>
              </div>
              
              <div className="flex items-center gap-2">
                 <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                   {data.length} Students
                 </div>
              </div>
            </div>

            {/* Scrollable Records List */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="py-24 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-sm text-gray-500 font-medium">Loading records...</p>
                </div>
              ) : error ? (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900/30">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-500 font-medium">{error}</p>
                </div>
              ) : data.length === 0 ? (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700">
                    <Users className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    No Students Found
                  </h4>
                  <p className="text-sm font-medium text-gray-500">
                    No students are assigned to this class.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.map(s => {
                    const isPresent = s.status === 'present';
                    const isAbsent = s.status === 'absent';
                    const isUnmarked = !s.status;

                    return (
                      <div key={s.student_id} className={`bg-white dark:bg-gray-800 rounded-2xl border ${
                        isPresent ? 'border-green-200 dark:border-green-900/50' : 
                        isAbsent ? 'border-red-200 dark:border-red-900/50' : 
                        'border-gray-200 dark:border-gray-700'
                      } overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                        <div className="w-full p-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                          
                          {/* Student Info */}
                          <div className="flex items-center gap-4 w-full sm:w-auto shrink-0">
                            <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center font-bold text-lg ${
                              isPresent ? 'bg-green-50 dark:bg-green-900/30 text-green-700 border border-green-100 dark:border-green-800' : 
                              isAbsent ? 'bg-red-50 dark:bg-red-900/30 text-red-600 border border-red-100 dark:border-red-800' : 
                              'bg-gray-50 dark:bg-gray-700/50 text-gray-500 border border-gray-200 dark:border-gray-600'
                            }`}>
                              {s.first_name.charAt(0)}{s.last_name.charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[15px] font-bold text-gray-900 dark:text-white truncate">{s.first_name} {s.last_name}</span>
                              <span className="text-xs font-mono text-gray-500">{s.register_number}</span>
                            </div>
                          </div>

                          {/* Status Pill */}
                          <div className="flex items-center shrink-0 mt-2 sm:mt-0">
                            {isPresent && (
                              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-bold rounded-xl border border-green-100 dark:border-green-800">
                                <CheckCircle className="w-4 h-4" /> Present
                              </span>
                            )}
                            {isAbsent && (
                              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-bold rounded-xl border border-red-100 dark:border-red-800">
                                <XCircle className="w-4 h-4" /> Absent
                              </span>
                            )}
                            {isUnmarked && (
                              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-700">
                                <Clock className="w-4 h-4" /> Not Marked
                              </span>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
