import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import EmployersPage from './components/EmployersPage.tsx';
import JobsManagementPage from './components/JobsManagementPage.tsx';
import JobMatchesPage from './components/JobMatchesPage.tsx';
import ApplicationsPage from './components/ApplicationsPage.tsx';
import MonitorProgress from './components/MonitorProgress.tsx';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { isFollowUpAlertsPhase2Enabled } from './config/features';

const FollowUpPage = lazy(() => import('./components/FollowUpPage.tsx'))
const AlertsPage = lazy(() => import('./components/AlertsPage.tsx'))


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
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/active" element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <ErrorBoundary>
                  <ActivateUser />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <ErrorBoundary>
                  <UsersPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/users/:id" element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <ErrorBoundary>
                  <UserDetail />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/courses" element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <ErrorBoundary>
                  <CoursesPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/courses/:id" element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <ErrorBoundary>
                  <CourseDetail />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/courses/create" element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <ErrorBoundary>
                  <CreateCoursePage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <ErrorBoundary>
                  <ReportsPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/employers" element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <ErrorBoundary>
                  <EmployersPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/jobs" element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <ErrorBoundary>
                  <JobsManagementPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/jobs/:id/matches" element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <ErrorBoundary>
                  <JobMatchesPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/matches" element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <ErrorBoundary>
                  <JobMatchesPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/applications" element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <ErrorBoundary>
                  <ApplicationsPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            {isFollowUpAlertsPhase2Enabled ? (
              <>
                <Route path="/follow-up" element={
                  <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                    <ErrorBoundary>
                      <Suspense fallback={null}>
                        <FollowUpPage />
                      </Suspense>
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
                <Route path="/alerts" element={
                  <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                    <ErrorBoundary>
                      <Suspense fallback={null}>
                        <AlertsPage />
                      </Suspense>
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
              </>
            ) : (
              <>
                <Route path="/follow-up" element={<Navigate to="/dashboard" replace />} />
                <Route path="/alerts" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
            <Route path="/monitor-progress" element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <ErrorBoundary>
                  <MonitorProgress />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <ErrorBoundary>
                  <SettingsPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/settings/profile" element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
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
