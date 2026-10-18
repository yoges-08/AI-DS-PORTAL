import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, ShieldCheck } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gov-navy text-white shadow-sm border-b border-gov-navy-dark sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Emblem & Title */}
          <div className="flex items-center space-x-3.5">
            <img 
              src="/logo.svg" 
              alt="Department Emblem" 
              className="h-10 w-10 p-0.5 bg-white rounded-full object-contain"
            />
            <div className="border-l border-blue-400/40 pl-3.5">
              <div className="text-sm sm:text-base font-bold tracking-wide uppercase leading-tight">
                Department Student Information System
              </div>
              <div className="text-xs text-blue-200 font-medium">
                Department of Artificial Intelligence & Data Science
              </div>
            </div>
          </div>

          {/* Right: User Information & Logout */}
          {user && (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs text-blue-200 uppercase tracking-wider font-semibold">
                  {user.role === 'ADMIN' ? 'Administrator' : `Student (${user.registerNo})`}
                </span>
                <span className="text-sm font-semibold truncate max-w-[200px]">
                  {user.name}
                </span>
              </div>

              <div className="h-8 w-px bg-blue-400/30 hidden sm:block"></div>

              <button
                onClick={logout}
                title="Sign out of portal"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded border border-blue-300/40 hover:bg-gov-navy-dark hover:border-white transition-colors"
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
