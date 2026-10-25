import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuthModal } from '../../context/AuthModalContext';
import { AiNeuralScene3D } from './AiNeuralScene3D';
import { 
  ShieldCheck, 
  ArrowRight, 
  GraduationCap, 
  Sparkles, 
  CheckCircle, 
  Lock, 
  UserPlus,
  Cpu,
  Boxes,
  Activity,
  Layers
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const Hero = () => {
  const { openLogin } = useAuthModal();
  const heroRef = useRef(null);
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);
  const badgeRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const ctaRef = useRef(null);
  const trustRef = useRef(null);
  const cardTiltRef = useRef(null);

  const [tiltStyle, setTiltStyle] = useState({});
  const [activeView, setActiveView] = useState('3D'); // '3D' | 'DOSSIER'

  // 1. GSAP Hero Entrance & ScrollTrigger Parallax
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Intro timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(badgeRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 })
        .fromTo(titleRef.current, { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.4')
        .fromTo(descRef.current, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5')
        .fromTo(ctaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.4')
        .fromTo(trustRef.current, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.3')
        .fromTo(rightColRef.current, { scale: 0.92, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 1, ease: 'back.out(1.2)' }, '-=0.8');

      // ScrollTrigger Parallax as user scrolls past hero
      gsap.to(leftColRef.current, {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2
        },
        y: -90,
        opacity: 0.35,
        ease: 'none'
      });

      gsap.to(rightColRef.current, {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        },
        y: -50,
        scale: 0.96,
        ease: 'none'
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // 2. Interactive 3D Card Tilt Physics for the Academic Dossier
  const handleCardMouseMove = (e) => {
    const card = cardTiltRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out'
    });
  };

  const handleCardMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s ease-out'
    });
  };

  return (
    <section 
      ref={heroRef} 
      id="hero" 
      className="relative pt-10 pb-20 sm:pt-16 sm:pb-28 overflow-hidden"
    >
      
      {/* Subtle Ambient Background Light Blobs */}
      <div className="absolute w-[500px] h-[500px] bg-blue-300/30 -top-20 -left-20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute w-[600px] h-[600px] bg-sky-200/35 top-32 -right-32 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute w-96 h-96 bg-indigo-200/25 bottom-0 left-1/3 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Description & CTAs (6 cols on lg) */}
          <div 
            ref={leftColRef}
            className="lg:col-span-6 space-y-6 text-center lg:text-left"
          >
            
            {/* Pill Badge */}
            <div ref={badgeRef}>
              <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 shadow-xs text-blue-700 text-[11px] sm:text-xs font-bold tracking-wide uppercase max-w-full">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Official Department Portal &bull; Anna University</span>
              </div>
            </div>

            {/* Main Title with Gradient Highlight */}
            <h1 
              ref={titleRef}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]"
            >
              Department Student <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 bg-clip-text text-transparent">
                Information System
              </span>
            </h1>

            {/* Subtitle */}
            <p 
              ref={descRef}
              className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal"
            >
              Confidential academic dossier vault and student information pipeline for the <strong>Department of Artificial Intelligence &amp; Data Science</strong> at Anjalai Ammal Mahalingam Engineering College.
            </p>

            {/* Action Buttons */}
            <div 
              ref={ctaRef}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2"
            >
              <button
                onClick={() => openLogin('STUDENT')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 hover:-translate-y-0.5 cursor-pointer group"
              >
                <GraduationCap className="w-5 h-5 shrink-0" />
                <span>Student &amp; Faculty Sign In</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => openLogin('SIGNUP')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200/90 shadow-xs transition-all transform active:scale-95 hover:-translate-y-0.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-blue-600 shrink-0" />
                <span>First-Time Registration</span>
              </button>
            </div>

            {/* Trust & Compliance Micro-Badges */}
            <div 
              ref={trustRef}
              className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-slate-500 font-medium"
            >
              <div className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>AES-256 Encrypted Records</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>Anna University Gazette</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>Private Dossier Vault</span>
              </div>
            </div>

          </div>

          {/* Right Column: 3D Interactive Hero Canvas & Academic Dossier (6 cols on lg) */}
          <div 
            ref={rightColRef}
            className="lg:col-span-6 flex flex-col items-center justify-center relative"
          >
            
            {/* View Switcher Pill Tabs (3D Neural Core vs Academic Dossier) */}
            <div className="flex items-center p-1 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm mb-4 self-center z-20">
              <button
                onClick={() => setActiveView('3D')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === '3D'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>3D Neural AI Core</span>
              </button>

              <button
                onClick={() => setActiveView('DOSSIER')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'DOSSIER'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Academic Dossier</span>
              </button>
            </div>

            {/* Container for the 3D Experience or 3D Tilt Card */}
            <div className="relative w-full max-w-lg min-h-[460px] sm:min-h-[500px] flex items-center justify-center">
              
              {/* Subtle Backing Halo */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/15 via-sky-500/20 to-indigo-600/15 rounded-3xl blur-2xl -z-10" />

              {/* View 1: 3D AI Neural Synapse Galaxy */}
              {activeView === '3D' && (
                <div className="w-full h-[460px] sm:h-[500px] rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-2xl overflow-hidden relative group">
                  
                  {/* Top Bar inside 3D Box */}
                  <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between text-xs pointer-events-none">
                    <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/60 text-slate-300 font-mono text-[11px]">
                      <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                      <span>AI &amp; DS QUANTUM SYNAPSE</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-400/20 text-cyan-300 text-[10px] font-mono">
                      <span>DRAG OR MOVE CURSOR</span>
                    </div>
                  </div>

                  {/* Pure Three.js 3D Canvas */}
                  <AiNeuralScene3D className="w-full h-full" interactive={true} />

                  {/* Bottom Interactive Callout */}
                  <div className="absolute bottom-3 right-4 z-10">
                    <button
                      onClick={() => setActiveView('DOSSIER')}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold backdrop-blur-md border border-white/20 transition-all flex items-center gap-1 shadow-sm"
                    >
                      <span>View Student Dossier</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* View 2: Interactive 3D Tilt Academic Dossier Card */}
              {activeView === 'DOSSIER' && (
                <div
                  ref={cardTiltRef}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                  style={tiltStyle}
                  className="w-full relative glass-card-white p-6 sm:p-7 space-y-4 sm:space-y-5 rounded-3xl border border-white/80 shadow-2xl shadow-blue-900/10 transition-shadow bg-white/95"
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shadow-xs">
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
                    className="w-full py-3 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Sign In to Access Your Records</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      onClick={() => setActiveView('3D')}
                      className="text-blue-600 hover:text-blue-800 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Back to 3D Neural View</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
