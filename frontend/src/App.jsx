import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './components/landing/LandingPage';
import { LoginOverlay } from './components/auth/LoginOverlay';
import { Robert } from './components/robert/Robert';
import { LoginPage } from './pages/LoginPage';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminSidebar } from './components/AdminSidebar';
import { BulkImportPage } from './pages/admin/BulkImportPage';
import { WhitelistPage } from './pages/admin/WhitelistPage';
import { BulkManagePage } from './pages/admin/BulkManagePage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { MultiStepForm } from './pages/student/MultiStepForm';
import { NotFoundPage } from './pages/NotFoundPage';
import { ModernLoadingScreen } from './components/ModernLoadingScreen';

export const App = () => {
  const { user, loading } = useAuth();
  const [adminTab, setAdminTab] = useState('dashboard');
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isUnknownRoute = currentPath && currentPath !== '/' && currentPath !== '' && currentPath !== '/login';

  if (isUnknownRoute) {
    return (
      <NotFoundPage 
        onGoHome={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }} 
      />
    );
  }

  if (loading) {
    return <ModernLoadingScreen />;
  }

  // Not logged in: Show Portal Landing Page with Glass Login Overlay & Persistent Robert
  if (!user) {
    return (
      <div className="relative min-h-screen">
        <LandingPage />
        <LoginOverlay />
        <Robert />
      </div>
    );
  }

  // STUDENT VIEW
  if (user.role === 'STUDENT') {
    return (
      <div className="min-h-screen flex flex-col bg-gov-bg">
        <Navbar onLogoClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <main className="flex-1">
          <StudentDashboard />
        </main>
        <Footer />
      </div>
    );
  }

  // ADMIN VIEW
  const adminNavTabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'students', label: 'Students' },
    { id: 'bulk-import', label: 'Bulk Import' },
    { id: 'whitelist', label: 'Whitelist' },
    { id: 'bulk-manage', label: 'Bulk Manage' },
    { id: 'reports', label: 'Reports' },
    { id: 'audit-logs', label: 'Audit Logs' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gov-bg">
      <Navbar 
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={mobileMenuOpen}
        onLogoClick={() => {
          setEditingStudentId(null);
          setAdminTab('dashboard');
        }}
      />

      {/* Mobile Top Quick-Tab Navigation Bar (Admins on phones) */}
      <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-gray-200 px-3 py-2 flex items-center space-x-2 overflow-x-auto no-scrollbar shadow-xs shrink-0">
        {adminNavTabs.map((t) => {
          const isActive = (editingStudentId ? 'students' : adminTab) === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setEditingStudentId(null);
                setAdminTab(t.id);
                setMobileMenuOpen(false);
              }}
              className={`px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 flex items-center shrink-0 ${
                isActive
                  ? 'bg-primary text-white shadow-sm font-bold'
                  : 'bg-surface-container-high/70 text-gray-700 hover:bg-surface-container-high border border-outline-variant/30'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar (Desktop persistent, Mobile slide-over drawer) */}
        <AdminSidebar 
          activeTab={editingStudentId ? 'students' : adminTab} 
          onSelectTab={(tab) => {
            setEditingStudentId(null);
            setAdminTab(tab);
            setMobileMenuOpen(false);
          }} 
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Right Main Content Area */}
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          {editingStudentId ? (
            <div className="p-4 sm:p-6 max-w-4xl mx-auto">
              <MultiStepForm
                studentId={editingStudentId}
                onBack={() => setEditingStudentId(null)}
                onComplete={() => setEditingStudentId(null)}
              />
            </div>
          ) : adminTab === 'dashboard' || adminTab === 'students' ? (
            <AdminDashboard 
              onOpenMultiStepEdit={(id) => setEditingStudentId(id)} 
              onNavigateTab={(tab) => setAdminTab(tab)}
            />
          ) : adminTab === 'bulk-import' ? (
            <BulkImportPage onNavigateTab={(tab) => setAdminTab(tab)} />
          ) : adminTab === 'whitelist' ? (
            <WhitelistPage onNavigateTab={(tab) => setAdminTab(tab)} />
          ) : adminTab === 'bulk-manage' ? (
            <BulkManagePage />
          ) : adminTab === 'reports' ? (
            <ReportsPage />
          ) : adminTab === 'audit-logs' ? (
            <AuditLogsPage />
          ) : (
            <AdminDashboard 
              onOpenMultiStepEdit={(id) => setEditingStudentId(id)} 
              onNavigateTab={(tab) => setAdminTab(tab)}
            />
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default App;
