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
    <aside className="w-56 bg-white border-r border-gov-border min-h-[calc(100vh-4rem)] shrink-0 no-print">
      <div className="p-3">
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 py-2">
          Department Portal
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

      <div className="p-4 mt-8 border-t border-gray-100 text-[11px] text-gray-500">
        <p className="font-semibold text-gray-700">AI & DS Dept</p>
        <p>UMIS Information Desk</p>
      </div>
    </aside>
  );
};
