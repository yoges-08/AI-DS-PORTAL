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
  Terminal,
  Zap,
  Award,
  Layers,
  Database
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

  // 1. GSAP ScrollTrigger Cinematic Experience
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Intro timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(badgeRef.current, { y: 28, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.7 })
        .fromTo(titleRef.current, { y: 40, opacity: 0, rotationX: 15, transformPerspective: 800 }, { y: 0, opacity: 1, rotationX: 0, duration: 0.9 }, '-=0.4')
        .fromTo(descRef.current, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5')
        .fromTo(ctaRef.current, { y: 20, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.6 }, '-=0.4')
        .fromTo(trustRef.current, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.3')
        .fromTo(rightColRef.current, { scale: 0.88, opacity: 0, y: 40 }, { scale: 1, opacity: 1, y: 0, duration: 1.1, ease: 'back.out(1.25)' }, '-=0.8');

      // ScrollTrigger Cinematic Scrub (Parallax + 3D Depth Fly-through)
      gsap.to(leftColRef.current, {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2
        },
        y: -120,
        opacity: 0.2,
        scale: 0.94,
        ease: 'none'
      });

      gsap.to(rightColRef.current, {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        },
        y: -60,
        scale: 0.95,
        rotationY: -6,
        ease: 'none'
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // 2. Interactive 3D Card Tilt Physics with Dynamic Light Glint
  const handleCardMouseMove = (e) => {
    const card = cardTiltRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -14;
    const rotateY = ((x - centerX) / centerX) * 14;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.025, 1.025, 1.025)`,
      transition: 'transform 0.08s ease-out'
    });
  };

  const handleCardMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.6s ease-out'
    });
  };

  return (
    <section 
      ref={heroRef} 
      id="hero" 
      className="relative pt-6 pb-16 sm:pt-12 sm:pb-24 overflow-hidden bg-grid-cyber"
    >
      
      {/* Ambient Cyber Lighting Atmosphere */}
      <div className="absolute w-[600px] h-[600px] bg-blue-500/15 -top-28 -left-28 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute w-[700px] h-[700px] bg-cyan-400/20 top-20 -right-40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute w-[500px] h-[500px] bg-indigo-500/15 bottom-0 left-1/3 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Executive Micro Telemetry Stream */}
        <div className="flex items-center justify-center lg:justify-start mb-6">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 text-slate-300 shadow-md backdrop-blur-md text-[10.5px] sm:text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>SYS: ONLINE</span>
            </span>
            <span className="text-white/20">&bull;</span>
            <span className="text-cyan-300 hidden min-[400px]:inline">AICTE #7176-AIDS</span>
            <span className="text-white/20 hidden sm:inline">&bull;</span>
            <span className="text-slate-300 hidden sm:inline">ANNA UNIV. REG 2021</span>
            <span className="text-white/20">&bull;</span>
            <span className="text-blue-400 font-semibold">AES-256 VAULT</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Description & CTAs (6 cols on lg) */}
          <div 
            ref={leftColRef}
            className="lg:col-span-6 space-y-6 text-center lg:text-left"
          >
            
            {/* Pill Badge */}
            <div ref={badgeRef}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200 shadow-xs text-blue-700 text-[11px] sm:text-xs font-bold tracking-wide uppercase max-w-full backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Official Department Portal &bull; Anna University</span>
              </div>
            </div>

            {/* Main Title with Executive Gradient Highlight */}
            <h1 
              ref={titleRef}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]"
            >
              Department Student <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 bg-clip-text text-transparent drop-shadow-xs">
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

            {/* Action Buttons with High-Class Visual Finish */}
            <div 
              ref={ctaRef}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2"
            >
              <button
                onClick={() => openLogin('STUDENT')}
                className="w-full sm:w-auto btn-shiny inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all transform active:scale-95 hover:-translate-y-0.5 cursor-pointer group"
              >
                <GraduationCap className="w-5 h-5 shrink-0" />
                <span>Student &amp; Faculty Sign In</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => openLogin('SIGNUP')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white/95 hover:bg-white text-slate-800 font-bold text-sm border border-slate-300 shadow-xs hover:shadow-md transition-all transform active:scale-95 hover:-translate-y-0.5 cursor-pointer backdrop-blur-md"
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
            
            {/* View Switcher Pill Tabs */}
            <div className="flex items-center p-1 bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm mb-4 self-center z-20">
              <button
                onClick={() => setActiveView('3D')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeView === '3D'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>3D Quantum AI Field</span>
              </button>

              <button
                onClick={() => setActiveView('DOSSIER')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'DOSSIER'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Academic Dossier</span>
              </button>
            </div>

            {/* Container for the 3D Experience or 3D Tilt Card */}
            <div className="relative w-full max-w-lg min-h-[490px] sm:min-h-[530px] flex items-center justify-center">
              
              {/* Backing Ambient Halo Glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-blue-600/25 to-indigo-600/20 rounded-3xl blur-2xl -z-10" />

              {/* View 1: 3D Quantum AI Tensor Field */}
              {activeView === '3D' && (
                <div className="w-full h-[490px] sm:h-[530px] rounded-3xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl overflow-hidden relative group">
                  <AiNeuralScene3D className="w-full h-full" interactive={true} />
                </div>
              )}

              {/* View 2: Interactive 3D Tilt Academic Dossier Card */}
              {activeView === 'DOSSIER' && (
                <div
                  ref={cardTiltRef}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                  style={tiltStyle}
                  className="w-full relative hologram-border p-6 sm:p-7 space-y-4 sm:space-y-5 rounded-3xl shadow-2xl shadow-blue-900/10 transition-shadow bg-white/95"
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">Academic Dossier</h3>
                        <p className="text-[11px] text-slate-500">Official SIS Registry Record</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                      VERIFIED &bull; DOTE
                    </span>
                  </div>

                  {/* Candidate Info Sample */}
                  <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2.5 text-xs shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Register Number</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        71762305041
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Department</span>
                      <span className="font-bold text-blue-700">B.Tech AI &amp; DS</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Year &amp; Section</span>
                      <span className="font-bold text-slate-900">Year II &bull; Section A</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">First Graduate (FG)</span>
                      <span className="font-bold text-emerald-700">Eligible (Verified)</span>
                    </div>
                  </div>

                  {/* Quick Security Status */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Document Vault</div>
                      <div className="font-bold text-blue-800 mt-0.5">8 Files Stored</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Verification</div>
                      <div className="font-bold text-emerald-800 mt-0.5">DOTE Approved</div>
                    </div>
                  </div>

                  {/* Interactive Action Button */}
                  <button
                    onClick={() => openLogin('STUDENT')}
                    className="w-full py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Sign In to Access Your Records</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      onClick={() => setActiveView('3D')}
                      className="text-blue-600 hover:text-blue-800 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Back to 3D Quantum View</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Floating Satellite Badges */}
              <div className="hidden sm:flex absolute -top-4 -right-4 z-30 items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg text-[11px] font-bold text-slate-800 animate-bounce" style={{ animationDuration: '4s' }}>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>95 TFLOPS CUDA Lab</span>
              </div>

              <div className="hidden sm:flex absolute -bottom-4 -left-4 z-30 items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg text-[11px] font-bold text-slate-800 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>95%+ Tier-1 AI Placements</span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
