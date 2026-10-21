import React from 'react';
import { Home, ArrowLeft, AlertTriangle, Phone, Mail } from 'lucide-react';

export const NotFoundPage = ({ onGoHome }) => {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  const handleReturn = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gov-bg flex flex-col justify-between">
      {/* Top Bar */}
      <header className="bg-gov-navy text-white px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/college-logo.webp" 
              alt="AAMEC Logo" 
              className="h-10 w-auto object-contain bg-white rounded-xl p-1 shadow-xs shrink-0" 
            />
            <div>
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                Anjalai Ammal Mahalingam Engineering College
              </div>
              <div className="text-[11px] text-amber-300 font-medium">
                Department of Artificial Intelligence & Data Science
              </div>
            </div>
          </div>
          <button
            onClick={handleReturn}
            className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Portal Home</span>
          </button>
        </div>
      </header>

      {/* Main 404 Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg border border-gov-border shadow-sm p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h1 className="text-4xl font-extrabold text-gov-navy tracking-tight mb-2">404</h1>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Page Not Found</h2>
          
          <p className="text-xs text-gray-600 mb-4 leading-relaxed">
            The page you requested <code className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded font-mono text-[11px]">{currentPath || 'URL'}</code> does not exist on this portal or has been moved.
          </p>

          <div className="pt-2 pb-4">
            <button
              onClick={handleReturn}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-gov-navy hover:bg-gov-navy-dark text-white text-xs font-semibold rounded shadow-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Return to Portal Home
            </button>
          </div>

          {/* Helpdesk Contact */}
          <div className="border-t border-gray-100 pt-4 mt-2 text-left">
            <p className="text-[11px] font-semibold text-gray-700 mb-2">Need assistance?</p>
            <div className="space-y-1.5 text-[11px] text-gray-600">
              <a 
                href="mailto:aamecaidsskill@gmail.com" 
                className="flex items-center hover:text-gov-navy transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                <span>aamecaidsskill@gmail.com</span>
              </a>
              <a 
                href="tel:+919944823120" 
                className="flex items-center hover:text-gov-navy transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                <span>+91 99448 23120</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gov-border py-3 px-4 text-center text-xs text-gov-subtle">
        &copy; {new Date().getFullYear()} Anjalai Ammal Mahalingam Engineering College. Department of AI & DS. All rights reserved.
      </footer>
    </div>
  );
};

export default NotFoundPage;
