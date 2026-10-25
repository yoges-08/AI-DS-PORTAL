import React, { useState, useEffect } from 'react';
import { LandingNavbar } from './LandingNavbar';
import { Hero } from './Hero';
import { AccreditationTicker } from './AccreditationTicker';
import { FeaturesGrid } from './FeaturesGrid';
import { AboutDepartment } from './AboutDepartment';
import { ContactSection } from './ContactSection';
import { Footer } from '../Footer';

export const LandingPage = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentProgress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(currentProgress);
      }

      // Detect active section
      const sections = ['hero', 'features', 'about', 'contact'];
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 250 && rect.bottom >= 250) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1B3A] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden relative">
      
      {/* Top Cybernetic Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-cyan-400 via-blue-600 to-indigo-600 z-50 transition-all duration-75 shadow-sm shadow-cyan-400/50"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Floating Right Edge Navigation Dots */}
      <div className="hidden lg:flex fixed right-5 top-1/2 -translate-y-1/2 flex-col items-center gap-3 z-40 p-2 rounded-full bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-md">
        {[
          { id: 'hero', label: 'Quantum Hero' },
          { id: 'features', label: 'Architecture' },
          { id: 'about', label: 'Department' },
          { id: 'contact', label: 'Helpdesk' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className="group relative flex items-center justify-center p-1 cursor-pointer"
            title={item.label}
          >
            <span 
              className={`block rounded-full transition-all duration-300 ${
                activeSection === item.id 
                  ? 'w-3 h-3 bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-md shadow-blue-500/50 scale-110' 
                  : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
              }`} 
            />
            {/* Tooltip Label */}
            <span className="absolute right-6 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Subtle background ambient light blobs */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/40 to-indigo-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-[450px] h-[450px] bg-gradient-to-tl from-sky-100/40 to-blue-50/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Sticky White Glass Navbar */}
      <LandingNavbar />

      {/* Main Page Content */}
      <main className="flex-1">
        <Hero />
        <AccreditationTicker />
        <FeaturesGrid />
        <AboutDepartment />
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
