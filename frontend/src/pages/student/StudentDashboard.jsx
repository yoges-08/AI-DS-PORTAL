import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MultiStepForm } from './MultiStepForm';
import { ProfileSummaryPrint } from './ProfileSummaryPrint';
import { Edit3, FileText, Printer, Shield, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'summary'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Welcome Bar */}
      <div className="bg-white border border-gov-border rounded p-4 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-lg font-bold text-gov-navy tracking-tight">
              Welcome, {user?.name}
            </h1>
            <StatusBadge status={user?.status} isLocked={user?.isLocked} />
          </div>
          <p className="text-xs text-gov-subtle mt-1">
            Register Number: <span className="font-semibold text-gray-800">{user?.registerNo}</span> | Year {user?.year} | Section {user?.section} | Artificial Intelligence & Data Science
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('form')}
            className={`inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded border transition-colors ${
              activeTab === 'form'
                ? 'bg-gov-navy text-white border-gov-navy shadow-sm'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
            <span>{user?.isLocked ? 'View Form' : 'Update Details Form'}</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded border transition-colors ${
              activeTab === 'summary'
                ? 'bg-gov-navy text-white border-gov-navy shadow-sm'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            <span>Print Profile Summary</span>
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {activeTab === 'form' ? (
        <MultiStepForm onComplete={() => setActiveTab('summary')} />
      ) : (
        <ProfileSummaryPrint onBack={() => setActiveTab('form')} />
      )}

    </div>
  );
};
