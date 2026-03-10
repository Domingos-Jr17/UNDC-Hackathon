import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "sonner";

import Dashboard from './components/Dashboard.tsx';
import ActivateUser from './components/ActivateUser.tsx';
import StaffLoginPage from './components/StaffLoginPage.tsx';
import UsersPage from './components/UsersPage.tsx';
import ReportsPage from './components/ReportsPage.tsx';
import CoursesPage from './components/CoursesPage.tsx';
import CreateCoursePage from './components/CreateCoursePage.tsx';
import CourseDetail from './components/CourseDetail.tsx';
import SettingsPage from './components/SettingsPage.tsx';
import UserDetail from './components/UserDetail.tsx';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';


function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Toaster position="top-right" />
            <Routes>
            <Route path="/" element={<StaffLoginPage />} />
            <Route path="/staff-login" element={<StaffLoginPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/active" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <ActivateUser />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <UsersPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/users/:id" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <UserDetail />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/courses" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <CoursesPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/courses/:id" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <CourseDetail />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/courses/create" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <CreateCoursePage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <ReportsPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <SettingsPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/settings/profile" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <SettingsPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
                  </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
