import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseUpload from './pages/CourseUpload';
import CourseDetail from './pages/CourseDetail';
import Profile from './pages/Profile';
import AITools from './pages/AITools';
import TrendAnalysis from './pages/TrendAnalysis';
import KPIReports from './pages/KPIReports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="app-main">
          <TopBar />
          <div className="app-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/upload" element={<CourseUpload />} />
              <Route path="/courses/new" element={<CourseUpload />} />
              <Route path="/courses/detail/:type/:id" element={<CourseDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/ai-tools" element={<AITools />} />
              <Route path="/tools/trends" element={<TrendAnalysis />} />
              <Route path="/kpi" element={<KPIReports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
