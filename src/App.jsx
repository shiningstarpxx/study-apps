import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LearnPage from './pages/LearnPage';
import QuizPage from './pages/QuizPage';
import SocraticPage from './pages/SocraticPage';
import ReviewPage from './pages/ReviewPage';
import VocabularyPage from './pages/VocabularyPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

const pagePaths = {
  dashboard: '/',
  learn: '/learn',
  review: '/review',
  quiz: '/quiz',
  socratic: '/socratic',
  vocabulary: '/vocabulary',
  stats: '/stats',
  settings: '/settings',
};

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = location.pathname === '/'
    ? 'dashboard'
    : location.pathname.replace(/^\//, '');

  const handleNavigate = (page) => {
    navigate(pagePaths[page] || '/');
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      <div
        className={`overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
      />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard onNavigate={handleNavigate} />} />
          <Route path="/learn" element={<LearnPage onNavigate={handleNavigate} />} />
          <Route path="/review" element={<ReviewPage onNavigate={handleNavigate} />} />
          <Route path="/quiz" element={<QuizPage onNavigate={handleNavigate} />} />
          <Route path="/socratic" element={<SocraticPage onNavigate={handleNavigate} />} />
          <Route path="/vocabulary" element={<VocabularyPage onNavigate={handleNavigate} />} />
          <Route path="/stats" element={<StatsPage onNavigate={handleNavigate} />} />
          <Route path="/settings" element={<SettingsPage onNavigate={handleNavigate} />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <button
        className="mobile-menu-btn"
        aria-label="打开导航菜单"
        onClick={() => setSidebarOpen(prev => !prev)}
      >
        ☰
      </button>
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
