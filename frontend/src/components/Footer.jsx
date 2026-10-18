import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gov-border mt-auto py-3.5 text-xs text-gov-subtle no-print">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <img src="/college-logo.webp" alt="AAMEC" className="w-5 h-5 object-contain" />
          <img src="/aids-logo.jpg" alt="AI&DS" className="w-5 h-5 rounded-full object-cover" />
          <span className="font-semibold text-gray-700">
            Anjalai Ammal Mahalingam Engineering College
          </span>
          <span className="hidden md:inline text-gray-400">&bull;</span>
          <span className="hidden md:inline">Department of Artificial Intelligence & Data Science &copy; 2026</span>
        </div>
        <div>
          Department Student Information System (UMIS Portal)
        </div>
      </div>
    </footer>
  );
};
