import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, Shield, GraduationCap } from 'lucide-react';

export const Navbar = ({ onToggleMobileMenu, isMobileMenuOpen, onLogoClick }) => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="glass-nav text-on-surface sticky top-0 z-50 no-print transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Left: Mobile Drawer Toggle (Admins) & Institutional Logos */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
            {user?.role === 'ADMIN' && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="p-2 -ml-1 text-primary hover:bg-surface-container rounded-xl md:hidden focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all shrink-0"
                aria-label="Toggle navigation menu"
                title="Open menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-secondary" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Clickable Institutional Branding Group */}
            <div 
              onClick={onLogoClick || (() => window.scrollTo({ top: 0, behavior: 'smooth' }))}
              className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group select-none min-w-0"
              title="Return to Portal Dashboard"
            >
              {/* College Logo & Dept Logo */}
              <div className="flex items-center space-x-1.5 p-1.5 bg-white/80 rounded-xl border border-outline-variant/40 shadow-sm shrink-0">
                <img 
                  src="/college-logo.webp" 
                  alt="AAMEC College Crest" 
                  className="h-7 sm:h-10 w-auto max-w-[34px] sm:max-w-[48px] object-contain drop-shadow-sm group-hover:scale-105 transition-transform" 
                />
                <img 
                  src="/aids-logo.jpg" 
                  alt="AI & DS Emblem" 
                  className="h-7 w-7 sm:h-10 sm:w-10 rounded-full border border-primary/20 object-cover shadow-sm group-hover:scale-105 transition-transform hidden min-[360px]:block" 
                />
              </div>

              <div className="border-l border-outline-variant/50 pl-2.5 sm:pl-3 min-w-0">
                <div className="text-[10px] sm:text-xs font-bold tracking-tight uppercase text-secondary leading-tight truncate">
                  <span className="inline sm:hidden">AAMEC</span>
                  <span className="hidden sm:inline">Anjalai Ammal Mahalingam Engineering College</span>
                </div>
                <div className="text-xs sm:text-base font-extrabold tracking-tight text-primary leading-tight truncate">
                  <span className="inline sm:hidden">Dept. of AI & DS</span>
                  <span className="hidden sm:inline">Department of Artificial Intelligence & Data Science</span>
                </div>
                <div className="text-[11px] text-on-surface-variant font-medium hidden md:block">
                  Student Information System (SIS)
                </div>
              </div>
            </div>
          </div>

          {/* Right: User Information & Logout */}
          {user && (
            <div className="flex items-center space-x-2.5 sm:space-x-3.5 shrink-0">
              
              {/* User Pill / Account Chip */}
              <div className="flex items-center gap-2.5 pl-2 pr-3 py-1 bg-surface-container/70 border border-outline-variant/40 rounded-full shadow-sm">
                <div className="relative w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold ring-1 ring-white shadow-inner shrink-0">
                  {getInitials(user.name)}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                </div>
                
                <div className="hidden sm:flex flex-col text-left max-w-[160px] lg:max-w-[220px]">
                  <span className="text-xs font-bold text-primary truncate leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold truncate leading-tight">
                    {user.role === 'ADMIN' ? 'HOD / Faculty Admin' : user.registerNo}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Sign out of portal"
                aria-label="Logout"
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-error-container hover:text-error border border-outline-variant/40 hover:border-error/30 text-on-surface transition-all active:scale-95 shadow-sm shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline">Sign Out</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
