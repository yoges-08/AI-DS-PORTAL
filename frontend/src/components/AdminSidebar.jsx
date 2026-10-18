import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  FileDown, 
  History, 
  Settings 
} from 'lucide-react';

export const AdminSidebar = ({ activeTab, onSelectTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Student Records', icon: Users },
    { id: 'bulk-import', label: 'Bulk Import', icon: FileSpreadsheet },
    { id: 'reports', label: 'Reports & Exports', icon: FileDown },
    { id: 'audit-logs', label: 'Audit Logs', icon: History }
  ];

  return (
    <aside className="w-60 bg-white border-r border-gov-border min-h-[calc(100vh-5rem)] shrink-0 no-print flex flex-col justify-between">
      <div className="p-3">
        {/* Institutional Branding Card */}
        <div className="flex items-center space-x-2.5 p-2.5 mb-3 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-lg border border-blue-100">
          <img src="/college-logo.webp" alt="AAMEC" className="w-9 h-9 object-contain" />
          <img src="/aids-logo.jpg" alt="AI&DS" className="w-9 h-9 rounded-full border border-blue-200 object-cover shadow-xs" />
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
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-semibold transition-colors text-left ${
                  isActive
                    ? 'bg-blue-50 text-gov-navy border-l-4 border-gov-navy font-bold'
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
    </aside>
  );
};

