import React, { useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  FileDown, 
  History, 
  X
} from 'lucide-react';

export const AdminSidebar = ({ activeTab, onSelectTab, isOpenMobile, onCloseMobile }) => {
  // Lock body scroll when mobile drawer is open to prevent background scrolling
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Student Records', icon: Users },
    { id: 'bulk-import', label: 'Bulk Import', icon: FileSpreadsheet },
    { id: 'reports', label: 'Reports & Exports', icon: FileDown },
    { id: 'audit-logs', label: 'Audit Logs', icon: History }
  ];

  const renderNavContent = () => (
    <>
      <div className="p-3">
        {/* Institutional Branding Card */}
        <div className="flex items-center space-x-2.5 p-2.5 mb-3 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-lg border border-blue-100">
          <img src="/college-logo.webp" alt="AAMEC" className="w-8 h-8 object-contain shrink-0" />
          <img src="/aids-logo.jpg" alt="AI&DS" className="w-8 h-8 rounded-full border border-blue-200 object-cover shadow-xs shrink-0" />
          <div className="overflow-hidden">
            <p className="text-[11px] font-black text-gov-navy leading-none">AAMEC</p>
            <p className="text-[10px] font-semibold text-blue-800 truncate">Dept of AI & DS</p>
          </div>
        </div>

        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
          Menu Navigation
        </div>
        <nav className="space-y-1">
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
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-semibold transition-colors text-left ${
                  isActive
                    ? 'bg-blue-50 text-gov-navy border-l-4 border-gov-navy font-bold shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-gov-navy' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3 mt-auto border-t border-gray-100 text-[11px] text-gray-500 text-center">
        <p className="font-bold text-gov-navy text-[10px] uppercase">Anjalai Ammal Mahalingam</p>
        <p className="text-[10px] text-gray-600">Engineering College &bull; AI&DS</p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-60 bg-white border-r border-gov-border min-h-[calc(100vh-5rem)] shrink-0 no-print hidden md:flex flex-col justify-between">
        {renderNavContent()}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex no-print animate-fade-in">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-64 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 transform transition-transform">
            {/* Top Close Bar */}
            <div className="px-4 py-3 bg-gov-navy text-white flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Navigation Menu</span>
              <button 
                onClick={onCloseMobile}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col justify-between">
              {renderNavContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};


