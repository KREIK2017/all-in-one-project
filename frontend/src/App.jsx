import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from './components/layout';
import { 
  DashboardPage, TicketsListPage, TicketDetailPage, NewTicketPage, 
  ProjectsPage, ReportsPage, NewProjectPage, LoginPage, RegisterPage, 
  ProfilePage, SettingsPage, ActivityPage, UsersPage, CompleteProfilePage 
} from './pages';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ background: '#0a0a0f', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  // If user doesn't have a handle and is NOT already on the complete-profile page, redirect them
  const hasNoHandle = !user.handle || user.handle === '' || user.handle === 'null';
  if (hasNoHandle && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfilePage /></ProtectedRoute>} />
            
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="tickets" element={<TicketsListPage />} />
              <Route path="tickets/new" element={<NewTicketPage />} />
              <Route path="tickets/:id" element={<TicketDetailPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/new" element={<NewProjectPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="profile/:id?" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
