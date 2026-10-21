import React, { useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  ListChecks,
  FileDown, 
  History, 
  X,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';

export const AdminSidebar = ({ activeTab, onSelectTab, isOpenMobile, onCloseMobile }) => {
  useEffect(() => {
    if (isOpenMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpenMobile]);

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'students', label: 'Student Register', icon: Users },
    { id: 'bulk-import', label: 'Cohort Bulk Import', icon: FileSpreadsheet },
    { id: 'bulk-manage', label: 'Bulk Manage', icon: ListChecks },
    { id: 'reports', label: 'Reports & Exports', icon: FileDown },
    { id: 'audit-logs', label: 'Security Audit Logs', icon: History }
  ];

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between p-4">
      <div>
        {/* Institutional Pill Header */}
        <div className="flex items-center space-x-2.5 p-3 mb-5 bg-white/70 backdrop-blur-md rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="flex items-center space-x-2 shrink-0">
            <img src="/college-logo.webp" alt="AAMEC" className="h-9 w-auto max-w-[44px] object-contain drop-shadow-xs shrink-0" />
            <img src="/aids-logo.jpg" alt="AI&DS" className="w-7 h-7 rounded-full border border-primary/20 object-cover shadow-xs shrink-0" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-black text-primary leading-none uppercase">AAMEC</p>
            <p className="text-[10px] font-semibold text-secondary truncate mt-0.5">Dept. of AI & DS</p>
          </div>
        </div>

        <div className="text-[10px] font-bold text-outline uppercase tracking-wider px-3 mb-2">
          Management Rail
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile && onCloseMobile();
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left active:scale-[0.98] ${
                  isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/25 font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-outline'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 mt-auto bg-surface-container/60 rounded-xl border border-outline-variant/30 text-center">
        <p className="font-bold text-primary text-[10px] uppercase">Anjalai Ammal Mahalingam</p>
        <p className="text-[10px] text-on-surface-variant">Engineering College &bull; AI & DS</p>
        <p className="text-[9px] text-outline mt-1">SIS Administration v4.2</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 bg-surface-container-lowest/80 backdrop-blur-2xl border-r border-outline-variant/30 min-h-[calc(100vh-5rem)] shrink-0 no-print hidden md:flex flex-col justify-between">
        {renderNavContent()}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex no-print">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-64 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10">
            {/* Top Close Bar */}
            <div className="px-4 py-3 bg-primary text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img src="/college-logo.webp" alt="AAMEC" className="h-7 w-auto object-contain" />
                <span className="text-xs font-bold uppercase tracking-wider">Navigation Menu</span>
              </div>
              <button 
                onClick={onCloseMobile}
                className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {renderNavContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
