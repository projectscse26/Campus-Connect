import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, Users, UserX, UserCheck, TrendingUp, TrendingDown,
  Download, Printer, AlertTriangle, CheckCircle, ShieldAlert, SlidersHorizontal
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export const AdvancedAttendanceMonitor = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [academicYear, setAcademicYear] = useState('2023-2024');
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
  }, [academicYear, semester, section, date, timeScale]);

  // Auto-adjust date when academic year changes
  useEffect(() => {
    if (academicYear) {
      const startYear = parseInt(academicYear.split('-')[0]);
      const currentYear = new Date(date).getFullYear();
      if (currentYear !== startYear && currentYear !== startYear + 1) {
        // Automatically jump to Sept 1st of the selected academic year
        setDate(`${startYear}-09-01`);
      }
    }
  }, [academicYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (academicYear) params.append('academic_year', academicYear);
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

  const handleExportCSV = () => {
    if (!data?.student_table) return;
    const headers = ['Register Number', 'Name', 'Section', 'Total Present', 'Total Absent', 'Percentage', 'Status'];
    const rows = data.student_table.map(s => [
      s.register_number, s.name, s.section, s.total_present, s.total_absent, s.percentage, s.status
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_Report_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
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
        <div className="flex space-x-3 print:hidden">
          <button onClick={handleExportCSV} className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium text-sm">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </button>
          <button onClick={handlePrintPDF} className="flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors font-medium text-sm">
            <Printer className="w-4 h-4 mr-2" /> Print PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center">
            <span className="text-xs font-bold text-gray-500 ml-2 mr-2">DATE</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium" />
        </div>
        <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center">
            <span className="text-xs font-bold text-gray-500 ml-2 mr-2">ACADEMIC YR</span>
            <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium">
              <option>2023-2024</option>
              <option>2024-2025</option>
            </select>
        </div>
      </div>

      {/* Smart Insights */}
      {insights && insights.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 print:hidden">
          <h3 className="text-rose-800 font-bold flex items-center mb-2">
            <Activity className="w-5 h-5 mr-2" /> Smart Attendance Insights
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-rose-700 font-medium">
            {insights.map((insight, idx) => <li key={idx}>{insight}</li>)}
          </ul>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Student Avg %", value: overview.student_attendance_percentage + "%", icon: Users, trend: overview.trend_indicator },
          { title: "Students Present", value: overview.students_present, icon: UserCheck, trend: 'stable' },
          { title: "Faculty Avg %", value: overview.faculty_attendance_percentage + "%", icon: Users, trend: 'stable' },
          { title: "Faculty Present", value: overview.faculty_present, icon: UserCheck, trend: 'stable' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{stat.value}</h3>
              </div>
              <div className={`p-2 rounded-xl ${stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                <stat.icon className="w-5 h-5" />
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
          <div className="flex flex-wrap gap-2">
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
