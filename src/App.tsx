import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider } from './context/ThemeContext';

// ─── Lazy-loaded pages (code splitting) ─────────────────────────────
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseUpload = lazy(() => import('./pages/CourseUpload'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const Account = lazy(() => import('./pages/Account'));
const CRM = lazy(() => import('./pages/CRM'));
const AiAgentsPage = lazy(() => import('./pages/AiAgentsPage'));
const KpiReports = lazy(() => import('./pages/KpiReports'));
const Contacts = lazy(() => import('./pages/Contacts'));
const ContactDetail = lazy(() => import('./pages/ContactDetail'));

// ─── Loading fallback ───────────────────────────────────────────────
const PageLoader = () => (
    <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Cargando...</p>
        </div>
    </div>
);

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 md:ml-[240px] flex flex-col min-w-0">
          <TopBar />
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/contacts/:id" element={<ContactDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/integrations" element={<Navigate to="/settings" replace />} />
            <Route path="/kpi" element={<KpiReports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/account" element={<Account />} />
            {/* Catch-all redirect to Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
