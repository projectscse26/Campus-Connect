import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FileText, BookOpen, Layers, Settings, Users, ArrowLeft, ClipboardList, Calendar } from 'lucide-react';

export const LMSDashboard = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [courseDetails, setCourseDetails] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await axios.get('/api/faculty/me/courses');
        setAllCourses(coursesRes.data);
        const currentCourse = coursesRes.data.find(c => c.id.toString() === assignmentId);
        if (currentCourse) setCourseDetails(currentCourse);
      } catch (err) {
        console.error("Failed to fetch LMS data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [assignmentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const features = [
    {
      title: 'Resources',
      description: 'Upload and manage course materials, slides, and reference links.',
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      hover: 'hover:border-blue-300 hover:shadow-blue-100',
      path: `/faculty/courses/${assignmentId}/lms/resources`
    },
    {
      title: 'Assignments',
      description: 'Create assignments, set due dates, and track student submissions.',
      icon: <BookOpen className="w-8 h-8 text-purple-600" />,
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      hover: 'hover:border-purple-300 hover:shadow-purple-100',
      path: `/faculty/courses/${assignmentId}/lms/assignments`
    },
    {
      title: 'Announcements',
      description: 'Broadcast important updates and notices to students in this course.',
      icon: <Layers className="w-8 h-8 text-red-600" />,
      bg: 'bg-red-50',
      border: 'border-red-100',
      hover: 'hover:border-red-300 hover:shadow-red-100',
      path: `/faculty/courses/${assignmentId}/lms/announcements`
    },
    {
      title: 'Syllabus',
      description: 'Define course outcomes, modules, and grading criteria.',
      icon: <Settings className="w-8 h-8 text-orange-600" />,
      bg: 'bg-orange-50',
      border: 'border-orange-100',
      hover: 'hover:border-orange-300 hover:shadow-orange-100',
      path: `/faculty/courses/${assignmentId}/lms/syllabus`
    },
    {
      title: 'Attendance',
      description: 'Mark daily student attendance for lecture and lab sessions.',
      icon: <Users className="w-8 h-8 text-green-600" />,
      bg: 'bg-green-50',
      border: 'border-green-100',
      hover: 'hover:border-green-300 hover:shadow-green-100',
      path: `/faculty/courses/${assignmentId}/lms/attendance`
    },
    {
      title: 'Att. History',
      description: 'View detailed attendance logs and export reports.',
      icon: <FileText className="w-8 h-8 text-indigo-600" />,
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      hover: 'hover:border-indigo-300 hover:shadow-indigo-100',
      path: `/faculty/courses/${assignmentId}/lms/attendance-history`
    },
    {
      title: 'Grade Book',
      description: 'Enter CIA, Model Exam, and Retest marks. Save drafts and publish to students.',
      icon: <ClipboardList className="w-8 h-8 text-teal-600" />,
      bg: 'bg-teal-50',
      border: 'border-teal-100',
      hover: 'hover:border-teal-300 hover:shadow-teal-100',
      path: `/faculty/courses/${assignmentId}/lms/gradebook`
    },
    {
      title: 'Timetable',
      description: 'View the scheduled days, periods, and room assignments for this course.',
      icon: <Calendar className="w-8 h-8 text-pink-600" />,
      bg: 'bg-pink-50',
      border: 'border-pink-100',
      hover: 'hover:border-pink-300 hover:shadow-pink-100',
      path: `/faculty/courses/${assignmentId}/lms/timetable`
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6 lg:p-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link 
              to="/faculty/courses" 
              className="text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back to My Courses
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Course Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Manage all aspects of your course from one place</p>
        </div>
        {allCourses.length > 0 && courseDetails && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm relative overflow-hidden transition-all hover:border-gray-300 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100">
            <select
              value={assignmentId}
              onChange={(e) => navigate(`/faculty/courses/${e.target.value}/lms`)}
              className="w-full h-full px-5 py-3 appearance-none font-bold text-gray-800 text-sm bg-transparent border-none focus:outline-none cursor-pointer pr-12"
            >
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course.code} - {c.course.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <Link
            key={idx}
            to={feature.path}
            className={`group flex flex-col bg-white border-2 ${feature.border} rounded-2xl p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg ${feature.hover} cursor-pointer relative overflow-hidden`}
          >
            {/* Background decorative blob */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 ${feature.bg} blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
            
            <div className={`w-14 h-14 rounded-xl ${feature.bg} border ${feature.border} flex items-center justify-center mb-5 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              {feature.icon}
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10 group-hover:text-gray-800 transition-colors">
              {feature.title}
            </h3>
            
            <p className="text-gray-500 text-sm font-medium leading-relaxed relative z-10">
              {feature.description}
            </p>
            
            <div className="mt-6 flex items-center text-sm font-bold text-gray-400 group-hover:text-gray-900 transition-colors relative z-10">
              Manage {feature.title} <ArrowLeft className="w-4 h-4 ml-1 rotate-180 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
