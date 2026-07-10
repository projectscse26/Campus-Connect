import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { Alumni } from './features/admin/Alumni';
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
import { AdvancedAttendanceMonitor } from './features/hod/AdvancedAttendanceMonitor';
import { ResultsMonitor } from './features/hod/ResultsMonitor';
import { Reports } from './features/hod/Reports';
import { Discipline as AdminDiscipline } from './features/admin/Discipline';
import { Discipline as HodDiscipline } from './features/hod/Discipline';
import { Discipline as AuthorityDiscipline } from './features/authority/Discipline';
import { Discipline as FacultyDiscipline } from './features/faculty/Discipline';
import { Courses as FacultyCourses } from './features/faculty/Courses';
import { LMSDashboard } from './features/faculty/lms/LMSDashboard';
import { LMSResources } from './features/faculty/lms/LMSResources';
import { LMSAssignments } from './features/faculty/lms/LMSAssignments';
import { LMSSeminars } from './features/faculty/lms/LMSSeminars';
import { LMSAnnouncements as CourseAnnouncements } from './features/faculty/lms/LMSAnnouncements';
import { LMSSyllabus } from './features/faculty/lms/LMSSyllabus';
import { LMSAttendance } from './features/faculty/lms/LMSAttendance';
import { LMSAttendanceHistory } from './features/faculty/lms/LMSAttendanceHistory';
import { LMSTimetable } from './features/faculty/lms/LMSTimetable';
import MyClass from './features/student/MyClass';
import StudentCourses from './features/student/StudentCourses';
import StudentCourseDetail from './features/student/StudentCourseDetail';
import StudentMarks from './features/student/StudentMarks';
import TodaySchedule from './features/student/TodaySchedule';
import { LMSGradebook } from './features/faculty/lms/LMSGradebook';
import { Discipline as StudentDiscipline } from './features/student/Discipline';
import { LateTrackerDashboard } from './features/latetracker/Dashboard';
import { LateManagement } from './features/hod/LateManagement';
import { LeaveRequests } from './features/faculty/LeaveRequests';
import { LeaveApply } from './features/faculty/LeaveApply';
import { LeaveDetails } from './features/faculty/LeaveDetails';
import { SubstituteApprovals } from './features/faculty/SubstituteApprovals';
import LateEntryNotifications from './features/faculty/LateEntryNotifications';
import { CADashboard } from './features/faculty/classadvisor/CADashboard';
import { CAStudentList } from './features/faculty/classadvisor/CAStudentList';
import { CAStudentProfile } from './features/faculty/classadvisor/CAStudentProfile';
import { CADailyAttendance } from './features/faculty/classadvisor/CADailyAttendance';
import { CAAttendanceSummary } from './features/faculty/classadvisor/CAAttendanceSummary';
import { CATimetable } from './features/faculty/classadvisor/CATimetable';
import { CASubjects } from './features/faculty/classadvisor/CASubjects';
import { CACourseProgress } from './features/faculty/classadvisor/CACourseProgress';
import { CAClassInfo } from './features/faculty/classadvisor/CAClassInfo';
import { CALeaveRequests } from './features/faculty/classadvisor/CALeaveRequests';
import { Mentorship } from './features/faculty/Mentorship';
import { GatePass } from './features/student/GatePass';
import { StudentLeave } from './features/student/StudentLeave';
import { MenteeGatePasses } from './features/faculty/MenteeGatePasses';
import { GatePassApprovals as HodGatePassApprovals } from './features/hod/GatePassApprovals';
import { LeaveApprovals } from './features/hod/LeaveApprovals';
import { OMGatePassApprovals } from './features/authority/OMGatePassApprovals';
import FacultyGatePass from './features/faculty/FacultyGatePass';
import HODFacultyGatePass from './features/hod/HODFacultyGatePass';
import AuthorityFacultyGatePass from './features/authority/AuthorityFacultyGatePass';
import { AuthorityLeaveApprovals } from './features/authority/AuthorityLeaveApprovals';
import { Profile } from './features/profile/Profile';
import LateEntryNotification from './features/student/LateEntryNotification';
import PrincipalDashboard from './features/authority/PrincipalDashboard';
import DeanDashboard from './features/authority/DeanDashboard';
import OMDashboard from './features/authority/OMDashboard';
import HRDashboard from './features/authority/HRDashboard';
import HRLeavePortal from './features/authority/HRLeavePortal';
import AuthorityDashboardRouter from './features/authority/AuthorityDashboardRouter';
import StudentMessaging from './features/student/StudentMessaging';
import DeanMessaging from './features/dean/DeanMessaging';
import MyAttendance from './features/faculty/MyAttendance';
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
        <Route path="/admin/alumni" element={
          <ProtectedRoute allowedRole="admin">
            <Alumni />
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
            <AdvancedAttendanceMonitor />
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
        <Route path="/hod/gatepass" element={
          <ProtectedRoute allowedRole="hod">
            <HodGatePassApprovals />
          </ProtectedRoute>
        } />
        <Route path="/hod/faculty-gatepass" element={
          <ProtectedRoute allowedRole="hod">
            <HODFacultyGatePass />
          </ProtectedRoute>
        } />
        <Route path="/hod/leave" element={
          <ProtectedRoute allowedRole="hod">
            <LeaveApprovals />
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
        <Route path="/faculty/my-attendance" element={
          <ProtectedRoute allowedRole="faculty">
            <MyAttendance />
          </ProtectedRoute>
        } />
        <Route path="/faculty/courses" element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyCourses />
          </ProtectedRoute>
        } />
        <Route path="/faculty/courses/:assignmentId/lms" element={
          <ProtectedRoute allowedRole="faculty">
            <LMSDashboard />
          </ProtectedRoute>
        } />
        <Route path="/faculty/courses/:assignmentId/lms/resources" element={
          <ProtectedRoute allowedRole="faculty">
            <LMSResources />
          </ProtectedRoute>
        } />
        <Route path="/faculty/courses/:assignmentId/lms/assignments" element={
          <ProtectedRoute allowedRole="faculty">
            <LMSAssignments />
          </ProtectedRoute>
        } />
        <Route path="/faculty/courses/:assignmentId/lms/seminars" element={
          <ProtectedRoute allowedRole="faculty">
            <LMSSeminars />
          </ProtectedRoute>
        } />
        <Route path="/faculty/courses/:assignmentId/lms/announcements" element={
          <ProtectedRoute allowedRole="faculty">
            <CourseAnnouncements />
          </ProtectedRoute>
        } />
        <Route path="/faculty/courses/:assignmentId/lms/syllabus" element={
          <ProtectedRoute allowedRole="faculty">
            <LMSSyllabus />
          </ProtectedRoute>
        } />
        <Route path="/faculty/courses/:assignmentId/lms/attendance" element={
          <ProtectedRoute allowedRole="faculty">
            <LMSAttendance />
          </ProtectedRoute>
        } />
        <Route path="/faculty/courses/:assignmentId/lms/attendance-history" element={
          <ProtectedRoute allowedRole="faculty">
            <LMSAttendanceHistory />
          </ProtectedRoute>
        } />
        <Route path="/faculty/courses/:assignmentId/lms/gradebook" element={
          <ProtectedRoute allowedRole="faculty">
            <LMSGradebook />
          </ProtectedRoute>
        } />
        <Route path="/faculty/courses/:assignmentId/lms/timetable" element={
          <ProtectedRoute allowedRole="faculty">
            <LMSTimetable />
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
        <Route path="/faculty/class-advisor/leave" element={
          <ProtectedRoute allowedRole="faculty"><CALeaveRequests /></ProtectedRoute>
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
        <Route path="/faculty/gatepass" element={
          <ProtectedRoute allowedRole="faculty">
            <MenteeGatePasses />
          </ProtectedRoute>
        } />
        <Route path="/faculty/faculty-gatepass" element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyGatePass />
          </ProtectedRoute>
        } />
        <Route path="/faculty/late-entry" element={
          <ProtectedRoute allowedRole="faculty">
            <LateEntryNotifications />
          </ProtectedRoute>
        } />
        
        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/class" element={
          <ProtectedRoute allowedRole="student">
            <MyClass />
          </ProtectedRoute>
        } />
        <Route path="/student/courses" element={
          <ProtectedRoute allowedRole="student">
            <StudentCourses />
          </ProtectedRoute>
        } />
        <Route path="/student/schedule" element={
          <ProtectedRoute allowedRole="student">
            <TodaySchedule />
          </ProtectedRoute>
        } />
        <Route path="/student/courses/:courseId" element={
          <ProtectedRoute allowedRole="student">
            <StudentCourseDetail />
          </ProtectedRoute>
        } />
        <Route path="/student/marks" element={
          <ProtectedRoute allowedRole="student">
            <StudentMarks />
          </ProtectedRoute>
        } />
        <Route path="/student/announcements" element={
          <ProtectedRoute allowedRole="student">
            <Announcements />
          </ProtectedRoute>
        } />
        <Route path="/student/gatepass" element={
          <ProtectedRoute allowedRole="student">
            <GatePass />
          </ProtectedRoute>
        } />
        <Route path="/student/late-entry" element={
          <ProtectedRoute allowedRole="student">
            <LateEntryNotification />
          </ProtectedRoute>
        } />
        <Route path="/student/discipline" element={
          <ProtectedRoute allowedRole="student">
            <StudentDiscipline />
          </ProtectedRoute>
        } />
        <Route path="/student/leave" element={
          <ProtectedRoute allowedRole="student">
            <StudentLeave />
          </ProtectedRoute>
        } />
        <Route path="/student/messaging" element={
          <ProtectedRoute allowedRole="student">
            <StudentMessaging />
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
        {/* Authority Routes - Uses router to determine Principal vs OM */}
        <Route path="/authority" element={
          <ProtectedRoute allowedRole="authority">
            <AuthorityDashboardRouter />
          </ProtectedRoute>
        } />
        {/* Principal Dashboard Route */}
        <Route path="/principal" element={
          <ProtectedRoute allowedRole="authority">
            <PrincipalDashboard />
          </ProtectedRoute>
        } />
        
        {/* Dean Dashboard Route */}
        <Route path="/dean" element={
          <ProtectedRoute allowedRole="authority">
            <DeanDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dean/messaging" element={
          <ProtectedRoute allowedRole="authority">
            <DeanMessaging />
          </ProtectedRoute>
        } />
        
        {/* Vice Principal Dashboard Route (Uses PrincipalDashboard layout) */}
        <Route path="/vice-principal" element={
          <ProtectedRoute allowedRole="authority">
            <PrincipalDashboard />
          </ProtectedRoute>
        } />
        
        {/* OM Dashboard Route */}
        <Route path="/om" element={
          <ProtectedRoute allowedRole="authority">
            <OMDashboard />
          </ProtectedRoute>
        } />
        
        {/* HR Dashboard Route */}
        <Route path="/hr" element={
          <ProtectedRoute allowedRole="authority">
            <HRDashboard />
          </ProtectedRoute>
        } />
        <Route path="/hr/leaves" element={
          <ProtectedRoute allowedRole="authority">
            <HRLeavePortal />
          </ProtectedRoute>
        } />
        
        <Route path="/authority/leave" element={
          <ProtectedRoute allowedRole="authority">
            <AuthorityLeaveApprovals />
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
        <Route path="/authority/gatepass" element={
          <ProtectedRoute allowedRole="authority">
            <OMGatePassApprovals />
          </ProtectedRoute>
        } />
        <Route path="/authority/faculty-gatepass" element={
          <ProtectedRoute allowedRole="authority">
            <AuthorityFacultyGatePass />
          </ProtectedRoute>
        } />
        
        {/* Catch-all for sub-routes during Phase 2 (shows empty page) */}
        <Route path="/:role/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
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
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
