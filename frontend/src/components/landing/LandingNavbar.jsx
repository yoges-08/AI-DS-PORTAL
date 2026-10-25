import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthModal } from '../../context/AuthModalContext';
import { LogIn, Menu, X, ArrowRight } from 'lucide-react';

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
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass-nav-white text-slate-900 sticky top-0 z-40 transition-all"
    >
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
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            <motion.button
              onClick={() => openLogin('STUDENT')}
              whileHover={{ 
                scale: 1.04, 
                y: -1.5,
                boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)' 
              }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-colors cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Login<span className="hidden min-[480px]:inline"> to Portal</span></span>
              <motion.span
                className="hidden sm:inline"
                initial={{ x: 0 }}
                whileHover={{ x: 3 }}
              >
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </motion.span>
            </motion.button>

            {/* Mobile Drawer Trigger */}
            <motion.button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.92 }}
              className="p-2 sm:p-2.5 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-xl md:hidden focus:outline-none transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="md:hidden overflow-hidden bg-white/95 border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 text-sm font-semibold text-slate-700 shadow-xl backdrop-blur-xl"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2">
              <motion.button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLogin('STUDENT');
                }}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-xl bg-blue-600 text-white font-bold text-sm shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Login to Portal</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
