import React from 'react';
import { useAuthModal } from '../../context/AuthModalContext';
import { 
  ShieldCheck, 
  ArrowRight, 
  GraduationCap, 
  Sparkles, 
  CheckCircle, 
  Lock, 
  FileCheck,
  UserPlus
} from 'lucide-react';

export const Hero = () => {
  const { openLogin } = useAuthModal();

  return (
    <section id="hero" className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
      
      {/* Subtle Ambient Background Light Blobs */}
      <div className="light-blob w-96 h-96 bg-blue-300/40 -top-10 -left-10" />
      <div className="light-blob w-[500px] h-[500px] bg-sky-200/45 top-40 -right-20" />
      <div className="light-blob w-80 h-80 bg-indigo-200/30 bottom-10 left-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Description & CTAs (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 shadow-sm text-blue-700 text-[11px] sm:text-xs font-bold tracking-wide uppercase max-w-full">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">Official Departmental Portal &bull; Anna University</span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.14]">
              Department Student <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 bg-clip-text text-transparent">
                Information System
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              A confidential academic registry and dossier repository for students, faculty, and administrators of the <strong>Department of Artificial Intelligence & Data Science</strong> at Anjalai Ammal Mahalingam Engineering College.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={() => openLogin('STUDENT')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all active:scale-95 cursor-pointer"
              >
                <GraduationCap className="w-5 h-5" />
                <span>Student &amp; Faculty Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => openLogin('SIGNUP')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200/90 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>First-Time Registration</span>
              </button>
            </div>

            {/* Trust & Compliance Micro-Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-slate-500 font-medium">
              <div className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>AES-256 Encrypted Records</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>Anna University Gazette Formats</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>Private Dossier Vault</span>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Interactive Glass Dossier Card (5 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md">
              
              {/* Backing Ambient Halo */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/15 via-sky-500/20 to-indigo-600/15 rounded-3xl blur-xl" />

              {/* Glass Dossier Presentation Card */}
              <div className="relative glass-card-white p-4 sm:p-7 space-y-4 sm:space-y-5">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">Academic Dossier</h3>
                      <p className="text-[11px] text-slate-500">Live Registry Sample View</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    VERIFIED
                  </span>
                </div>

                {/* Candidate Info Sample */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Register Number</span>
                    <span className="font-mono font-bold text-slate-900">71762305041</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Department</span>
                    <span className="font-semibold text-blue-700">B.Tech AI &amp; DS</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Year &amp; Section</span>
                    <span className="font-bold text-slate-900">Year II &bull; Section A</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">First Graduate (FG)</span>
                    <span className="font-semibold text-emerald-700">Eligible (Verified)</span>
                  </div>
                </div>

                {/* Quick Security Status */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Document Vault</div>
                    <div className="font-bold text-blue-800 mt-0.5">8 Files Stored</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Verification</div>
                    <div className="font-bold text-emerald-800 mt-0.5">DOTE Approved</div>
                  </div>
                </div>

                {/* Interactive Direct Action Button */}
                <button
                  onClick={() => openLogin('STUDENT')}
                  className="w-full py-3 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer"
                >
                  <span>Sign In to Access Your Records</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
