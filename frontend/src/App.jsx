import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminSidebar } from './components/AdminSidebar';
import { BulkImportPage } from './pages/admin/BulkImportPage';
import { BulkManagePage } from './pages/admin/BulkManagePage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { MultiStepForm } from './pages/student/MultiStepForm';
import { NotFoundPage } from './pages/NotFoundPage';

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
    return (
      <div className="min-h-screen bg-gov-bg flex flex-col items-center justify-center p-4">
        <div className="relative mb-4">
          <img src="/college-logo.webp" alt="AAMEC" className="h-16 w-auto object-contain drop-shadow-sm" />
          <div className="absolute -inset-2 border-2 border-gov-navy border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-sm font-bold text-gov-navy uppercase tracking-wider">
          AI & DS Department Portal
        </div>
        <div className="text-xs text-gray-500 mt-1">Connecting to Student Information System...</div>
      </div>
    );
  }

  // Not logged in: Show Login Page
  if (!user) {
    return <LoginPage />;
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
      <div className="md:hidden bg-white border-b border-gray-200 px-2 py-1.5 flex items-center space-x-1 overflow-x-auto no-scrollbar shadow-xs shrink-0">
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
              className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-gov-navy text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            <BulkImportPage />
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
