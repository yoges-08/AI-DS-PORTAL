import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuthModal } from '../../context/AuthModalContext';
import { HeroRobot } from './HeroRobot';
import { AiNeuralScene3D } from './AiNeuralScene3D';
import '../../styles/heroStage.css';
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
  Bot,
  Zap,
  Award
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
  
  // Parallax elements refs
  const hillFarRef = useRef(null);
  const hillNearRef = useRef(null);
  const giantBackRef = useRef(null);
  const giantFrontRef = useRef(null);
  const robotWrapRef = useRef(null);
  const cardTiltRef = useRef(null);

  const [tiltStyle, setTiltStyle] = useState({});
  const [activeView, setActiveView] = useState('ROBOT'); // 'ROBOT' | 'QUANTUM' | 'DOSSIER'

  // 1. Mouse-driven stereoscopic parallax for the voxel hills
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof window === 'undefined') return undefined;
    if (
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return undefined;
    }
    let raf = 0;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const px = (e.clientX / window.innerWidth) * 2 - 1;
        el.style.setProperty('--px', px.toFixed(3));
      });
    };
    el.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      el.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // 2. High-Caliber GSAP ScrollTrigger 3D Orchestration
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Intro timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(badgeRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 })
        .fromTo(titleRef.current, { y: 35, opacity: 0, rotationX: 12, transformPerspective: 800 }, { y: 0, opacity: 1, rotationX: 0, duration: 0.8 }, '-=0.4')
        .fromTo(descRef.current, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5')
        .fromTo(ctaRef.current, { y: 20, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.6 }, '-=0.4')
        .fromTo(trustRef.current, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.3')
        .fromTo(rightColRef.current, { scale: 0.88, opacity: 0, y: 35 }, { scale: 1, opacity: 1, y: 0, duration: 1, ease: 'back.out(1.2)' }, '-=0.8');

      // ScrollTrigger 3D Stereoscopic Parallax Scrub
      // Left Column Content: Smooth perspective lift and fade
      gsap.to(leftColRef.current, {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2
        },
        y: -110,
        opacity: 0.25,
        scale: 0.94,
        ease: 'none'
      });

      // Far Voxel Hill: Parallaxes slowly down
      if (hillFarRef.current) {
        gsap.to(hillFarRef.current, {
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.4
          },
          y: 70,
          x: -40,
          ease: 'none'
        });
      }

      // Near Voxel Hill: Parallaxes faster for deep stereoscopic distance
      if (hillNearRef.current) {
        gsap.to(hillNearRef.current, {
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1
          },
          y: 130,
          x: 45,
          ease: 'none'
        });
      }

      // Giant Typography "AI" (Back): Drifts up & left
      if (giantBackRef.current) {
        gsap.to(giantBackRef.current, {
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.3
          },
          x: -100,
          y: -130,
          opacity: 0.25,
          ease: 'none'
        });
      }

      // Giant Typography "DS" (Front): Drifts down & right
      if (giantFrontRef.current) {
        gsap.to(giantFrontRef.current, {
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1
          },
          x: 90,
          y: 110,
          scale: 1.08,
          opacity: 0.45,
          ease: 'none'
        });
      }

      // 3D Robot / Showcase Mascot: Ascends as if levitating towards viewer
      if (robotWrapRef.current) {
        gsap.to(robotWrapRef.current, {
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1
          },
          y: -75,
          scale: 1.04,
          rotationZ: 3,
          ease: 'none'
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // 3. Interactive 3D Card Tilt Physics for Dossier View
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
      transition: 'transform 0.08s ease-out'
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
      className="hero-stage pt-10 pb-16 sm:pt-16 sm:pb-24 relative overflow-hidden"
    >
      
      {/* Voxel Hills Background with Stereoscopic Parallax */}
      <div className="hero-hills" aria-hidden="true">
        <svg viewBox="0 0 1440 600" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <defs>
            <pattern id="heroVoxel" width="16" height="16" patternUnits="userSpaceOnUse">
              <rect width="16" height="16" fill="rgba(0,0,0,0)" />
              <rect x="1" y="1" width="13" height="13" rx="2.5" fill="rgba(20,6,40,0.28)" />
              <rect x="1" y="1" width="13" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
            </pattern>
            <linearGradient id="heroHillFar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b8506a" />
              <stop offset="1" stopColor="#6d2f6a" />
            </linearGradient>
            <linearGradient id="heroHillNear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8a3a5c" />
              <stop offset="1" stopColor="#3d1d4f" />
            </linearGradient>
          </defs>
          <g ref={hillFarRef} className="hero-hills__far">
            <path d="M-40 330 C 160 250 300 260 460 310 C 620 360 760 250 940 240 C 1100 232 1240 300 1480 270 L1480 620 L-40 620 Z" fill="url(#heroHillFar)" />
            <path d="M-40 330 C 160 250 300 260 460 310 C 620 360 760 250 940 240 C 1100 232 1240 300 1480 270 L1480 620 L-40 620 Z" fill="url(#heroVoxel)" />
          </g>
          <g ref={hillNearRef} className="hero-hills__near">
            <path d="M-60 430 C 120 380 280 360 430 400 C 600 446 740 470 900 410 C 1060 350 1220 360 1500 430 L1500 620 L-60 620 Z" fill="url(#heroHillNear)" />
            <path d="M-60 430 C 120 380 280 360 430 400 C 600 446 740 470 900 410 C 1060 350 1220 360 1500 430 L1500 620 L-60 620 Z" fill="url(#heroVoxel)" />
          </g>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Executive Micro Telemetry Stream */}
        <div className="flex items-center justify-center lg:justify-start mb-6">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-white/20 text-white shadow-lg backdrop-blur-md text-[10.5px] sm:text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>SYS: ONLINE</span>
            </span>
            <span className="text-white/20">&bull;</span>
            <span className="text-cyan-200 hidden min-[400px]:inline">AICTE #7176-AIDS</span>
            <span className="text-white/20 hidden sm:inline">&bull;</span>
            <span className="text-amber-200 hidden sm:inline">ANNA UNIV. REG 2021</span>
            <span className="text-white/20">&bull;</span>
            <span className="text-sky-300 font-semibold">AES-256 VAULT</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">

          {/* Left Column: Headline, Description & CTAs (6 cols on lg) */}
          <div 
            ref={leftColRef}
            className="lg:col-span-6 min-w-0 space-y-6 text-center lg:text-left relative z-10"
          >
            
            {/* Pill Badge */}
            <div ref={badgeRef}>
              <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/12 border border-white/25 text-white text-xs font-bold tracking-wide uppercase max-w-full backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate">Official Department Portal &bull; Anna University</span>
              </div>
            </div>

            {/* Main Title with Executive Sunset High-Contrast Gradient */}
            <h1 
              ref={titleRef}
              className="text-[2.2rem] min-[400px]:text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]"
            >
              Department Student <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-sky-200 via-white to-amber-200 bg-clip-text text-transparent drop-shadow-md">
                Information System
              </span>
            </h1>

            {/* Subtitle */}
            <p 
              ref={descRef}
              className="text-base sm:text-lg text-white/90 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal"
            >
              A confidential academic registry and dossier repository for students, faculty, and administrators of the <strong className="text-white font-bold">Department of Artificial Intelligence &amp; Data Science</strong> at Anjalai Ammal Mahalingam Engineering College.
            </p>

            {/* Action Buttons */}
            <div 
              ref={ctaRef}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2"
            >
              <button
                onClick={() => openLogin('STUDENT')}
                className="w-full sm:w-auto btn-shiny inline-flex items-center justify-center gap-2.5 px-6 py-3.5 min-h-[48px] rounded-2xl bg-white text-[#14205a] hover:bg-amber-50 font-bold text-sm shadow-xl shadow-black/25 transition-all transform active:scale-95 hover:-translate-y-0.5 cursor-pointer group"
              >
                <GraduationCap className="w-5 h-5 shrink-0" />
                <span>Student &amp; Faculty Sign In</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => openLogin('SIGNUP')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] rounded-2xl bg-white/12 hover:bg-white/20 text-white font-bold text-sm border border-white/35 backdrop-blur-md transition-all transform active:scale-95 hover:-translate-y-0.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-amber-200 shrink-0" />
                <span>First-Time Registration</span>
              </button>
            </div>

            {/* Trust & Compliance Micro-Badges */}
            <div 
              ref={trustRef}
              className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-white/85 font-medium"
            >
              <div className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>AES-256 Encrypted Records</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-sky-200" />
                <span>Anna University Gazette Formats</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-200" />
                <span>Private Dossier Vault</span>
              </div>
            </div>

          </div>

          {/* Right Column: 3D Stage with Robot, Giant 3D Typography & Quantum Toggle */}
          <div 
            ref={rightColRef}
            className="lg:col-span-6 min-w-0 flex flex-col items-center justify-center relative"
          >
            
            {/* View Switcher Controls (Robot vs 3D Quantum Field vs Dossier) */}
            <div className="flex items-center p-1 bg-white/15 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg mb-4 self-center z-20">
              <button
                onClick={() => setActiveView('ROBOT')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'ROBOT'
                    ? 'bg-white text-[#14205a] shadow-md font-extrabold'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>3D AI Mascot</span>
              </button>

              <button
                onClick={() => setActiveView('QUANTUM')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'QUANTUM'
                    ? 'bg-white text-[#14205a] shadow-md font-extrabold'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Quantum Field</span>
              </button>

              <button
                onClick={() => setActiveView('DOSSIER')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'DOSSIER'
                    ? 'bg-white text-[#14205a] shadow-md font-extrabold'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Academic Dossier</span>
              </button>
            </div>

            {/* Container for the 3D Stage */}
            <div className="relative w-full min-h-[380px] sm:min-h-[460px] lg:min-h-[580px] flex items-center justify-center">

              {/* View 1: 3D Robot Mascot sandwiched between giant 3D AI and DS letters */}
              {activeView === 'ROBOT' && (
                <div className="w-full relative flex items-center justify-center">
                  
                  {/* Giant 3D Layered Typography "AI" (Behind Robot) */}
                  <div 
                    ref={giantBackRef}
                    className="hero-giant hero-giant--back" 
                    aria-hidden="true"
                  >
                    AI
                  </div>

                  {/* 3D Cursor-Interactive Robot Mascot */}
                  <div 
                    ref={robotWrapRef}
                    className="relative z-[2] w-full"
                  >
                    <HeroRobot trackRef={heroRef} />
                  </div>

                  {/* Giant 3D Layered Typography "DS" (In front of Robot) */}
                  <div 
                    ref={giantFrontRef}
                    className="hero-giant hero-giant--front" 
                    aria-hidden="true"
                  >
                    DS
                  </div>

                  {/* Compact floating Academic Dossier preview card */}
                  <div className="hero-dossier hidden sm:block absolute z-[5] left-0 bottom-4 w-60 p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">Academic Dossier</p>
                          <p className="text-[11px] text-white/70">Live registry sample</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-emerald-950">VERIFIED</span>
                    </div>
                    <div className="space-y-1.5 text-white/90">
                      <div className="flex justify-between"><span>Register No.</span><span className="font-mono font-bold text-white">71762305041</span></div>
                      <div className="flex justify-between"><span>Year &amp; Section</span><span className="font-bold text-white">II &bull; A</span></div>
                      <div className="flex justify-between"><span>Document Vault</span><span className="font-bold text-white">8 files</span></div>
                    </div>
                  </div>

                </div>
              )}

              {/* View 2: 1,200-Particle 3D Quantum AI Tensor Field */}
              {activeView === 'QUANTUM' && (
                <div className="w-full h-[460px] sm:h-[520px] rounded-3xl bg-slate-950/90 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden relative">
                  <AiNeuralScene3D className="w-full h-full" interactive={true} />
                </div>
              )}

              {/* View 3: Full-Size 3D Tilt Academic Dossier Card */}
              {activeView === 'DOSSIER' && (
                <div
                  ref={cardTiltRef}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                  style={tiltStyle}
                  className="w-full max-w-md relative hero-dossier p-6 sm:p-7 space-y-4 rounded-3xl shadow-2xl transition-shadow bg-white/15"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-white text-[#14205a] flex items-center justify-center font-bold shadow-md">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">Academic Dossier</h3>
                        <p className="text-[11px] text-white/70">Official SIS Registry Record</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10.5px] font-bold bg-emerald-400 text-emerald-950 shadow-sm">
                      VERIFIED &bull; DOTE
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/25 border border-white/15 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Register Number</span>
                      <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-lg border border-white/20">
                        71762305041
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Department</span>
                      <span className="font-bold text-amber-200">B.Tech AI &amp; DS</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Year &amp; Section</span>
                      <span className="font-bold text-white">Year II &bull; Section A</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">First Graduate (FG)</span>
                      <span className="font-bold text-emerald-300">Eligible (Verified)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                      <div className="text-[10px] uppercase font-bold text-white/60">Document Vault</div>
                      <div className="font-bold text-white mt-0.5">8 Files Stored</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                      <div className="text-[10px] uppercase font-bold text-white/60">Verification</div>
                      <div className="font-bold text-emerald-300 mt-0.5">DOTE Approved</div>
                    </div>
                  </div>

                  <button
                    onClick={() => openLogin('STUDENT')}
                    className="w-full py-3 min-h-[44px] rounded-xl bg-white text-[#14205a] hover:bg-amber-50 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Sign In to Access Your Records</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
