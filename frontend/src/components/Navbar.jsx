import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';

export const Navbar = ({ onToggleMobileMenu, isMobileMenuOpen, onLogoClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gov-navy text-white shadow-md border-b border-gov-navy-dark sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[3.75rem] py-2 sm:h-20 sm:py-0 gap-2">
          
          {/* Left: Mobile Drawer Toggle (Admins) & Institutional Logos */}
          <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0">
            {user?.role === 'ADMIN' && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="p-1.5 -ml-1 text-white hover:bg-white/10 rounded-md md:hidden focus:outline-none focus:ring-2 focus:ring-amber-300 shrink-0"
                aria-label="Toggle navigation menu"
                title="Open menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-amber-300" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Clickable Institutional Branding Group */}
            <div 
              onClick={onLogoClick || (() => window.scrollTo({ top: 0, behavior: 'smooth' }))}
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group select-none min-w-0"
              title="Return to Portal Dashboard"
            >
              {/* College Logo */}
              <img 
                src="/college-logo.webp" 
                alt="AAMEC College Crest" 
                className="h-8 sm:h-12 w-auto max-w-[38px] sm:max-w-[58px] object-contain drop-shadow-sm group-hover:scale-105 transition-transform shrink-0"
              />

              {/* Department Logo (compressed WebP/JPG) */}
              <img 
                src="/aids-logo.jpg" 
                alt="AI & DS Department Emblem" 
                className="h-8 w-8 sm:h-12 sm:w-12 rounded-full border border-white/80 object-cover shadow-sm group-hover:scale-105 transition-transform shrink-0 hidden min-[360px]:block"
              />

              <div className="border-l border-blue-400/40 pl-2 sm:pl-3.5 min-w-0">
                <div className="text-[10px] sm:text-xs md:text-sm font-extrabold tracking-tight uppercase text-amber-300 leading-tight truncate">
                  <span className="inline sm:hidden">AAMEC</span>
                  <span className="hidden sm:inline">Anjalai Ammal Mahalingam Engineering College</span>
                </div>
                <div className="text-[11px] sm:text-xs md:text-base font-bold tracking-tight uppercase text-white leading-tight truncate">
                  <span className="inline sm:hidden">Dept. of AI & DS</span>
                  <span className="hidden sm:inline">Department of Artificial Intelligence & Data Science</span>
                </div>
                <div className="text-[10px] text-blue-200 font-medium hidden md:block">
                  Department Student Information System (UMIS Portal)
                </div>
              </div>
            </div>
          </div>

          {/* Right: User Information & Logout */}
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-[11px] text-amber-300 uppercase tracking-wider font-bold">
                  {user.role === 'ADMIN' ? 'Department Administrator' : `Student (${user.registerNo})`}
                </span>
                <span className="text-sm font-semibold truncate max-w-[180px] lg:max-w-[240px]">
                  {user.name}
                </span>
              </div>

              <div className="h-9 w-px bg-blue-400/30 hidden md:block"></div>

              <button
                onClick={logout}
                title="Sign out of portal"
                className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded bg-white/10 hover:bg-white/20 border border-blue-300/40 hover:border-white transition-all shadow-sm shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Logout</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

