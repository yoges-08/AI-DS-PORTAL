import React from 'react';
import { LandingNavbar } from './LandingNavbar';
import { Hero } from './Hero';
import { AccreditationTicker } from './AccreditationTicker';
import { FeaturesGrid } from './FeaturesGrid';
import { AboutDepartment } from './AboutDepartment';
import { ContactSection } from './ContactSection';
import { Footer } from '../Footer';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1B3A] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden relative">
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
