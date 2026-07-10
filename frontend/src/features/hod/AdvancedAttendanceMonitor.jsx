import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, Users, UserX, UserCheck, TrendingUp, TrendingDown,
  Download, Printer, AlertTriangle, CheckCircle, ShieldAlert, SlidersHorizontal, FileText, X
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const AdvancedAttendanceMonitor = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFormat, setReportFormat] = useState('excel');

  // Filters state
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Dashboard view states
  const [pieView, setPieView] = useState('student');
  const [sectionYear, setSectionYear] = useState(2);
  const [riskYear, setRiskYear] = useState(2);
  const [timeScale, setTimeScale] = useState('Daily');
  const [trendView, setTrendView] = useState('student');
  const [tableYearFilter, setTableYearFilter] = useState('All');
  const [tableSectionFilter, setTableSectionFilter] = useState('All');
  const [tableAttendanceFilter, setTableAttendanceFilter] = useState('All');

  useEffect(() => {
    fetchData();
  }, [semester, section, date, timeScale]);


  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (semester) params.append('semester', semester);
      if (section) params.append('section_id', section);
      if (date) params.append('target_date', date);
      if (timeScale) params.append('time_scale', timeScale);

      const res = await axios.get(`/api/hod/attendance-analytics?${params.toString()}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!filteredStudentTable || filteredStudentTable.length === 0) {
      alert('No data available to generate report with current filters');
      return;
    }
    
    const headers = ['Register Number', 'Name', 'Section', 'Year', 'Total Present', 'Total Absent', 'Percentage', 'Status'];
    const rows = filteredStudentTable.map(s => [
      s.register_number, 
      s.name, 
      s.section, 
      s.year,
      s.total_present, 
      s.total_absent, 
      s.percentage, 
      s.status
    ]);

    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');

    // Auto-size columns
    const maxWidth = worksheetData.reduce((w, r) => Math.max(w, ...r.map(c => String(c).length)), 10);
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));

    // Create filename based on filters
    const filterSuffix = `Year_${tableYearFilter}_Section_${tableSectionFilter}_Attendance_${tableAttendanceFilter}`;
    XLSX.writeFile(workbook, `Attendance_Report_${filterSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowReportModal(false);
  };

  const handleDownloadPDF = async () => {
    try {
      console.log('=== PDF Generation Started ===');
      
      if (!filteredStudentTable || filteredStudentTable.length === 0) {
        console.error('No student table data available');
        alert('No data available to generate report with current filters');
        return;
      }

      console.log('Student records found:', filteredStudentTable.length);
      
      // Sort students alphabetically by name
      const sortedStudents = [...filteredStudentTable].sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      console.log('Students sorted alphabetically');
      
      // Create PDF instance - Portrait orientation like the reference
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Get page width at the top level
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      console.log('jsPDF instance created');
      console.log('autoTable method exists:', typeof doc.autoTable === 'function');
      
      if (typeof doc.autoTable !== 'function') {
        throw new Error('jspdf-autotable plugin not loaded properly');
      }
      
      // Load and add header image
      try {
        console.log('Loading header image...');
        
        // Function to convert image to base64
        const getBase64Image = (img) => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          return canvas.toDataURL('image/png');
        };
        
        // Load the header image from public folder
        const headerImg = new Image();
        headerImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Image loading timeout'));
          }, 5000);
          
          headerImg.onload = () => {
            clearTimeout(timeout);
            console.log('Header image loaded successfully');
            console.log('Image dimensions:', headerImg.width, 'x', headerImg.height);
            
            try {
              // Convert image to base64
              const imgData = getBase64Image(headerImg);
              
              // Calculate dimensions to fit header
              const maxWidth = pageWidth - 30; // 15mm margins on each side
              const maxHeight = 35; // Maximum height for header
              
              // Calculate aspect ratio
              const imgAspectRatio = headerImg.width / headerImg.height;
              let imgWidth = maxWidth;
              let imgHeight = imgWidth / imgAspectRatio;
              
              // If height exceeds max, scale by height instead
              if (imgHeight > maxHeight) {
                imgHeight = maxHeight;
                imgWidth = imgHeight * imgAspectRatio;
              }
              
              // Center the image horizontally
              const xPos = (pageWidth - imgWidth) / 2;
              const yPos = 10;
              
              // Add image to PDF
              doc.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
              console.log('Header image added to PDF at position:', xPos, yPos, 'size:', imgWidth, imgHeight);
              resolve();
            } catch (imgError) {
              console.error('Error adding image to PDF:', imgError);
              reject(imgError);
            }
          };
          
          headerImg.onerror = (error) => {
            clearTimeout(timeout);
            console.error('Failed to load header image from current path');
            reject(new Error('Failed to load header image'));
          };
          
          // Use absolute path with window.location.origin
          const imagePath = `${window.location.origin}/logo.png`;
          console.log('Attempting to load image from:', imagePath);
          headerImg.src = imagePath;
        });
        
        // Horizontal separator line below header
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(15, 48, pageWidth - 15, 48);
        
        // Report title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        const today = new Date().toLocaleDateString('en-GB');
        doc.text(`Attendance Report - ${today}`, pageWidth / 2, 58, { align: 'center' });
        
        console.log('PDF header added successfully');
      } catch (headerError) {
        console.error('Error adding header:', headerError);
        console.error('Error details:', headerError.message);
        
        // Fallback to text header if image fails
        console.log('Using fallback text header...');
        const centerX = pageWidth / 2;
        
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(76, 175, 80);
        doc.text('sri', centerX - 38, 20);
        
        doc.setTextColor(41, 98, 255);
        doc.text('venkateshwaraa', centerX - 23, 20);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('College of Engineering & Technology', centerX, 28, { align: 'center' });
        
        doc.setFillColor(41, 98, 255);
        doc.rect(centerX - 50, 32, 100, 6, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('ASPIRE TO EXCEL', centerX, 36.5, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Ariyur, Puducherry - 605102.', centerX, 42, { align: 'center' });
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(15, 48, pageWidth - 15, 48);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        const today = new Date().toLocaleDateString('en-GB');
        doc.text(`Attendance Report - ${today}`, centerX, 58, { align: 'center' });
      }
      
      // Prepare table data with sorted students
      try {
        const tableData = sortedStudents.map((student, index) => {
          try {
            return [
              student.register_number || student.regno || '',
              student.name || student.student_name || '',
              student.section || student.section_name || ''
            ];
          } catch (rowError) {
            console.error(`Error processing row ${index}:`, rowError, student);
            return ['', '', 'Error'];
          }
        });

        console.log('Table data prepared successfully:', tableData.length, 'rows');
        
        // Generate table with simplified 3-column layout like reference
        doc.autoTable({
          startY: 65,
          head: [['Register Number', 'Name', 'Section']],
          body: tableData,
          theme: 'grid',
          styles: { 
            fontSize: 9,
            cellPadding: 3,
            overflow: 'linebreak',
            halign: 'left',
            lineColor: [200, 200, 200],
            lineWidth: 0.1
          },
          headStyles: { 
            fillColor: [102, 51, 204], // Purple color matching reference
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 10
          },
          alternateRowStyles: {
            fillColor: [250, 250, 250]
          },
          columnStyles: {
            0: { cellWidth: 40, halign: 'left' },
            1: { cellWidth: 100, halign: 'left' },
            2: { cellWidth: 40, halign: 'center' }
          },
          margin: { left: 15, right: 15 },
          didDrawPage: (data) => {
            // Add page numbers at the bottom
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(128);
            doc.text(
              `Page ${data.pageNumber} of ${pageCount}`,
              pageWidth / 2,
              pageHeight - 10,
              { align: 'center' }
            );
          }
        });
        
        console.log('Table added to PDF successfully');
      } catch (tableError) {
        console.error('Error creating table:', tableError);
        throw new Error('Failed to create PDF table: ' + tableError.message);
      }

      // Save the PDF
      try {
        const filterSuffix = `Year_${tableYearFilter}_Section_${tableSectionFilter}_Attendance_${tableAttendanceFilter}`;
        const filename = `Attendance_Report_${filterSuffix}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        console.log('=== PDF Downloaded Successfully:', filename, '===');
        
        // Close modal
        setShowReportModal(false);
      } catch (saveError) {
        console.error('Error saving PDF:', saveError);
        throw new Error('Failed to download PDF file');
      }
      
    } catch (error) {
      console.error('=== PDF Generation Failed ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // User-friendly error message
      let userMessage = 'An error occurred while generating the PDF report.';
      if (error.message.includes('autoTable')) {
        userMessage = 'PDF generation library not loaded properly. Please refresh the page and try again.';
      } else if (error.message.includes('header')) {
        userMessage = 'Failed to create PDF header. Please try again.';
      } else if (error.message.includes('table')) {
        userMessage = 'Failed to create PDF table. The data format may be invalid.';
      }
      
      alert(`${userMessage}\n\nTechnical details: ${error.message}\n\nPlease try Excel format as an alternative.`);
    }
  };

  const handleGenerateReport = () => {
    if (reportFormat === 'excel') {
      handleExportExcel();
    } else {
      handleDownloadPDF();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  if (!data) return <div className="text-center text-gray-500">Failed to load analytics data.</div>;

  const { overview, student_donut, faculty_donut, trends, section_comparison, heatmap, faculty_stats, risk_distribution, live_status, student_table, insights } = data;

  const filteredStudentTable = (student_table || []).filter(s => {
    if (tableYearFilter !== 'All' && s.year !== Number(tableYearFilter)) return false;
    if (tableSectionFilter !== 'All' && s.section !== tableSectionFilter) return false;
    if (tableAttendanceFilter === '<75') return s.percentage < 75;
    if (tableAttendanceFilter === '<50') return s.percentage < 50;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 print:m-0 print:p-0">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 print:shadow-none print:border-none">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center print:hidden">
            <Activity className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advanced Attendance Analytics</h1>
            <p className="text-sm text-gray-500 font-medium">Department-wide interactive monitoring</p>
          </div>
        </div>
      </div>

      {/* Generate Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Generate Report</h3>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Current Filters Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-purple-900 mb-2">Report will include:</h4>
                <div className="space-y-1 text-sm text-purple-800">
                  <p><span className="font-semibold">Year:</span> {tableYearFilter}</p>
                  <p><span className="font-semibold">Section:</span> {tableSectionFilter}</p>
                  <p><span className="font-semibold">Attendance Filter:</span> {tableAttendanceFilter}</p>
                  <p><span className="font-semibold">Total Records:</span> {filteredStudentTable.length} students</p>
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Select Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setReportFormat('excel')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                      reportFormat === 'excel'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => setReportFormat('pdf')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                      reportFormat === 'pdf'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Printer className="w-5 h-5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 print:hidden">
        <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center w-full max-w-xs">
            <span className="text-xs font-bold text-gray-500 ml-2 mr-2">DATE</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium" />
        </div>
      </div>

      {/* Smart Insights */}
      {insights && insights.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6 print:hidden">
          <h3 className="text-rose-800 font-bold flex items-center mb-2">
            <Activity className="w-5 h-5 mr-2" /> Smart Attendance Insights
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-rose-700 font-medium">
            {insights.map((insight, idx) => <li key={idx}>{insight}</li>)}
          </ul>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
        {[
          { title: "Total Students", value: overview.total_students_dept, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: "Total Faculty", value: overview.total_faculty_dept, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { title: "Total Boys", value: overview.total_boys_dept, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
          { title: "Total Girls", value: overview.total_girls_dept, icon: Users, color: 'text-pink-600', bg: 'bg-pink-50' },
          { title: "Boys Present", value: (live_status.marked_classes > 0) ? overview.boys_present : "Not Marked", icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: "Girls Present", value: (live_status.marked_classes > 0) ? overview.girls_present : "Not Marked", icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: "Boys Absent", value: (live_status.marked_classes > 0) ? overview.boys_absent : "Not Marked", icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50' },
          { title: "Girls Absent", value: (live_status.marked_classes > 0) ? overview.girls_absent : "Not Marked", icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.title}</p>
                <h3 className={`font-black text-gray-900 mt-1 ${typeof stat.value === 'string' ? 'text-lg' : 'text-2xl'}`}>{stat.value}</h3>
              </div>
              <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Donut Charts */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-1 lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Attendance Breakdown</h3>
            <select value={pieView} onChange={e => setPieView(e.target.value)} className="text-xs font-bold text-gray-600 bg-gray-50 border-none rounded-lg p-1 outline-none cursor-pointer">
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieView === 'student' ? student_donut : faculty_donut} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {(pieView === 'student' ? student_donut : faculty_donut).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-1 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
            <div className="flex items-center space-x-3">
              <h3 className="text-sm font-bold text-gray-800 tracking-wider">Attendance Comparison Chart</h3>
              <select 
                value={trendView} 
                onChange={e => setTrendView(e.target.value)} 
                className="text-xs font-bold text-gray-600 bg-gray-50 border-none rounded-lg p-1 outline-none cursor-pointer"
              >
                <option value="student">Student Data</option>
                <option value="faculty">Faculty Data</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-4 mt-3 sm:mt-0">
              <div className="flex items-center space-x-3 text-sm font-medium text-gray-500">
                {['Daily', 'Weekly', 'Monthly'].map(scale => (
                  <label key={scale} className="flex items-center space-x-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name="timeScale" 
                      value={scale} 
                      checked={timeScale === scale}
                      onChange={(e) => setTimeScale(e.target.value)}
                      className={`w-3 h-3 ${trendView === 'student' ? 'text-rose-600 focus:ring-rose-500' : 'text-blue-600 focus:ring-blue-500'} border-gray-300`}
                    />
                    <span className={timeScale === scale ? (trendView === 'student' ? 'text-rose-600 font-bold' : 'text-blue-600 font-bold') : ''}>{scale}</span>
                  </label>
                ))}
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStudentPercentage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFacultyPercentage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 500}} 
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                  }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 500}} 
                  domain={[0, 100]} 
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'bold' }} 
                  formatter={(value) => [`${value}%`, 'Attendance']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                />
                <Area 
                  type="monotone" 
                  dataKey={trendView === 'student' ? 'percentage' : 'faculty_percentage'} 
                  stroke={trendView === 'student' ? '#e11d48' : '#3b82f6'} 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill={trendView === 'student' ? 'url(#colorStudentPercentage)' : 'url(#colorFacultyPercentage)'} 
                  activeDot={{r: 6, strokeWidth: 0, fill: trendView === 'student' ? '#be123c' : '#2563eb'}}
                  dot={{r: 4, fill: '#fff', stroke: trendView === 'student' ? '#e11d48' : '#3b82f6', strokeWidth: 2}}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section Comparison & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Section Comparison</h3>
            <select value={sectionYear} onChange={e => setSectionYear(Number(e.target.value))} className="text-xs font-bold text-gray-600 bg-gray-50 border-none rounded-lg p-1 outline-none cursor-pointer">
              <option value={2}>2nd Year</option>
              <option value={3}>3rd Year</option>
              <option value={4}>4th Year</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={section_comparison.filter(s => s.year === sectionYear)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis dataKey="section_name" type="category" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12, fontWeight: 600}} />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="percentage" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Attendance Risk Analysis</h3>
            <select value={riskYear} onChange={e => setRiskYear(Number(e.target.value))} className="text-xs font-bold text-gray-600 bg-gray-50 border-none rounded-lg p-1 outline-none cursor-pointer">
              <option value={2}>2nd Year</option>
              <option value={3}>3rd Year</option>
              <option value={4}>4th Year</option>
            </select>
          </div>
          
          <div className="space-y-6 mt-8">
            {(() => {
              const currentRisk = risk_distribution.find(r => r.year === riskYear) || risk_distribution[0];
              const total = currentRisk.safe + currentRisk.warning + currentRisk.critical;
              const getWidth = (val) => `${total > 0 ? (val/total)*100 : 0}%`;
              return (
                <>
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-emerald-600 flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> Safe (&gt;85%)</span>
                      <span>{currentRisk.safe} Students</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className="bg-emerald-500 h-3 rounded-full" style={{width: getWidth(currentRisk.safe)}}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-amber-600 flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> Warning (75-85%)</span>
                      <span>{currentRisk.warning} Students</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className="bg-amber-500 h-3 rounded-full" style={{width: getWidth(currentRisk.warning)}}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-rose-600 flex items-center"><ShieldAlert className="w-4 h-4 mr-1"/> Critical (&lt;75%)</span>
                      <span>{currentRisk.critical} Students</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className="bg-rose-500 h-3 rounded-full" style={{width: getWidth(currentRisk.critical)}}></div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Heatmap & Faculty Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:break-before-page">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Period-wise Heatmap (Absentees)</h3>
          <div className="grid grid-cols-8 gap-2 text-center text-xs font-bold text-gray-400 mb-2">
            <div></div>
            <div>P1</div><div>P2</div><div>P3</div><div>P4</div><div>P5</div><div>P6</div><div>P7</div>
          </div>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
            <div key={day} className="grid grid-cols-8 gap-2 mb-2 items-center">
              <div className="text-xs font-bold text-gray-500">{day.slice(0,3)}</div>
              {[1,2,3,4,5,6,7].map(p => {
                const heat = heatmap.find(h => h.day === day && h.period === p);
                const count = heat ? heat.absent_count : 0;
                let bg = 'bg-gray-50';
                if (count > 10) bg = 'bg-rose-500 text-white';
                else if (count > 5) bg = 'bg-rose-300 text-white';
                else if (count > 0) bg = 'bg-rose-100 text-rose-800';
                
                return (
                  <div key={p} className={`h-8 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${bg}`}>
                    {count > 0 ? count : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Faculty Attendance Analysis</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="py-2 font-bold">Faculty Name</th>
                <th className="py-2 font-bold">Classes</th>
                <th className="py-2 font-bold">Avg Att. %</th>
              </tr>
            </thead>
            <tbody>
              {faculty_stats.map((f, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-3 font-semibold text-gray-900">{f.faculty_name}</td>
                  <td className="py-3 text-gray-600">{f.classes_handled}</td>
                  <td className="py-3 font-bold text-emerald-600">{f.avg_student_attendance}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:break-before-page">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Detailed Student Records</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={tableYearFilter} onChange={e => setTableYearFilter(e.target.value)} className="text-xs font-bold text-gray-600 bg-gray-50 border-none rounded-lg p-2 outline-none cursor-pointer">
              <option value="All">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
            <select value={tableSectionFilter} onChange={e => setTableSectionFilter(e.target.value)} className="text-xs font-bold text-gray-600 bg-gray-50 border-none rounded-lg p-2 outline-none cursor-pointer">
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
            <select value={tableAttendanceFilter} onChange={e => setTableAttendanceFilter(e.target.value)} className="text-xs font-bold text-gray-600 bg-gray-50 border-none rounded-lg p-2 outline-none cursor-pointer">
              <option value="All">All Attendance</option>
              <option value="<75">Below 75%</option>
              <option value="<50">Below 50%</option>
            </select>
            <button 
              onClick={() => setShowReportModal(true)} 
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all font-bold text-xs shadow-md shadow-purple-500/25"
            >
              <Download className="w-3.5 h-3.5" /> Generate Report
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="py-3 px-4 font-bold rounded-l-lg">Reg No</th>
                <th className="py-3 px-4 font-bold">Name</th>
                <th className="py-3 px-4 font-bold">Section</th>
                <th className="py-3 px-4 font-bold">Present</th>
                <th className="py-3 px-4 font-bold">Absent</th>
                <th className="py-3 px-4 font-bold">Percentage</th>
                <th className="py-3 px-4 font-bold rounded-r-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudentTable.map((s, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4 text-gray-600 font-medium">{s.register_number}</td>
                  <td className="py-3 px-4 text-gray-900 font-bold">{s.name}</td>
                  <td className="py-3 px-4 text-gray-600">{s.section}</td>
                  <td className="py-3 px-4 text-gray-600">{s.total_present}</td>
                  <td className="py-3 px-4 text-rose-600 font-medium">{s.total_absent}</td>
                  <td className="py-3 px-4 font-black">{s.percentage}%</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      s.status === 'Safe' ? 'bg-emerald-100 text-emerald-700' :
                      s.status === 'Warning' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
