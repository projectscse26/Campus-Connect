import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './features/auth/Login';
import { 
  AdminDashboard, 
  FacultyDashboard, 
  StudentDashboard, 
  AuthorityDashboard 
} from './features/dashboards/Dashboards';
import { Departments } from './features/admin/Departments';
import { Faculty } from './features/admin/Faculty';
import { Students } from './features/admin/Students';
import { Authorities } from './features/admin/Authorities';
import { Courses } from './features/admin/Courses';
import { HodDashboard } from './features/hod/HodDashboard';
import { FacultyList } from './features/hod/FacultyList';
import { StudentList } from './features/hod/StudentList';
import { Sections } from './features/hod/Sections';
import { FacultyAssignment } from './features/hod/FacultyAssignment';
import { MentorAssignment } from './features/hod/MentorAssignment';
import { Timetable } from './features/hod/Timetable';
import { Announcements } from './features/hod/Announcements';
import { AttendanceMonitor } from './features/hod/AttendanceMonitor';
import { ResultsMonitor } from './features/hod/ResultsMonitor';
import { Reports } from './features/hod/Reports';
import { Discipline as AdminDiscipline } from './features/admin/Discipline';
import { Discipline as HodDiscipline } from './features/hod/Discipline';
import { Discipline as AuthorityDiscipline } from './features/authority/Discipline';
import { Discipline as FacultyDiscipline } from './features/faculty/Discipline';
import { Courses as FacultyCourses } from './features/faculty/Courses';
import { LMSManager } from './features/faculty/LMSManager';
import { Discipline as StudentDiscipline } from './features/student/Discipline';
import { LateTrackerDashboard } from './features/latetracker/Dashboard';
import { LateManagement } from './features/hod/LateManagement';
import { LeaveRequests } from './features/faculty/LeaveRequests';
import { LeaveApply } from './features/faculty/LeaveApply';
import { LeaveDetails } from './features/faculty/LeaveDetails';
import { SubstituteApprovals } from './features/faculty/SubstituteApprovals';
import { CADashboard } from './features/faculty/classadvisor/CADashboard';
import { CAStudentList } from './features/faculty/classadvisor/CAStudentList';
import { CAStudentProfile } from './features/faculty/classadvisor/CAStudentProfile';
import { CADailyAttendance } from './features/faculty/classadvisor/CADailyAttendance';
import { CAAttendanceSummary } from './features/faculty/classadvisor/CAAttendanceSummary';
import { CATimetable } from './features/faculty/classadvisor/CATimetable';
import { CASubjects } from './features/faculty/classadvisor/CASubjects';
import { CACourseProgress } from './features/faculty/classadvisor/CACourseProgress';
import { CAClassInfo } from './features/faculty/classadvisor/CAClassInfo';
import { Mentorship } from './features/faculty/Mentorship';

// A simple protective wrapper that forces login and checks roles
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    // Redirect to their actual role's dashboard if they try to access another
    return <Navigate to={`/${user.role}`} replace />;
  }
  
  return children;
};

// Root redirector based on user state
const RootRedirect = () => {
  const { user } = useAuth();
  return user ? <Navigate to={`/${user.role}`} replace /> : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      
      <Route element={<DashboardLayout />}>
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/departments" element={
          <ProtectedRoute allowedRole="admin">
            <Departments />
          </ProtectedRoute>
        } />
        <Route path="/admin/faculty" element={
          <ProtectedRoute allowedRole="admin">
            <Faculty />
          </ProtectedRoute>
        } />
        <Route path="/admin/students" element={
          <ProtectedRoute allowedRole="admin">
            <Students />
          </ProtectedRoute>
        } />
        <Route path="/admin/authorities" element={
          <ProtectedRoute allowedRole="admin">
            <Authorities />
          </ProtectedRoute>
        } />
        <Route path="/admin/courses" element={
          <ProtectedRoute allowedRole="admin">
            <Courses />
          </ProtectedRoute>
        } />
        <Route path="/admin/discipline" element={
          <ProtectedRoute allowedRole="admin">
            <AdminDiscipline />
          </ProtectedRoute>
        } />
        <Route path="/admin/latetracker" element={
          <ProtectedRoute allowedRole="admin">
            <LateManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/announcements" element={
          <ProtectedRoute allowedRole="admin">
            <Announcements />
          </ProtectedRoute>
        } />
        
        {/* HOD Routes */}
        <Route path="/hod" element={
          <ProtectedRoute allowedRole="hod">
            <HodDashboard />
          </ProtectedRoute>
        } />
        <Route path="/hod/faculty" element={
          <ProtectedRoute allowedRole="hod">
            <FacultyList />
          </ProtectedRoute>
        } />
        <Route path="/hod/students" element={
          <ProtectedRoute allowedRole="hod">
            <StudentList />
          </ProtectedRoute>
        } />
        <Route path="/hod/sections" element={
          <ProtectedRoute allowedRole="hod">
            <Sections />
          </ProtectedRoute>
        } />
        <Route path="/hod/assignments" element={
          <ProtectedRoute allowedRole="hod">
            <FacultyAssignment />
          </ProtectedRoute>
        } />
        <Route path="/hod/mentors" element={
          <ProtectedRoute allowedRole="hod">
            <MentorAssignment />
          </ProtectedRoute>
        } />
        <Route path="/hod/timetable" element={
          <ProtectedRoute allowedRole="hod">
            <Timetable />
          </ProtectedRoute>
        } />
        <Route path="/hod/announcements" element={
          <ProtectedRoute allowedRole="hod">
            <Announcements />
          </ProtectedRoute>
        } />
        <Route path="/hod/attendance" element={
          <ProtectedRoute allowedRole="hod">
            <AttendanceMonitor />
          </ProtectedRoute>
        } />
        <Route path="/hod/results" element={
          <ProtectedRoute allowedRole="hod">
            <ResultsMonitor />
          </ProtectedRoute>
        } />
        <Route path="/hod/reports" element={
          <ProtectedRoute allowedRole="hod">
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/hod/discipline" element={
          <ProtectedRoute allowedRole="hod">
            <HodDiscipline />
          </ProtectedRoute>
        } />
        <Route path="/hod/latetracker" element={
          <ProtectedRoute allowedRole="hod">
            <LateManagement />
          </ProtectedRoute>
        } />
        
        {/* Faculty Routes */}
        <Route path="/faculty" element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyDashboard />
          </ProtectedRoute>
        } />
        <Route path="/faculty/courses" element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyCourses />
          </ProtectedRoute>
        } />
        <Route path="/faculty/courses/:assignmentId/lms" element={
          <ProtectedRoute allowedRole="faculty">
            <LMSManager />
          </ProtectedRoute>
        } />

        <Route path="/faculty/discipline" element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyDiscipline />
          </ProtectedRoute>
        } />
        
        <Route path="/faculty/leave" element={
          <ProtectedRoute allowedRole="faculty">
            <LeaveRequests />
          </ProtectedRoute>
        } />
        <Route path="/faculty/leave/apply" element={
          <ProtectedRoute allowedRole="faculty">
            <LeaveApply />
          </ProtectedRoute>
        } />
        <Route path="/faculty/leave/substitutes" element={
          <ProtectedRoute allowedRole="faculty">
            <SubstituteApprovals />
          </ProtectedRoute>
        } />
        <Route path="/faculty/leave/:id" element={
          <ProtectedRoute allowedRole="faculty">
            <LeaveDetails />
          </ProtectedRoute>
        } />
        {/* Class Advisor Routes */}
        <Route path="/faculty/class-advisor" element={
          <ProtectedRoute allowedRole="faculty"><CADashboard /></ProtectedRoute>
        } />
        <Route path="/faculty/class-advisor/students" element={
          <ProtectedRoute allowedRole="faculty"><CAStudentList /></ProtectedRoute>
        } />
        <Route path="/faculty/class-advisor/students/:studentId" element={
          <ProtectedRoute allowedRole="faculty"><CAStudentProfile /></ProtectedRoute>
        } />
        <Route path="/faculty/class-advisor/attendance" element={
          <ProtectedRoute allowedRole="faculty"><CADailyAttendance /></ProtectedRoute>
        } />
        <Route path="/faculty/class-advisor/attendance-summary" element={
          <ProtectedRoute allowedRole="faculty"><CAAttendanceSummary /></ProtectedRoute>
        } />
        <Route path="/faculty/class-advisor/timetable" element={
          <ProtectedRoute allowedRole="faculty"><CATimetable /></ProtectedRoute>
        } />
        <Route path="/faculty/class-advisor/subjects" element={
          <ProtectedRoute allowedRole="faculty"><CASubjects /></ProtectedRoute>
        } />
        <Route path="/faculty/class-advisor/progress" element={
          <ProtectedRoute allowedRole="faculty"><CACourseProgress /></ProtectedRoute>
        } />
        <Route path="/faculty/class-advisor/info" element={
          <ProtectedRoute allowedRole="faculty"><CAClassInfo /></ProtectedRoute>
        } />
        <Route path="/faculty/announcements" element={
          <ProtectedRoute allowedRole="faculty">
            <Announcements />
          </ProtectedRoute>
        } />
        <Route path="/faculty/mentorship" element={
          <ProtectedRoute allowedRole="faculty">
            <Mentorship />
          </ProtectedRoute>
        } />
        
        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/discipline" element={
          <ProtectedRoute allowedRole="student">
            <StudentDiscipline />
          </ProtectedRoute>
        } />
        <Route path="/student/announcements" element={
          <ProtectedRoute allowedRole="student">
            <Announcements />
          </ProtectedRoute>
        } />
      </Route>

      {/* Late Tracker Routes (No Sidebar) */}
      <Route path="/late_tracker" element={
        <ProtectedRoute allowedRole="late_tracker">
          <LateTrackerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/late_tracker/*" element={
        <ProtectedRoute allowedRole="late_tracker">
          <LateTrackerDashboard />
        </ProtectedRoute>
      } />
      
      {/* Continuing DashboardLayout for Authority (Needs separate Route wrapper if we closed it above, wait, I need to wrap Authority inside DashboardLayout as well) */}
      <Route element={<DashboardLayout />}>
        {/* Authority Routes */}
        <Route path="/authority" element={
          <ProtectedRoute allowedRole="authority">
            <AuthorityDashboard />
          </ProtectedRoute>
        } />
        <Route path="/authority/discipline" element={
          <ProtectedRoute allowedRole="authority">
            <AuthorityDiscipline />
          </ProtectedRoute>
        } />
        <Route path="/authority/latetracker" element={
          <ProtectedRoute allowedRole="authority">
            <LateManagement />
          </ProtectedRoute>
        } />
        <Route path="/authority/announcements" element={
          <ProtectedRoute allowedRole="authority">
            <Announcements />
          </ProtectedRoute>
        } />
        
        {/* Catch-all for sub-routes during Phase 2 (shows empty page) */}
        <Route path="/:role/*" element={
          <ProtectedRoute>
            <div className="p-8 text-center text-gray-500">
              <h2 className="text-2xl font-bold">Coming Soon</h2>
              <p>This module will be built in the upcoming phases.</p>
            </div>
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
