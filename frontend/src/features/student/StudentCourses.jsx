import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StudentCourseService from './StudentCourseService';
import {
  BookOpen,
  User,
  Hash,
  GraduationCap,
  Building2,
  ChevronRight,
  Loader2,
  AlertCircle,
  BookMarked,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// Course Type Badge
// ─────────────────────────────────────────────────────────
const COURSE_TYPE_STYLES = {
  theory:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   label: 'Theory'   },
  lab:      { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200',label: 'Lab'      },
  elective: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Elective' },
  project:  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  label: 'Project'  },
};

const CourseTypeBadge = ({ type }) => {
  const style = COURSE_TYPE_STYLES[type] || COURSE_TYPE_STYLES.theory;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${style.bg} ${style.text} ${style.border}`}
    >
      {style.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────
// Individual Course Card
// ─────────────────────────────────────────────────────────
const CourseCard = ({ course, onClick }) => {
  return (
    <div
      onClick={() => onClick(course)}
      className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-primary-100 transition-all cursor-pointer active:scale-[0.99] flex flex-col justify-between h-full"
    >
      <div className="h-1 bg-gradient-to-r from-primary-500 to-indigo-500 w-full" />
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Row */}
          <div className="flex justify-between items-center gap-2 mb-3">
            <span className="bg-primary-50 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
              {course.code}
            </span>
            {course.semester && (
              <span className="text-[11px] font-bold text-gray-400 bg-gray-50 border border-gray-150 px-2 py-0.5 rounded-md">
                Sem {course.semester}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-3 group-hover:text-primary-700 transition-colors">
            {course.name}
          </h3>

          {/* Meta Info */}
          <div className="space-y-2 mb-4">
            {course.faculty_name && (
              <div className="flex items-center text-[13px] text-gray-500">
                <User className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-400 mr-1">Faculty:</span>
                <span className="text-gray-700 font-semibold truncate">{course.faculty_name}</span>
              </div>
            )}
            {course.department && (
              <div className="flex items-center text-[13px] text-gray-500">
                <Building2 className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-400 mr-1">Dept:</span>
                <span className="text-gray-700 truncate">{course.department}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <CourseTypeBadge type={course.course_type} />
          <span className="text-xs font-bold text-gray-400">
            {course.credits} {course.credits === 1 ? 'Credit' : 'Credits'}
          </span>
    </div>
    </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────
const EmptyState = ({ semester }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
      <BookMarked className="w-9 h-9 text-gray-300" strokeWidth={1.5} />
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">No Courses Found</h3>
    <p className="text-[14px] text-gray-500 max-w-sm leading-relaxed">
      {semester
        ? `No courses are assigned to you for Semester ${semester} yet.`
        : 'No enrolled courses found for your current semester.'}
      <br />
      Please contact your academic coordinator.
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────
// Loading Skeleton
// ─────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="h-1.5 bg-gray-200 w-full" />
    <div className="p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
        <div className="h-5 bg-gray-200 rounded-full w-16" />
        <div className="h-4 bg-gray-100 rounded w-14" />
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────
const StudentCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileData, coursesData] = await Promise.all([
          StudentCourseService.getMyProfile(),
          StudentCourseService.getMyCourses(),
        ]);
        setProfile(profileData);
        setCourses(coursesData);
      } catch (err) {
        console.error('Failed to load courses:', err);
        setError(err.response?.data?.detail || 'Failed to load your courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCourseClick = (course) => {
    navigate(`/student/courses/${course.id}`, { state: { course } });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold text-gray-900 tracking-tight mb-1.5">
            My Courses
          </h1>
          <p className="text-[14px] sm:text-[15px] text-gray-500">
            {profile
              ? `Semester ${profile.current_semester} · ${profile.department?.name || ''} · Batch ${profile.batch}`
              : 'Your enrolled courses for the current semester'}
          </p>
        </div>

        {/* Course count badge */}
        {!loading && !error && (
          <div className="flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-xl border border-primary-100 self-start sm:self-auto">
            <BookOpen className="w-4 h-4" />
            <span className="text-[13px] font-bold">
              {courses.length} {courses.length === 1 ? 'Course' : 'Courses'}
            </span>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[14px]">Unable to load courses</p>
            <p className="text-[13px] mt-1 text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Loading skeleton grid */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Courses grid */}
      {!loading && !error && courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={handleCourseClick}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && courses.length === 0 && (
        <EmptyState semester={profile?.current_semester} />
      )}
    </div>
  );
};

export default StudentCourses;
