import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, ShieldCheck } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gov-navy text-white shadow-md border-b border-gov-navy-dark sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Dual Logos & Institution Details */}
          <div className="flex items-center space-x-3.5">
            {/* College Logo */}
            <img 
              src="/college-logo.webp" 
              alt="AAMEC College Crest" 
              className="h-12 w-auto max-w-[58px] object-contain drop-shadow-sm hover:scale-105 transition-transform"
              title="Anjalai Ammal Mahalingam Engineering College"
            />

            {/* Department Logo */}
            <img 
              src="/aids-logo.jpg" 
              alt="AI & DS Department Emblem" 
              className="h-12 w-12 rounded-full border-2 border-white/80 object-cover shadow-sm hover:scale-105 transition-transform"
              title="Department of Artificial Intelligence and Data Science"
            />

            <div className="border-l border-blue-400/40 pl-3.5">
              <div className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-amber-300 leading-tight">
                Anjalai Ammal Mahalingam Engineering College
              </div>
              <div className="text-xs sm:text-base font-bold tracking-wide uppercase text-white leading-tight">
                Department of Artificial Intelligence & Data Science
              </div>
              <div className="text-[11px] text-blue-200 font-medium hidden sm:block">
                Department Student Information System (UMIS Portal)
              </div>
            </div>
          </div>

          {/* Right: User Information & Logout */}
          {user && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-[11px] text-amber-300 uppercase tracking-wider font-bold">
                  {user.role === 'ADMIN' ? 'Department Administrator' : `Student (${user.registerNo})`}
                </span>
                <span className="text-sm font-semibold truncate max-w-[220px]">
                  {user.name}
                </span>
              </div>

              <div className="h-9 w-px bg-blue-400/30 hidden md:block"></div>

              <button
                onClick={logout}
                title="Sign out of portal"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-white/10 hover:bg-white/20 border border-blue-300/40 hover:border-white transition-all shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
