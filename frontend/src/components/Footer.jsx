import React from 'react';
import { Phone, Mail } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gov-border mt-auto py-3.5 text-xs text-gov-subtle no-print">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          <img src="/college-logo.webp" alt="AAMEC" className="w-5 h-5 object-contain" />
          <img src="/aids-logo.jpg" alt="AI&DS" className="w-5 h-5 rounded-full object-cover" />
          <span className="font-semibold text-gray-700 text-center md:text-left">
            Anjalai Ammal Mahalingam Engineering College
          </span>
          <span className="hidden md:inline text-gray-400">&bull;</span>
          <span className="hidden md:inline">Dept of AI & DS &copy; {currentYear}</span>
        </div>

        {/* Clickable Helpdesk Contact Links */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-gray-600">
          <span className="font-medium text-gray-700">Helpdesk:</span>
          <a
            href="tel:+914374245522"
            className="inline-flex items-center text-gov-navy hover:underline font-semibold"
            title="Call Department Office"
          >
            <Phone className="w-3 h-3 mr-1 text-gov-navy shrink-0" />
            +91 4374 245522
          </a>
          <span className="text-gray-300">&bull;</span>
          <a
            href="mailto:aids@aamec.edu.in"
            className="inline-flex items-center text-gov-navy hover:underline font-semibold"
            title="Email Department Coordinator"
          >
            <Mail className="w-3 h-3 mr-1 text-gov-navy shrink-0" />
            aids@aamec.edu.in
          </a>
        </div>
      </div>
    </footer>
  );
};

