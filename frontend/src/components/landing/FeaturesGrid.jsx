import React from 'react';
import { 
  UserCheck, 
  ShieldCheck, 
  FileSpreadsheet, 
  Award, 
  Lock, 
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuthModal } from '../../context/AuthModalContext';

export const FeaturesGrid = () => {
  const { openLogin } = useAuthModal();

  const features = [
    {
      icon: UserCheck,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      title: 'Live Whitelist Self-Signup',
      desc: 'Students verify Anna University Register Number and Date of Birth against pre-registered cohort lists before creating accounts with their chosen passwords.'
    },
    {
      icon: ShieldCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      title: 'Encrypted Document Vault',
      desc: 'Private cloud storage for student certificates, 10th & 12th marksheets, Aadhaar, and bank passbooks with automatic mime-type validation and access control.'
    },
    {
      icon: FileSpreadsheet,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      title: 'Official Gazette Dossiers',
      desc: 'Generate printable A4 student dossiers and custom Excel rosters filtered by year, section, community, scholarship status, and admission quota.'
    },
    {
      icon: Award,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      title: 'Scholarship Verifications',
      desc: 'Automated verification workflows for First Graduate (FG) and Post-Matric Scholarship (PMS) beneficiaries with dedicated administrative review.'
    },
    {
      icon: Lock,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      title: 'Institutional Audit Trails',
      desc: 'Permanent security logging for record locks, profile verifications, rejections with mandatory notes, and admin temporary key generations.'
    },
    {
      icon: Layers,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      title: 'Multi-Step Dossier Wizard',
      desc: 'Step-by-step profile builder covering personal bio-data, academic progression, parent details, communication addresses, and bank coordinates.'
    }
  ];

  return (
    <section id="features" className="py-20 sm:py-28 bg-slate-50/70 border-y border-slate-200/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Architecture &amp; Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built for Academic Precision &amp; Student Privacy
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Every feature is engineered to meet Anna University record compliance standards while ensuring students own and manage their confidential credentials securely.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="glass-card-feature p-6 sm:p-7 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${feat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openLogin('STUDENT')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>Explore in Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
