import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Users, Edit3, TrendingUp, Clock, Bell, Calendar, AlertCircle, 
  Award, BarChart3, FileText, CheckCircle, AlertTriangle, Brain, ChevronRight,
  CalendarDays, GraduationCap, ClipboardCheck, Target, Sparkles, Zap, Plus, Trash2, CheckCircle2, Circle, ListTodo, MapPin
} from 'lucide-react';
import axios from 'axios';

// Modern Robotic AI Assistant Avatar Component
const TeacherAvatar = ({ gender }) => {
  return (
    <div className="relative w-40 h-40">
      {/* Animated glowing rings background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full animate-pulse-glow"></div>
      <div className="absolute inset-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-spin-very-slow opacity-50"></div>
      
      {/* Avatar container */}
      <div className="absolute inset-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-full shadow-2xl overflow-visible flex items-center justify-center border-2 border-cyan-400/30">
        {/* Futuristic AI Robot */}
        <svg viewBox="0 0 200 200" className="w-full h-full animate-float">
          <defs>
            <linearGradient id="robotGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#60A5FA', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#06B6D4', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#0891B2', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="glowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#22D3EE', stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: '#06B6D4', stopOpacity: 0.4 }} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <radialGradient id="eyeGlow">
              <stop offset="0%" style={{ stopColor: '#22D3EE', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#06B6D4', stopOpacity: 0 }} />
            </radialGradient>
          </defs>
          
          {/* Robot Body */}
          <g>
            {/* Main Head - Rounded Rectangle */}
            <rect x="50" y="40" width="100" height="120" rx="20" fill="url(#robotGrad)" filter="url(#glow)" />
            
            {/* Top Antenna */}
            <circle cx="100" cy="30" r="8" fill="#22D3EE" className="animate-pulse-slow">
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <rect x="98" y="30" width="4" height="10" fill="#0891B2" />
            
            {/* Side Antennas */}
            <circle cx="45" cy="60" r="5" fill="#22D3EE" opacity="0.8" />
            <line x1="50" y1="60" x2="45" y2="60" stroke="#0891B2" strokeWidth="2" />
            <circle cx="155" cy="60" r="5" fill="#22D3EE" opacity="0.8" />
            <line x1="150" y1="60" x2="155" y2="60" stroke="#0891B2" strokeWidth="2" />
            
            {/* Face Screen/Visor - Glowing */}
            <rect x="60" y="55" width="80" height="50" rx="10" fill="url(#screenGrad)" opacity="0.9" />
            <rect x="62" y="57" width="76" height="46" rx="8" fill="#001F3F" opacity="0.7" />
            
            {/* Digital Eyes - Animated */}
            <g className="animate-blink">
              <ellipse cx="85" cy="75" rx="10" ry="12" fill="url(#eyeGlow)" />
              <ellipse cx="85" cy="75" rx="6" ry="8" fill="#22D3EE" />
              <circle cx="85" cy="73" r="3" fill="#FFFFFF" />
              
              <ellipse cx="115" cy="75" rx="10" ry="12" fill="url(#eyeGlow)" />
              <ellipse cx="115" cy="75" rx="6" ry="8" fill="#22D3EE" />
              <circle cx="115" cy="73" r="3" fill="#FFFFFF" />
            </g>
            
            {/* Digital Mouth - Wave Pattern */}
            <path d="M 75 92 Q 100 98, 125 92" 
                  stroke="#22D3EE" 
                  strokeWidth="3" 
                  fill="none" 
                  strokeLinecap="round"
                  className="animate-pulse-slow" />
            
            {/* Scan Lines */}
            <line x1="65" y1="65" x2="135" y2="65" stroke="#22D3EE" strokeWidth="0.5" opacity="0.3" />
            <line x1="65" y1="75" x2="135" y2="75" stroke="#22D3EE" strokeWidth="0.5" opacity="0.3" />
            <line x1="65" y1="85" x2="135" y2="85" stroke="#22D3EE" strokeWidth="0.5" opacity="0.3" />
            <line x1="65" y1="95" x2="135" y2="95" stroke="#22D3EE" strokeWidth="0.5" opacity="0.3" />
            
            {/* Neck/Connector */}
            <rect x="85" y="160" width="30" height="15" rx="5" fill="#1E3A8A" />
            <rect x="88" y="162" width="24" height="11" rx="3" fill="#3B82F6" />
            
            {/* Chest Panel */}
            <rect x="60" y="175" width="80" height="20" rx="5" fill="#1E3A8A" />
            
            {/* Status Lights */}
            <circle cx="75" cy="185" r="3" fill="#22D3EE" className="animate-pulse">
              <animate attributeName="fill" values="#22D3EE;#06B6D4;#22D3EE" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="100" cy="185" r="3" fill="#10B981">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="125" cy="185" r="3" fill="#22D3EE" className="animate-pulse">
              <animate attributeName="fill" values="#22D3EE;#06B6D4;#22D3EE" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            
            {/* Shoulder Panels */}
            <rect x="40" y="120" width="20" height="35" rx="8" fill="#3B82F6" opacity="0.8" />
            <rect x="140" y="120" width="20" height="35" rx="8" fill="#3B82F6" opacity="0.8" />
            
            {/* Arms with Joints */}
            <g className="animate-wave">
              <rect x="35" y="155" width="15" height="25" rx="7" fill="#2563EB" />
              <circle cx="42" cy="165" r="5" fill="#1E3A8A" />
            </g>
            <rect x="150" y="155" width="15" height="25" rx="7" fill="#2563EB" />
            <circle cx="157" cy="165" r="5" fill="#1E3A8A" />
            
            {/* Decorative Circuit Lines */}
            <path d="M 70 130 L 75 135 L 80 130" stroke="#22D3EE" strokeWidth="1.5" fill="none" opacity="0.5" />
            <path d="M 120 130 L 125 135 L 130 130" stroke="#22D3EE" strokeWidth="1.5" fill="none" opacity="0.5" />
            
            {/* Data Visualization on Screen */}
            <g opacity="0.6" className="animate-pulse-slow">
              <rect x="70" y="110" width="15" height="3" rx="1" fill="#22D3EE" />
              <rect x="70" y="115" width="20" height="3" rx="1" fill="#22D3EE" />
              <rect x="70" y="120" width="12" height="3" rx="1" fill="#22D3EE" />
              
              <rect x="115" y="110" width="15" height="3" rx="1" fill="#22D3EE" />
              <rect x="110" y="115" width="20" height="3" rx="1" fill="#22D3EE" />
              <rect x="118" y="120" width="12" height="3" rx="1" fill="#22D3EE" />
            </g>
            
            {/* AI Symbol on Chest */}
            <text x="100" y="188" fontSize="8" fill="#22D3EE" textAnchor="middle" fontWeight="bold" fontFamily="monospace">AI</text>
          </g>
        </svg>
      </div>
      
      {/* Futuristic particle effects */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
      <div className="absolute bottom-5 left-2 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
      <div className="absolute top-10 left-0 w-2 h-2 bg-purple-400 rounded-full animate-ping-slow"></div>
      <div className="absolute bottom-2 right-5 w-3 h-3 bg-cyan-300 rounded-full animate-pulse"></div>
      
      {/* Holographic rings */}
      <div className="absolute -inset-2 border-2 border-cyan-400/20 rounded-full animate-ping-slow"></div>
      <div className="absolute -inset-4 border border-blue-400/10 rounded-full animate-spin-very-slow"></div>
    </div>
  );
};

// Notification Card Component with Badge
const NotificationCard = ({ title, count, icon: Icon, colorClass, bgColorClass, href, onClick }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) onClick();
    if (href) navigate(href);
  };

  return (
    <div 
      onClick={handleClick}
      className={`relative bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg cursor-pointer animate-fade-in group`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl ${bgColorClass} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon className={`w-6 h-6 ${colorClass}`} strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">Click to view</p>
          </div>
        </div>
        {count > 0 && (
          <div className="relative">
            <span className="absolute -top-1 -right-1 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 items-center justify-center">
                <span className="text-white text-xs font-bold">{count}</span>
              </span>
            </span>
          </div>
        )}
      </div>
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, colorClass, bgColorClass, loading, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg animate-fade-in ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
        <p className="text-3xl font-extrabold text-gray-900 leading-none">
          {loading ? (
            <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded"></span>
          ) : (
            <span>{value}</span>
          )}
        </p>
      </div>
      <div className={`w-14 h-14 rounded-xl ${bgColorClass} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-7 h-7 ${colorClass}`} strokeWidth={2} />
      </div>
    </div>
  </div>
);

const QuickAccessCard = ({ title, icon: Icon, colorClass, bgColorClass, href }) => (
  <a 
    href={href}
    className={`block p-4 rounded-xl ${bgColorClass} dark:bg-none dark:bg-white border border-gray-200 dark:border-gray-100 hover:shadow-lg hover:scale-105 transition-all duration-300 group`}
  >
    <div className="flex items-center space-x-3">
      <div className={`w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${colorClass}`} strokeWidth={2} />
      </div>
      <span className="text-sm font-bold text-gray-900 group-hover:translate-x-1 transition-transform">{title}</span>
    </div>
  </a>
);

// AI Insights Detailed Modal Component
const AIInsightsModal = ({ students, courseName, onClose, onDownloadReport }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="bg-white dark:bg-gray-50 border-b border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-gray-100 flex items-center justify-center">
                <Brain className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI Academic Insights</h2>
                <p className="text-sm text-gray-500 mt-1">{courseName} • Detailed Student Analysis</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all flex items-center justify-center"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
          {students && students.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {students.map((student, idx) => (
                <StudentDetailedCard 
                  key={idx} 
                  student={student} 
                  index={idx}
                  onDownloadReport={onDownloadReport}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">All Students Performing Well!</h3>
              <p className="text-gray-600">No students currently require immediate attention.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{students?.length || 0}</span> students analyzed using AI algorithms
          </p>
          <button 
            onClick={onClose}
            className="bg-purple-600 dark:bg-purple-500 text-white dark:text-gray-950 font-bold px-6 py-2.5 rounded-xl hover:shadow-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// Detailed Student Card Component for Modal
const StudentDetailedCard = ({ student, index, onDownloadReport }) => {
  const riskColors = {
    high: { 
      bg: 'bg-red-50 dark:bg-gray-50', 
      border: 'border-red-200 dark:border-gray-200', 
      badge: 'bg-red-100 text-red-700 dark:bg-gray-100 dark:text-red-400', 
      text: 'text-red-900 dark:text-red-400',
      icon: '🚨',
      chart: 'bg-red-500 dark:bg-red-400'
    },
    medium: { 
      bg: 'bg-amber-50 dark:bg-gray-50', 
      border: 'border-amber-200 dark:border-gray-200', 
      badge: 'bg-amber-100 text-amber-700 dark:bg-gray-100 dark:text-amber-400', 
      text: 'text-amber-900 dark:text-amber-400',
      icon: '⚠️',
      chart: 'bg-amber-500 dark:bg-amber-400'
    },
    low: { 
      bg: 'bg-blue-50 dark:bg-gray-50', 
      border: 'border-blue-200 dark:border-gray-200', 
      badge: 'bg-blue-100 text-blue-700 dark:bg-gray-100 dark:text-blue-400', 
      text: 'text-blue-900 dark:text-blue-400',
      icon: 'ℹ️',
      chart: 'bg-blue-500 dark:bg-blue-400'
    }
  };
  
  const colors = riskColors[student.risk_level] || riskColors.low;
  
  return (
    <div 
      className={`${colors.bg} border-2 ${colors.border} rounded-2xl p-6 hover:shadow-lg transition-all animate-fade-in-up`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Student Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${colors.text}`}>{student.name}</h3>
            <p className="text-sm text-gray-600">{student.register_number}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`${colors.badge} text-xs font-bold px-3 py-1.5 rounded-full uppercase`}>
            {student.risk_level}
          </span>
          <span className="text-2xl">{colors.icon}</span>
        </div>
      </div>

      {/* Course Info */}
      <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
        <p className="text-xs text-gray-500 mb-1">Course</p>
        <p className="font-bold text-gray-900">{student.course}</p>
        <p className="text-sm text-gray-600">{student.course_code}</p>
      </div>

      {/* Risk Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-700">Risk Score</span>
          <span className={`text-lg font-extrabold ${colors.text}`}>{student.risk_score}/100</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colors.chart} rounded-full transition-all duration-1000`}
            style={{ width: `${student.risk_score}%` }}
          ></div>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Risk Factors
        </h4>
        <div className="space-y-2">
          {student.risk_factors && student.risk_factors.map((factor, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-sm">
              <span className={`${colors.text} font-bold`}>•</span>
              <span className="text-gray-700">{factor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestion */}
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
        <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
          <Target className="w-4 h-4 mr-2" />
          Recommended Action
        </h4>
        <p className={`text-sm font-medium ${colors.text}`}>{student.suggestion}</p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button className="bg-white border border-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-all text-sm flex items-center justify-center">
          <Users className="w-4 h-4 mr-2" />
          Contact
        </button>
        <button 
          onClick={() => onDownloadReport && onDownloadReport(student.student_id, student.name)}
          className={`${colors.badge} font-bold py-2.5 px-4 rounded-lg hover:opacity-90 transition-all text-sm flex items-center justify-center`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Full Report
        </button>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Smart Todo App Component
const TodoApp = () => {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('faculty_todos');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, text: 'Grade Submission Due (CS601 Mid-term)', completed: false, priority: 'high' },
      { id: 2, text: 'Mentee Meeting (Tomorrow, 3:00 PM)', completed: false, priority: 'medium' },
      { id: 3, text: 'Mark attendance for 2 classes', completed: false, priority: 'high' }
    ];
  });
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    localStorage.setItem('faculty_todos', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask.trim(), completed: false, priority: 'medium' }]);
    setNewTask('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <ListTodo className="w-5 h-5 text-amber-500 mr-2"/> My Tasks
          </h3>
          <p className="text-sm text-gray-500 mt-1">Manage your daily priorities</p>
        </div>
        <span className="bg-amber-50 text-amber-600 text-xs font-bold px-3 py-1 rounded-full">
          {tasks.filter(t => !t.completed).length} pending
        </span>
      </div>

      <form onSubmit={addTask} className="mb-4 relative">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
        />
        <button 
          type="submit"
          disabled={!newTask.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto custom-scrollbar-white space-y-2 pr-1 max-h-[300px]">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400 flex flex-col items-center">
            <CheckCircle className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">All caught up!</p>
          </div>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id} 
              className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${task.completed ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100 hover:border-amber-200 shadow-sm'}`}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`flex-shrink-0 transition-colors ${task.completed ? 'text-green-500' : 'text-gray-300 hover:text-amber-500'}`}
                >
                  {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <span className={`text-sm truncate transition-all ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
                  {task.text}
                </span>
              </div>
              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-gray-300 hover:text-red-500 transition-all p-1.5 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCourseId, setSelectedCourseId] = useState(null); // This will now be assignment ID
  const [showAIInsightsModal, setShowAIInsightsModal] = useState(false);
  
  // Notification counts state
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState(0);
  const [pendingGatePassRequests, setPendingGatePassRequests] = useState(0);
  const [pendingLateEntries, setPendingLateEntries] = useState(0);

  // Function to download student report as PDF
  const downloadStudentReport = async (studentId, studentName) => {
    try {
      // Fetch report data from backend
      const response = await axios.get(`/api/faculty/student-report/${studentId}`);
      const reportData = response.data;
      
      // Generate PDF using jsPDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(79, 70, 229); // Indigo
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('Student Academic Report', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${reportData.report_generated_at}`, 105, 30, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      let yPos = 50;
      
      // Student Information
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Student Information', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Name: ${reportData.student.name}`, 20, yPos);
      yPos += 7;
      doc.text(`Register Number: ${reportData.student.register_number}`, 20, yPos);
      yPos += 7;
      doc.text(`Email: ${reportData.student.email}`, 20, yPos);
      yPos += 7;
      doc.text(`Department: ${reportData.student.department}`, 20, yPos);
      yPos += 7;
      doc.text(`Section: ${reportData.student.section}`, 20, yPos);
      yPos += 7;
      doc.text(`Batch: ${reportData.student.batch}`, 20, yPos);
      yPos += 15;
      
      // Attendance Summary
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Attendance Summary', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Classes: ${reportData.attendance_summary.total_classes}`, 20, yPos);
      yPos += 7;
      doc.text(`Present: ${reportData.attendance_summary.present}`, 20, yPos);
      yPos += 7;
      doc.text(`Absent: ${reportData.attendance_summary.absent}`, 20, yPos);
      yPos += 7;
      
      // Attendance percentage with color
      const attPct = reportData.attendance_summary.percentage;
      if (attPct < 50) {
        doc.setTextColor(220, 38, 38); // Red
      } else if (attPct < 75) {
        doc.setTextColor(234, 179, 8); // Yellow
      } else {
        doc.setTextColor(34, 197, 94); // Green
      }
      doc.setFont(undefined, 'bold');
      doc.text(`Attendance Percentage: ${attPct}%`, 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 15;
      
      // Academic Performance
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Academic Performance', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Subjects: ${reportData.academic_performance.total_subjects}`, 20, yPos);
      yPos += 7;
      doc.text(`Average Percentage: ${reportData.academic_performance.average_percentage}%`, 20, yPos);
      yPos += 7;
      doc.text(`Failing Count: ${reportData.academic_performance.failing_count}`, 20, yPos);
      yPos += 15;
      
      // Grade Details Table
      if (reportData.academic_performance.grade_details.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Subject-wise Performance', 20, yPos);
        yPos += 10;
        
        // Table headers
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Course', 20, yPos);
        doc.text('Marks', 80, yPos);
        doc.text('%', 120, yPos);
        doc.text('Status', 150, yPos);
        yPos += 7;
        
        // Table rows
        doc.setFont(undefined, 'normal');
        reportData.academic_performance.grade_details.forEach(grade => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.text(grade.course_code, 20, yPos);
          doc.text(`${grade.marks_obtained}/${grade.max_marks}`, 80, yPos);
          doc.text(`${grade.percentage}%`, 120, yPos);
          doc.text(grade.status, 150, yPos);
          yPos += 7;
        });
        yPos += 10;
      }
      
      // Risk Analysis
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      
      // Risk level with color
      const riskLevel = reportData.risk_analysis.risk_level;
      if (riskLevel === 'high') {
        doc.setTextColor(220, 38, 38); // Red
      } else if (riskLevel === 'medium') {
        doc.setTextColor(234, 179, 8); // Yellow
      } else {
        doc.setTextColor(37, 99, 235); // Blue
      }
      doc.text(`Risk Analysis - ${riskLevel.toUpperCase()}`, 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Risk Score: ${reportData.risk_analysis.risk_score}/100`, 20, yPos);
      yPos += 10;
      
      if (reportData.risk_analysis.risk_factors.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.text('Risk Factors:', 20, yPos);
        yPos += 7;
        
        doc.setFont(undefined, 'normal');
        reportData.risk_analysis.risk_factors.forEach(factor => {
          doc.text(`• ${factor}`, 25, yPos);
          yPos += 7;
        });
        yPos += 5;
      }
      
      doc.setFont(undefined, 'bold');
      doc.text('Recommendation:', 20, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      const recommendation = doc.splitTextToSize(reportData.risk_analysis.recommendation, 170);
      doc.text(recommendation, 25, yPos);
      yPos += recommendation.length * 7 + 10;
      
      // Footer
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated by: ${reportData.generated_by.name} (${reportData.generated_by.employee_id})`, 20, yPos);
      yPos += 5;
      doc.text(`Designation: ${reportData.generated_by.designation}`, 20, yPos);
      
      // Save PDF
      const fileName = `${reportData.student.register_number}_Academic_Report.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        if (selectedCourseId) {
          params.append('assignment_id', selectedCourseId); // Now passing assignment_id
        }
        if (selectedDate) {
          // Format date as YYYY-MM-DD in local timezone (not UTC)
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const formattedDate = `${year}-${month}-${day}`;
          params.append('selected_date', formattedDate);
        }
        
        const url = `/api/faculty/me/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await axios.get(url);
        setDashboardData(response.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [selectedCourseId, selectedDate]);

  // Fetch notification counts
  useEffect(() => {
    const fetchNotificationCounts = async () => {
      try {
        // Fetch leave requests count (Student Leaves)
        const leaveRes = await axios.get('/api/student-portal/leave/mentor-queue');
        const pendingLeaves = leaveRes.data.filter(req => 
          req.status === 'pending_mentor' || req.status === 'pending_class_advisor'
        );
        setPendingLeaveRequests(pendingLeaves.length);

        // Fetch gate pass requests count (for mentors)
        const gatePassRes = await axios.get('/api/gatepass/mentor');
        const pendingGatePasses = gatePassRes.data.filter(gp => 
          gp.status === 'pending_mentor' || gp.status === 'pending_class_advisor'
        );
        setPendingGatePassRequests(pendingGatePasses.length);

        // Fetch late entry notifications count (for mentors)
        const lateEntryRes = await axios.get('/api/late-entry/my-mentees');
        const unseenLateEntries = lateEntryRes.data.filter(entry => 
          !entry.mentor_acknowledged
        );
        setPendingLateEntries(unseenLateEntries.length);
      } catch (err) {
        console.error('Failed to load notification counts:', err);
        // Set counts to 0 on error to avoid showing undefined
        setPendingLeaveRequests(0);
        setPendingGatePassRequests(0);
        setPendingLateEntries(0);
      }
    };

    fetchNotificationCounts();
    
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchNotificationCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  // Get proper name prefix and greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    const icon = hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌙';
    
    const profile = dashboardData?.faculty_profile;
    const title = profile?.title || '';  // Use title only if it exists
    const name = profile?.name || user?.name || user?.email?.split('@')[0] || 'Faculty';
    const gender = profile?.gender || 'male';
    
    // Only add title if it exists, otherwise just use name
    const fullName = title ? `${title} ${name}` : name;
    
    return { greeting, icon, fullName, gender };
  };

  const { greeting, icon, fullName, gender } = getGreeting();

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in-up pb-8 px-2 sm:px-0">
      {/* Minimalistic Professional Welcome Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <span className="text-base sm:text-lg">{icon}</span>
              <span className="text-xs sm:text-sm font-medium text-gray-500">{greeting}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{fullName}</h1>
            <div className="flex items-center space-x-2 mt-1 text-xs sm:text-sm text-gray-600">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span className="sm:hidden">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
        
        {/* Course Selector */}
        {dashboardData?.all_courses && dashboardData.all_courses.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Course Filter
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="flex-1 relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={selectedCourseId || ''}
                  onChange={(e) => setSelectedCourseId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer appearance-none"
                >
                  <option value="">All Courses - Overview</option>
                  {dashboardData.all_courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_code} - {course.course_name} ({course.section})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {selectedCourseId && (
                <button
                  onClick={() => setSelectedCourseId(null)}
                  className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center space-x-1"
                  title="Clear filter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats - Moved below welcome card */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-fade-in">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-none dark:bg-white rounded-xl px-3 sm:px-6 py-3 sm:py-4 border border-blue-200 dark:border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="p-2 sm:p-3 bg-white rounded-lg">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600 dark:text-gray-500 font-semibold uppercase tracking-wide">Courses</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-gray-900">{dashboardData?.assigned_courses || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:bg-none dark:bg-white rounded-xl px-3 sm:px-6 py-3 sm:py-4 border border-emerald-200 dark:border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="p-2 sm:p-3 bg-white rounded-lg">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 dark:text-gray-500 font-semibold uppercase tracking-wide">Students</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-gray-900">{dashboardData?.total_students || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Requests Notifications */}
      {user?.is_mentor && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center px-1">
            <Bell className="w-5 h-5 text-blue-600 mr-2" />
            Mentee Requests
            <span className="ml-2 text-xs font-normal text-gray-500">(Requires Your Approval)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NotificationCard
              title="Student Leave Requests"
              count={pendingLeaveRequests}
              icon={Calendar}
              colorClass="text-blue-600"
              bgColorClass="bg-blue-50"
              href="/faculty/mentorship"
            />
            <NotificationCard
              title="Gate Pass Requests"
              count={pendingGatePassRequests}
              icon={MapPin}
              colorClass="text-emerald-600"
              bgColorClass="bg-emerald-50"
              href="/faculty/gatepass"
            />
            <NotificationCard
              title="Late Entry Notifications"
              count={pendingLateEntries}
              icon={Clock}
              colorClass="text-amber-600"
              bgColorClass="bg-amber-50"
              href="/faculty/late-entry"
            />
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Left Sidebar - Quick Access */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* Quick Access Controls */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fade-in">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2"/> Quick Access
            </h3>
            <div className="space-y-3">
              <QuickAccessCard 
                title="My Courses"
                icon={BookOpen}
                colorClass="text-blue-600"
                bgColorClass="bg-gradient-to-r from-blue-50 to-blue-100"
                href="/faculty/courses"
              />
              <QuickAccessCard 
                title="Leave Request"
                icon={FileText}
                colorClass="text-green-600"
                bgColorClass="bg-gradient-to-r from-green-50 to-green-100"
                href="/faculty/leave"
              />
              <QuickAccessCard 
                title="Class Advisor"
                icon={Users}
                colorClass="text-purple-600"
                bgColorClass="bg-gradient-to-r from-purple-50 to-purple-100"
                href="/faculty/class-advisor"
              />
              <QuickAccessCard 
                title="Announcements"
                icon={Bell}
                colorClass="text-amber-600"
                bgColorClass="bg-gradient-to-r from-amber-50 to-amber-100"
                href="/faculty/announcements"
              />
              {user?.is_mentor && (
                <QuickAccessCard 
                  title="Mentorship"
                  icon={Users}
                  colorClass="text-emerald-600"
                  bgColorClass="bg-gradient-to-r from-emerald-50 to-emerald-100"
                  href="/faculty/mentorship"
                />
              )}
            </div>
          </div>

          {/* Mini Calendar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fade-in">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mr-2"/> Calendar
            </h3>
            <MiniCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
            {dashboardData?.selected_date_classes && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:bg-none dark:bg-white rounded-xl border border-blue-200 dark:border-gray-100">
                <p className="text-xs font-bold text-blue-900 dark:text-blue-500 mb-1">Classes on Selected Date</p>
                <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-500">
                  {dashboardData.selected_date_classes.length}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {/* Show message if no course selected */}
          {/* Always show today's schedule */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fade-in mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2"/> Today's Schedule
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboardData?.selected_date && new Date(dashboardData.selected_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {selectedCourseId && dashboardData?.all_courses && (
                    <span className="ml-2 text-blue-600 font-semibold">
                      • {dashboardData.all_courses.find(c => c.id === selectedCourseId)?.course_code}
                    </span>
                  )}
                </p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full whitespace-nowrap">
                {dashboardData?.selected_date_classes?.length || 0} Classes
              </span>
            </div>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : dashboardData?.selected_date_classes && dashboardData.selected_date_classes.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {dashboardData.selected_date_classes.map((classItem, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${
                      classItem.is_current 
                        ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 animate-pulse-border' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {classItem.is_current && (
                      <span className="inline-block text-xs font-bold text-blue-600 bg-white px-3 py-1 rounded-full mb-2 animate-pulse-slow">
                        ● Live Now
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">{classItem.course_name}</p>
                        <p className="text-xs text-gray-500 mt-1">{classItem.course_code} • {classItem.section}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                      <span className="flex items-center font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {classItem.start_time} - {classItem.end_time}
                      </span>
                      <span className="font-medium">{classItem.room}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">No classes on this date</p>
              </div>
            )}
          </div>

          {/* Smart Todo App */}
          <div className="mb-4 sm:mb-6">
            <TodoApp />
          </div>

          {/* Course-specific content */}
          {!selectedCourseId ? null : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard 
              title="Active Courses" 
              value={dashboardData?.assigned_courses || 0}
              icon={BookOpen} 
              colorClass="text-blue-600" 
              bgColorClass="bg-blue-50" 
              loading={loading}
            />
            <KPICard 
              title="Total Students" 
              value={dashboardData?.total_students || 0}
              icon={Users} 
              colorClass="text-emerald-600" 
              bgColorClass="bg-emerald-50" 
              loading={loading}
            />
            <KPICard 
              title="Pending Tasks" 
              value={dashboardData?.pending_evaluations || 0}
              icon={ClipboardCheck} 
              colorClass="text-amber-600" 
              bgColorClass="bg-amber-50" 
              loading={loading}
            />
            <KPICard 
              title="Avg Performance" 
              value={`${dashboardData?.class_performance || 0}%`}
              icon={TrendingUp} 
              colorClass="text-purple-600" 
              bgColorClass="bg-purple-50" 
              loading={loading}
            />
          </div>

          </>
          )}
        </div>
      </div>

      {/* AI Insights Detailed Modal */}
      {showAIInsightsModal && (
        <AIInsightsModal 
          students={dashboardData?.at_risk_students || []}
          courseName={selectedCourseId && dashboardData?.all_courses 
            ? dashboardData.all_courses.find(c => c.id === selectedCourseId)?.course_name 
            : 'All Courses'}
          onClose={() => setShowAIInsightsModal(false)}
          onDownloadReport={downloadStudentReport}
        />
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes wave {
          0%, 100% {
            transform: rotate(-15deg);
          }
          50% {
            transform: rotate(-5deg);
          }
        }
        
        @keyframes bounce-slight {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-5px) rotate(5deg);
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
        }
        
        @keyframes spin-very-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        .animate-wave {
          animation: wave 2s ease-in-out infinite;
          transform-origin: center;
        }
        
        .animate-bounce-slight {
          animation: bounce-slight 2s ease-in-out infinite;
        }
        
        .animate-spin-very-slow {
          animation: spin-very-slow 20s linear infinite;
        }
        
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
        }
        
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -20px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(20px, 20px) scale(1.05);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes pulse-border {
          0%, 100% {
            border-color: rgb(147, 197, 253);
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
          50% {
            border-color: rgb(59, 130, 246);
            box-shadow: 0 0 15px 0 rgba(59, 130, 246, 0.4);
          }
        }
        
        @keyframes blink {
          0%, 90%, 100% {
            opacity: 1;
          }
          95% {
            opacity: 0;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.7s ease-out;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
        
        .animate-blink {
          animation: blink 4s ease-in-out infinite;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .custom-scrollbar-white::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar-white::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        
        .custom-scrollbar-white::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        
        .custom-scrollbar-white::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

// Bar Chart Component for Attendance Trajectory
const AttendanceBarChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-center py-12 text-gray-500">No data available</div>;

  // Use present count for the bars
  const maxValue = Math.max(...data.map(d => d.present || 0), 12); // Minimum scale of 12
  const chartHeight = 280;
  const barWidth = 100 / data.length;
  const padding = { top: 30, right: 30, bottom: 50, left: 50 };

  return (
    <div className="relative w-full bg-gray-50 rounded-xl p-6" style={{ minHeight: `${chartHeight + padding.top + padding.bottom}px` }}>
      <svg 
        className="w-full h-full" 
        viewBox={`0 0 100 ${chartHeight + padding.top + padding.bottom}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="1"/>
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="1"/>
          </linearGradient>
          <filter id="barShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15"/>
          </filter>
        </defs>
        
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Horizontal grid lines */}
          {[0, 3, 6, 9, 12].map(y => (
            <line
              key={y}
              x1="0"
              y1={chartHeight - (y / maxValue) * chartHeight}
              x2={100 - padding.left - padding.right}
              y2={chartHeight - (y / maxValue) * chartHeight}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}
          
          {/* Bars */}
          {data.map((d, i) => {
            const barHeight = ((d.present || 0) / maxValue) * chartHeight;
            const x = (i * barWidth) + (barWidth * 0.1);
            const width = barWidth * 0.8;
            
            return (
              <g key={i} className="animate-bar-grow" style={{ animationDelay: `${i * 30}ms` }}>
                <rect
                  x={x}
                  y={chartHeight - barHeight}
                  width={width}
                  height={barHeight}
                  fill="url(#barGradient)"
                  filter="url(#barShadow)"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  rx="2"
                >
                  <title>{`${d.date}: ${d.present} students present (${d.percentage?.toFixed(1) || 0}%)\nAbsent: ${d.absent || 0}\nTotal: ${d.total || 0}`}</title>
                </rect>
              </g>
            );
          })}
          
          {/* X-axis labels - show every nth label to avoid crowding */}
          {data.map((d, i) => {
            const showLabel = data.length <= 15 || i % Math.ceil(data.length / 15) === 0 || i === data.length - 1;
            if (!showLabel) return null;
            
            const x = (i * barWidth) + (barWidth * 0.5);
            return (
              <text
                key={i}
                x={x}
                y={chartHeight + 20}
                textAnchor="middle"
                fontSize="11"
                fill="#9CA3AF"
                fontWeight="400"
              >
                {d.date}
              </text>
            );
          })}
          
          {/* Y-axis labels */}
          {[0, 3, 6, 9, 12].map((val, i) => (
            <text
              key={i}
              x="-15"
              y={chartHeight - (val / maxValue) * chartHeight + 4}
              textAnchor="end"
              fontSize="12"
              fill="#9CA3AF"
              fontWeight="400"
            >
              {val}
            </text>
          ))}
        </g>
      </svg>
      
      <style>{`
        @keyframes bar-grow {
          from {
            transform: scaleY(0);
            transform-origin: bottom;
          }
          to {
            transform: scaleY(1);
            transform-origin: bottom;
          }
        }
        
        .animate-bar-grow {
          animation: bar-grow 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Continue with remaining components...

// AI Risk Card Component
const AIRiskCard = ({ student }) => {
  const riskColors = {
    high: { bg: 'bg-red-50 dark:bg-gray-50', border: 'border-red-200 dark:border-gray-200', badge: 'bg-red-100 text-red-700 dark:bg-gray-100 dark:text-red-400', icon: '🚨' },
    medium: { bg: 'bg-amber-50 dark:bg-gray-50', border: 'border-amber-200 dark:border-gray-200', badge: 'bg-amber-100 text-amber-700 dark:bg-gray-100 dark:text-amber-400', icon: '⚠️' },
    low: { bg: 'bg-blue-50 dark:bg-gray-50', border: 'border-blue-200 dark:border-gray-200', badge: 'bg-blue-100 text-blue-700 dark:bg-gray-100 dark:text-blue-400', icon: 'ℹ️' }
  };
  
  const colors = riskColors[student.risk_level];
  
  return (
    <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{colors.icon}</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">{student.name}</p>
            <p className="text-xs text-gray-500">{student.register_number}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${colors.badge}`}>
          {student.risk_level.toUpperCase()}
        </span>
      </div>
      <div className="space-y-1 mb-2">
        {student.risk_factors.map((factor, idx) => (
          <p key={idx} className="text-xs text-gray-600 flex items-start">
            <span className="mr-1 text-gray-400">•</span>
            {factor}
          </p>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200 dark:border-gray-100">
        <p className="text-xs font-medium text-gray-500">{student.course}</p>
        <button className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center">
          {student.suggestion}
          <ChevronRight className="w-3 h-3 ml-1" />
        </button>
      </div>
    </div>
  );
};

// Mini Calendar Component
const MiniCalendar = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  
  // Sync currentMonth with selectedDate when it changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);
  
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-9"></div>);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    const isToday = day === new Date().getDate() && 
                    currentMonth.getMonth() === new Date().getMonth() &&
                    currentMonth.getFullYear() === new Date().getFullYear();
    
    const isSelected = selectedDate && 
                       day === selectedDate.getDate() && 
                       currentMonth.getMonth() === selectedDate.getMonth() &&
                       currentMonth.getFullYear() === selectedDate.getFullYear();
    
    days.push(
      <button
        key={day}
        onClick={() => {
          onDateSelect(currentDate);
        }}
        className={`h-9 w-full rounded-lg text-sm font-medium transition-all ${
          isSelected
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold shadow-lg scale-110 ring-2 ring-blue-300' 
            : isToday 
            ? 'bg-blue-100 text-blue-700 font-bold border-2 border-blue-400' 
            : 'hover:bg-gray-100 text-gray-700 hover:scale-105'
        }`}
      >
        {day}
      </button>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ←
        </button>
        <span className="text-sm font-bold text-gray-900">
          {monthNames[currentMonth.getMonth()].substring(0, 3)} {currentMonth.getFullYear()}
        </span>
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          →
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs font-bold text-gray-500 h-6 flex items-center justify-center">{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
};

// Reminder Card Component
const ReminderCard = ({ icon: Icon, title, description, time, priority }) => {
  const priorityColors = {
    high: { border: 'border-red-200 dark:border-gray-200', bg: 'bg-red-50 dark:bg-gray-50', icon: 'text-red-600 dark:text-red-400', badge: 'bg-red-100 text-red-700 dark:bg-gray-100 dark:text-red-400' },
    medium: { border: 'border-yellow-200 dark:border-gray-200', bg: 'bg-yellow-50 dark:bg-gray-50', icon: 'text-yellow-600 dark:text-yellow-400', badge: 'bg-yellow-100 text-yellow-700 dark:bg-gray-100 dark:text-yellow-400' },
    low: { border: 'border-blue-200 dark:border-gray-200', bg: 'bg-blue-50 dark:bg-gray-50', icon: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-100 text-blue-700 dark:bg-gray-100 dark:text-blue-400' }
  };
  
  const colors = priorityColors[priority];
  
  return (
    <div className={`p-4 sm:p-5 rounded-xl border ${colors.border} ${colors.bg} hover:shadow-md transition-all sm:hover:scale-[1.02] cursor-pointer`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="flex items-center justify-between sm:block">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white dark:bg-gray-100 shadow-sm flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.icon}`} />
          </div>
          {/* Mobile badge (hidden on sm+) */}
          <div className="sm:hidden flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
              {time}
            </span>
            {priority === 'high' && <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm sm:text-base mb-1 truncate">{title}</p>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-2 line-clamp-2">{description}</p>
          {/* Desktop badge (hidden on mobile) */}
          <div className="hidden sm:flex items-center justify-between">
            <span className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full ${colors.badge}`}>
              {time}
            </span>
            {priority === 'high' && <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance Bar Component with Icons
const PerformanceBar = ({ label, sublabel, count, color, bgColor, icon }) => {
  const total = 100;
  const percentage = Math.min((count / Math.max(total, 1)) * 100, 100);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{icon}</span>
          <div>
            <span className="text-sm font-bold text-gray-900">{label}</span>
            <span className="text-xs text-gray-500 ml-2">{sublabel}</span>
          </div>
        </div>
        <span className="text-lg font-extrabold text-gray-900">{count}</span>
      </div>
      <div className={`h-3 ${bgColor} rounded-full overflow-hidden relative`}>
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
          style={{ width: `${count > 0 ? Math.max(percentage, 5) : 0}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};
