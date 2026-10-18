import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminSidebar } from './components/AdminSidebar';
import { BulkImportPage } from './pages/admin/BulkImportPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { MultiStepForm } from './pages/student/MultiStepForm';

export const App = () => {
  const { user, loading } = useAuth();
  const [adminTab, setAdminTab] = useState('dashboard');
  const [editingStudentId, setEditingStudentId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gov-bg flex flex-col items-center justify-center p-4">
        <img src="/logo.svg" alt="Emblem" className="w-12 h-12 mb-3 animate-pulse" />
        <div className="text-sm font-semibold text-gov-navy">
          Connecting to Department Student Information System...
        </div>
        <div className="text-xs text-gray-400 mt-1">Please wait a moment</div>
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
        <Navbar />
        <main className="flex-1">
          <StudentDashboard />
        </main>
        <Footer />
      </div>
    );
  }

  // ADMIN VIEW
  return (
    <div className="min-h-screen flex flex-col bg-gov-bg">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar */}
        <AdminSidebar 
          activeTab={editingStudentId ? 'students' : adminTab} 
          onSelectTab={(tab) => {
            setEditingStudentId(null);
            setAdminTab(tab);
          }} 
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
            />
          ) : adminTab === 'bulk-import' ? (
            <BulkImportPage />
          ) : adminTab === 'reports' ? (
            <ReportsPage />
          ) : adminTab === 'audit-logs' ? (
            <AuditLogsPage />
          ) : (
            <AdminDashboard onOpenMultiStepEdit={(id) => setEditingStudentId(id)} />
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default App;
