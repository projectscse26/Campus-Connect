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
        
        {/* Faculty Routes */}
        <Route path="/faculty" element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyDashboard />
          </ProtectedRoute>
        } />
        
        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />
        
        {/* Authority Routes */}
        <Route path="/authority" element={
          <ProtectedRoute allowedRole="authority">
            <AuthorityDashboard />
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
