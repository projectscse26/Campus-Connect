/**
 * Campus Connect ERP — Student Portal API Service
 *
 * Centralised Axios wrapper for all student-portal read-only endpoints.
 * Axios base URL and default auth headers are already set globally in AuthContext.
 */

import axios from 'axios';

const BASE = '/api/student-portal';

const StudentCourseService = {
  /** Fetch the logged-in student's own profile */
  getMyProfile: () => axios.get(`${BASE}/me`).then(r => r.data),

  /** Fetch courses enrolled by the student for their current semester */
  getMyCourses: () => axios.get(`${BASE}/courses`).then(r => r.data),

  /** Fetch LMS resources (notes, references, videos) for a course */
  getCourseResources: (courseId) =>
    axios.get(`${BASE}/courses/${courseId}/resources`).then(r => r.data),

  /** Fetch assignments posted for a course */
  getCourseAssignments: (courseId) =>
    axios.get(`${BASE}/courses/${courseId}/assignments`).then(r => r.data),

  /** Fetch announcements posted for a course */
  getCourseAnnouncements: (courseId) =>
    axios.get(`${BASE}/courses/${courseId}/announcements`).then(r => r.data),

  /** Fetch syllabus items for a course */
  getCourseSyllabus: (courseId) =>
    axios.get(`${BASE}/courses/${courseId}/syllabus`).then(r => r.data),

  /** Fetch attendance history + summary for a course */
  getCourseAttendance: (courseId) =>
    axios.get(`${BASE}/courses/${courseId}/attendance`).then(r => r.data),
};

export default StudentCourseService;
