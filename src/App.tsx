import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Courses from './pages/Courses';
import CourseUpload from './pages/CourseUpload';
import CourseDetail from './pages/CourseDetail';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import TeamManagement from './pages/TeamManagement';
import Account from './pages/Account';
import CRM from './pages/CRM';
import AiAgentsPage from './pages/AiAgentsPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-[260px] flex flex-col min-w-0">
        <TopBar />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agentes" element={<AiAgentsPage />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/upload" element={<CourseUpload />} />
            <Route path="/courses/new" element={<CourseUpload />} />
            <Route path="/courses/edit/:id" element={<CourseUpload />} />
            <Route path="/courses/detail/:type/:id" element={<CourseDetail />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/account" element={<Account />} />
            {/* Catch-all redirect to Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
