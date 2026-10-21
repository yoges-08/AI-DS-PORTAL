import React from 'react';
import { ShieldCheck, Zap, FolderLock, FileCheck2, Phone, Mail } from 'lucide-react';

/**
 * LoginHeroArt Component
 * Official AAMEC Department of AI & DS Portal Animated Hero
 */
export const LoginHeroArt = () => {
  return (
    <div className="aamec-hero-bg relative h-full min-h-[660px] rounded-[22px] overflow-hidden p-8 sm:p-12 flex flex-col justify-between text-white shadow-inner">
      
      {/* Top Branding Bar */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center space-x-2 bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-md shadow-sm">
            <img src="/college-logo.webp" alt="AAMEC College Crest" className="w-9 h-9 object-contain drop-shadow-sm" />
            <img src="/aids-logo.jpg" alt="AI & DS Emblem" className="w-9 h-9 rounded-full border border-white/80 object-cover shadow-sm" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-primary-fixed-dim uppercase tracking-wider block">
              Anjalai Ammal Mahalingam Engineering College
            </span>
            <span className="text-sm sm:text-base font-bold text-white tracking-tight">
              Dept. of Artificial Intelligence &amp; Data Science
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 shadow-sm text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 status-beacon" />
          <span className="font-medium">Core Systems Nominal</span>
        </div>
      </div>

      {/* Mid Hero Content */}
      <div className="relative z-10 my-auto py-8 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white mb-5 shadow-sm text-xs font-medium backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-cyan-300" />
          <span>Academic Year 2024–2025 &bull; Statutory UMIS Portal</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.12]">
          Department Student <br />
          Information System
        </h1>

        <p className="mt-4 text-sm sm:text-base text-primary-fixed-dim/90 leading-relaxed max-w-lg">
          Institutional master register for academic performance, statutory scholarship verifications (First Graduate &amp; Post-Matric), and encrypted document compliance.
        </p>

        {/* 3 Bento Feature Highlights with Staggered Float & Sheen */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/15">
          <div className="bento-card bento-card-1 bento-float-1 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-cyan-300 icon-pulse">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-white font-semibold">Instant Verification</div>
              <div className="text-[11px] text-primary-fixed-dim/80 leading-snug mt-0.5">Automated cohort audits &amp; record locks</div>
            </div>
          </div>

          <div className="bento-card bento-card-2 bento-float-2 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-cyan-300 icon-pulse">
              <FolderLock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-white font-semibold">Encrypted Vault</div>
              <div className="text-[11px] text-primary-fixed-dim/80 leading-snug mt-0.5">Cloudflare R2 private document storage</div>
            </div>
          </div>

          <div className="bento-card bento-card-3 bento-float-3 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-cyan-300 icon-pulse">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-white font-semibold">Official Reporting</div>
              <div className="text-[11px] text-primary-fixed-dim/80 leading-snug mt-0.5">A4 Gazette print dossier &amp; Excel export</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Meta with Official Contact Info */}
      <div className="relative z-10 flex flex-wrap items-center justify-between text-xs text-primary-fixed-dim/80 gap-3 pt-4 border-t border-white/15">
        <span>AAMEC &bull; AI &amp; DS Academic Registry</span>
        <div className="flex items-center space-x-3">
          <a href="tel:+919944823120" className="hover:text-white inline-flex items-center gap-1 transition-colors">
            <Phone className="w-3 h-3" /> +91 99448 23120
          </a>
          <span>&bull;</span>
          <a href="mailto:aamecaidsskill@gmail.com" className="hover:text-white inline-flex items-center gap-1 transition-colors text-cyan-300">
            <Mail className="w-3 h-3" /> aamecaidsskill@gmail.com
          </a>
        </div>
      </div>

    </div>
  );
};

export default LoginHeroArt;
