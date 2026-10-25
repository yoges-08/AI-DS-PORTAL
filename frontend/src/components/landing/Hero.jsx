import React from 'react';
import { motion } from 'framer-motion';
import { useAuthModal } from '../../context/AuthModalContext';
import { 
  ShieldCheck, 
  ArrowRight, 
  GraduationCap, 
  Sparkles, 
  CheckCircle, 
  Lock, 
  UserPlus
} from 'lucide-react';

export const Hero = () => {
  const { openLogin } = useAuthModal();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 24,
        stiffness: 280
      }
    }
  };

  return (
    <section id="hero" className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
      
      {/* Subtle Ambient Background Light Blobs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.35, 0.45, 0.35]
        }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        className="light-blob w-96 h-96 bg-blue-300/40 -top-10 -left-10" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.08, 1],
          opacity: [0.4, 0.5, 0.4]
        }}
        transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut', delay: 1 }}
        className="light-blob w-[500px] h-[500px] bg-sky-200/45 top-40 -right-20" 
      />
      <div className="light-blob w-80 h-80 bg-indigo-200/30 bottom-10 left-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Description & CTAs (7 cols) */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            
            {/* Pill Badge */}
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 shadow-sm text-blue-700 text-[11px] sm:text-xs font-bold tracking-wide uppercase max-w-full">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Official Departmental Portal &bull; Anna University</span>
              </div>
            </motion.div>

            {/* Main Title */}
            <motion.h1 
              variants={itemVariants}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.14]"
            >
              Department Student <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 bg-clip-text text-transparent">
                Information System
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal"
            >
              A confidential academic registry and dossier repository for students, faculty, and administrators of the <strong>Department of Artificial Intelligence & Data Science</strong> at Anjalai Ammal Mahalingam Engineering College.
            </motion.p>

            {/* Action Buttons with Interactive Framer Motion */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2"
            >
              {/* Primary Sign In Button with Spring Lift & Glow */}
              <motion.button
                onClick={() => openLogin('STUDENT')}
                whileHover={{ 
                  scale: 1.03, 
                  y: -2,
                  boxShadow: '0 14px 28px -6px rgba(37, 99, 235, 0.4)' 
                }}
                whileTap={{ scale: 0.97, y: 0 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-colors cursor-pointer group"
              >
                <GraduationCap className="w-5 h-5 shrink-0" />
                <span>Student &amp; Faculty Sign In</span>
                <motion.span
                  className="inline-block"
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.span>
              </motion.button>

              {/* Secondary Registration Button with Gentle Scale */}
              <motion.button
                onClick={() => openLogin('SIGNUP')}
                whileHover={{ 
                  scale: 1.02, 
                  y: -1,
                  backgroundColor: 'rgba(248, 250, 252, 1)',
                  boxShadow: '0 8px 16px -4px rgba(15, 23, 42, 0.08)' 
                }}
                whileTap={{ scale: 0.98, y: 0 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white text-slate-800 font-bold text-sm border border-slate-200/90 shadow-sm transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-blue-600 shrink-0" />
                <span>First-Time Registration</span>
              </motion.button>
            </motion.div>

            {/* Trust & Compliance Micro-Badges */}
            <motion.div 
              variants={itemVariants}
              className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-slate-500 font-medium"
            >
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
            </motion.div>

          </motion.div>

          {/* Right Column: Visual Interactive Glass Dossier Card (5 cols) with 3D Float Animation */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div 
              initial={{ opacity: 0, x: 30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 26, stiffness: 220, delay: 0.3 }}
              className="relative w-full max-w-md"
            >
              
              {/* Backing Ambient Halo */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.15, 0.25, 0.15]
                }}
                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                className="absolute -inset-2 bg-gradient-to-r from-blue-600/15 via-sky-500/20 to-indigo-600/15 rounded-3xl blur-xl" 
              />

              {/* Glass Dossier Presentation Card with Floating Sine-Wave Physics */}
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                whileHover={{ y: -12, scale: 1.015 }}
                className="relative glass-card-white p-4 sm:p-7 space-y-4 sm:space-y-5 transition-shadow hover:shadow-2xl hover:shadow-blue-900/10"
              >
                
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
                <motion.button
                  onClick={() => openLogin('STUDENT')}
                  whileHover={{ scale: 1.02, backgroundColor: '#0f172a' }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  className="w-full py-3 min-h-[44px] rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>Sign In to Access Your Records</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>

              </motion.div>
            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
};
