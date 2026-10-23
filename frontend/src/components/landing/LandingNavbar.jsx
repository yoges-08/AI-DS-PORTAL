import React, { useState } from 'react';
import { useAuthModal } from '../../context/AuthModalContext';
import { LogIn, Menu, X, Shield, ArrowRight } from 'lucide-react';

export const LandingNavbar = () => {
  const { openLogin } = useAuthModal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Overview', href: '#hero' },
    { label: 'Core Features', href: '#features' },
    { label: 'About Department', href: '#about' },
    { label: 'Contact', href: '#contact' }
  ];

  return (
    <header className="glass-nav-white text-slate-900 sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Left: Institutional Logos & Branding */}
          <a
            href="#hero"
            className="flex items-center space-x-2.5 sm:space-x-3 group select-none min-w-0"
            title="AAMEC Department of AI & DS"
          >
            <div className="flex items-center space-x-2 p-1.5 bg-white rounded-xl border border-slate-200/80 shadow-sm shrink-0">
              <img 
                src="/college-logo.webp" 
                alt="AAMEC Crest" 
                className="h-9 sm:h-11 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform shrink-0" 
              />
              <img 
                src="/aids-logo.jpg" 
                alt="AI&DS Crest" 
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-blue-500/20 object-cover shadow-sm group-hover:scale-105 transition-transform hidden min-[360px]:block shrink-0" 
              />
            </div>

            <div className="border-l border-slate-200 pl-2.5 sm:pl-3 min-w-0">
              <div className="text-[10px] sm:text-xs font-bold tracking-tight uppercase text-blue-700 leading-tight truncate">
                <span className="inline sm:hidden">AAMEC</span>
                <span className="hidden sm:inline">Anjalai Ammal Mahalingam Engineering College</span>
              </div>
              <div className="text-xs sm:text-base font-extrabold tracking-tight text-slate-900 leading-tight truncate">
                <span className="inline sm:hidden">Dept. of AI & DS</span>
                <span className="hidden sm:inline">Department of Artificial Intelligence & Data Science</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium hidden md:block">
                Academic Student Information System (SIS)
              </div>
            </div>
          </a>

          {/* Center: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-xs font-semibold text-slate-600">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-xl hover:text-blue-600 hover:bg-blue-50/60 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right: Primary Login Button & Mobile Hamburger */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <button
              onClick={() => openLogin('STUDENT')}
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 transition-all active:scale-95 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Login to Portal</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </button>

            {/* Mobile Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl md:hidden focus:outline-none transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 text-sm font-semibold text-slate-700 shadow-xl backdrop-blur-xl">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openLogin('STUDENT');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Login to Portal</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
