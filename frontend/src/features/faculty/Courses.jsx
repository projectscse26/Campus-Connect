import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Users, Clock, Layout } from 'lucide-react';

export const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/faculty/me/courses');
        setCourses(response.data);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setError("Failed to load your assigned courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">My Courses</h1>
          <p className="text-sm text-gray-500">View and manage the courses assigned to you for this semester.</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Courses Assigned</h3>
          <p className="text-gray-500 text-sm">You have not been assigned any courses yet. Please contact your HOD.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((assignment) => (
            <div
              key={assignment.id}
              onClick={() => navigate(`/faculty/courses/${assignment.id}/lms`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-primary-100 transition-all cursor-pointer active:scale-[0.99]"
            >
              <div className="h-2 bg-primary-600"></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary-50 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                    {assignment.course.code}
                  </div>
                  <div className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-md">
                    {assignment.academic_year} • Sem {assignment.semester}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                  {assignment.course.name}
                </h3>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Layout className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-900 mr-1">Section:</span>
                    {assignment.section ? `${assignment.section.year} Year ${assignment.section.name}` : "N/A"}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-900 mr-1">Credits:</span>
                    {assignment.course.credits}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-900 mr-1">Type:</span>
                    <span className="capitalize">{assignment.course.course_type}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
