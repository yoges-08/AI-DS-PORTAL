import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MultiStepForm } from './MultiStepForm';
import { ProfileSummaryPrint } from './ProfileSummaryPrint';
import { 
  Edit3, 
  Printer, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Lock, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  GraduationCap
} from 'lucide-react';
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
      a: 'Contact the AI & DS Department Office via phone (+91 99448 23120) or email (aamecaidsskill@gmail.com). The department administrator can reset your password back to your Date of Birth or unlock your profile if necessary.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      
      {/* Top Welcome Card (Cupertino Glass Banner) */}
      <div className="glass-card-l2 rounded-2xl p-5 sm:p-7 shadow-sm border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-5 no-print">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center text-lg font-bold shadow-md shadow-primary/20 shrink-0 ring-1 ring-white/50">
            <GraduationCap className="w-6 h-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
                Welcome, {user?.name}
              </h1>
              <StatusBadge status={user?.status} isLocked={user?.isLocked} />
            </div>
            
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Register No: <strong className="font-mono text-primary">{user?.registerNo}</strong></span>
              <span className="text-outline-variant">•</span>
              <span>{user?.year ? `Year ${user.year}` : 'Year Pending'}</span>
              <span className="text-outline-variant">•</span>
              <span>{user?.section ? `Section ${user.section}` : 'Section Pending'}</span>
              <span className="text-outline-variant">•</span>
              <span className="text-secondary font-medium">Artificial Intelligence & Data Science</span>
            </p>
          </div>
        </div>

        {/* Sliding Segmented Tab Switcher */}
        <div className="p-1 bg-surface-variant/70 rounded-xl flex self-start md:self-center shrink-0 border border-outline-variant/30 select-none">
          <button
            onClick={() => setActiveTab('form')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'form'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{user?.isLocked ? 'View Dossier' : 'Update Details'}</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'summary'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print A4 Dossier</span>
          </button>
        </div>
      </div>

      {/* Missing Year/Section Alert Banner */}
      {(!user?.year || !user?.section) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-900 flex items-center justify-between no-print shadow-xs">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Action Required:</strong> Please complete your <strong>Year of Study</strong> and <strong>Section</strong> in Step 1 of the form.
            </span>
          </div>
          {activeTab !== 'form' && (
            <button
              onClick={() => setActiveTab('form')}
              className="text-xs font-bold text-amber-900 underline hover:text-amber-700 ml-2 whitespace-nowrap"
            >
              Go to Form &rarr;
            </button>
          )}
        </div>
      )}

      {/* Render Active View */}
      {activeTab === 'form' ? (
        <MultiStepForm onComplete={() => setActiveTab('summary')} />
      ) : (
        <ProfileSummaryPrint onBack={() => setActiveTab('form')} />
      )}

      {/* Expandable Student Helpdesk & FAQ Accordion */}
      <div className="glass-card-l1 rounded-2xl border border-white/80 p-5 sm:p-6 no-print shadow-xs">
        <div className="flex items-center space-x-2.5 pb-3.5 border-b border-outline-variant/30">
          <HelpCircle className="w-4 h-4 text-secondary shrink-0" />
          <h2 className="text-xs font-bold text-primary uppercase tracking-wider">
            Student Helpdesk & Guidance
          </h2>
        </div>

        <div className="mt-2 divide-y divide-outline-variant/20 text-xs">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-semibold text-on-surface hover:text-primary gap-2 py-1 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-secondary shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-outline shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-2 text-on-surface-variant leading-relaxed text-[12px] bg-surface-container/60 p-3 rounded-xl border border-outline-variant/30">
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
