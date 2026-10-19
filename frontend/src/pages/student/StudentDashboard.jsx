import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MultiStepForm } from './MultiStepForm';
import { ProfileSummaryPrint } from './ProfileSummaryPrint';
import { Edit3, Printer, HelpCircle, ChevronDown, ChevronUp, FileText, Lock, Phone, Mail } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'summary'
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: 'How do I log in and what is my password format?',
      a: 'Your username is your university Register Number (e.g., 71762105001). Your default password is your Date of Birth in DDMMYYYY format with no spaces or symbols (for example, if your DOB is 14-May-2005, enter 14052005).'
    },
    {
      q: 'What file formats and sizes are permitted for document uploads?',
      a: 'Allowed formats: PDF, JPG, JPEG, PNG, and WebP. The maximum file size per document is 2 MB. Ensure uploaded certificates and passbook scans are clear and legible.'
    },
    {
      q: 'Why has my student profile become locked?',
      a: 'When you accept the declaration and submit the form, or when the department administrator verifies your records, your profile is automatically locked to preserve finalized data for university submission. If you need any corrections, contact the department tutor.'
    },
    {
      q: 'Whom should I contact if I need help or a password reset?',
      a: 'Contact the AI & DS Department Office via phone (+91 4374 245522) or email (aids@aamec.edu.in). The department administrator can reset your password back to your Date of Birth or unlock your profile if necessary.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Welcome Bar */}
      <div className="bg-white border border-gov-border rounded p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-lg font-bold text-gov-navy tracking-tight">
              Welcome, {user?.name}
            </h1>
            <StatusBadge status={user?.status} isLocked={user?.isLocked} />
          </div>
          <p className="text-xs text-gov-subtle mt-1">
            Register Number: <span className="font-semibold text-gray-800 font-mono">{user?.registerNo}</span> | Year {user?.year} | Section {user?.section} | Artificial Intelligence & Data Science
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 shrink-0">
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

      {/* Expandable Student Helpdesk & FAQ Accordion */}
      <div className="bg-white border border-gov-border rounded-md shadow-xs p-4 sm:p-5 no-print">
        <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
          <HelpCircle className="w-4 h-4 text-gov-navy shrink-0" />
          <h2 className="text-sm font-bold text-gov-navy uppercase tracking-wider">
            Frequently Asked Questions & Helpdesk
          </h2>
        </div>

        <div className="mt-3 divide-y divide-gray-100 text-xs">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-2.5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-semibold text-gray-800 hover:text-gov-navy gap-2 py-1"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gov-navy shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-2 text-gray-600 leading-relaxed pl-1 text-[11.5px] bg-blue-50/50 p-2.5 rounded border border-blue-100/60">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

