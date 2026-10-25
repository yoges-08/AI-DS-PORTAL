import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuthModal } from '../../context/AuthModalContext';
import { HeroRobot } from './HeroRobot';
import '../../styles/heroStage.css';
import { 
  ShieldCheck, 
  ArrowRight, 
  GraduationCap, 
  Sparkles, 
  CheckCircle, 
  Lock, 
  UserPlus
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const Hero = () => {
  const { openLogin } = useAuthModal();
  const heroRef = useRef(null);
  const leftColRef = useRef(null);
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
  const dossierRef = useRef(null);

  // 1. Mouse-driven subtle parallax for voxel hills
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

  // 2. High-Caliber GSAP ScrollTrigger 3D Stereoscopic Experience
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Intro entrance timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(badgeRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 })
        .fromTo(titleRef.current, { y: 35, opacity: 0, rotationX: 14, transformPerspective: 900 }, { y: 0, opacity: 1, rotationX: 0, duration: 0.85 }, '-=0.4')
        .fromTo(descRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65 }, '-=0.5')
        .fromTo(ctaRef.current, { y: 20, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.6 }, '-=0.4')
        .fromTo(trustRef.current, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.3')
        .fromTo(robotWrapRef.current, { scale: 0.85, opacity: 0, y: 40 }, { scale: 1, opacity: 1, y: 0, duration: 1.1, ease: 'back.out(1.25)' }, '-=0.8');

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
          y: 75,
          x: -45,
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
          y: 140,
          x: 50,
          ease: 'none'
        });
      }

      // Giant Typography "AI" (Back): Drifts up & left in 3D depth
      if (giantBackRef.current) {
        gsap.to(giantBackRef.current, {
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.3
          },
          x: -110,
          y: -140,
          opacity: 0.2,
          ease: 'none'
        });
      }

      // Giant Typography "DS" (Front): Drifts down & right in 3D depth
      if (giantFrontRef.current) {
        gsap.to(giantFrontRef.current, {
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1
          },
          x: 95,
          y: 115,
          scale: 1.1,
          opacity: 0.45,
          ease: 'none'
        });
      }

      // 3D Robot Mascot: Ascends gracefully towards viewer on scroll
      if (robotWrapRef.current) {
        gsap.to(robotWrapRef.current, {
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1
          },
          y: -85,
          scale: 1.05,
          rotationZ: 3.5,
          ease: 'none'
        });
      }

      // Compact Dossier Card: Slides smoothly
      if (dossierRef.current) {
        gsap.to(dossierRef.current, {
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.1
          },
          y: -50,
          x: -25,
          opacity: 0.2,
          ease: 'none'
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={heroRef} 
      id="hero" 
      className="hero-stage pt-12 pb-16 sm:pt-20 sm:pb-24 relative overflow-hidden"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">

          {/* Left Column: Headline, Description & CTAs (6 cols on lg) */}
          <div 
            ref={leftColRef}
            className="lg:col-span-6 min-w-0 space-y-6 text-center lg:text-left relative z-10"
          >
            
            {/* Pill Badge */}
            <div ref={badgeRef}>
              <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/12 border border-white/25 text-white text-xs font-bold tracking-wide uppercase max-w-full backdrop-blur-md shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                <span className="truncate">Official Departmental Portal &bull; Anna University</span>
              </div>
            </div>

            {/* Main Title with Executive Sunset High-Contrast Gradient */}
            <h1 
              ref={titleRef}
              className="text-[2rem] min-[400px]:text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]"
            >
              Department Student <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-sky-200 via-white to-amber-200 bg-clip-text text-transparent drop-shadow-md">
                Information System
              </span>
            </h1>

            {/* Subtitle */}
            <p 
              ref={descRef}
              className="text-base sm:text-lg text-white/85 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal"
            >
              A confidential academic registry and dossier repository for students, faculty, and administrators of the <strong className="text-white">Department of Artificial Intelligence &amp; Data Science</strong> at Anjalai Ammal Mahalingam Engineering College.
            </p>

            {/* Action Buttons with High-Class Contrast */}
            <div 
              ref={ctaRef}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2"
            >
              <button
                onClick={() => openLogin('STUDENT')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 min-h-[48px] rounded-2xl bg-white text-[#14205a] hover:bg-amber-50 font-bold text-sm shadow-xl shadow-black/20 transition-all transform active:scale-95 hover:-translate-y-0.5 cursor-pointer group"
              >
                <GraduationCap className="w-5 h-5 shrink-0" />
                <span>Student &amp; Faculty Sign In</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => openLogin('SIGNUP')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/35 backdrop-blur-md transition-all transform active:scale-95 hover:-translate-y-0.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-amber-200 shrink-0" />
                <span>First-Time Registration</span>
              </button>
            </div>

            {/* Trust & Compliance Micro-Badges */}
            <div 
              ref={trustRef}
              className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-white/80 font-medium"
            >
              <div className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>AES-256 Encrypted Records</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-sky-300" />
                <span>Anna University Gazette Formats</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-200" />
                <span>Private Dossier Vault</span>
              </div>
            </div>

          </div>

          {/* Right Column: 3D Robot Mascot Stage with Giant 3D Layered Typography */}
          <div className="lg:col-span-6 min-w-0 relative overflow-visible min-h-[380px] sm:min-h-[480px] lg:min-h-[600px] flex items-center justify-center">
            
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

            {/* Giant 3D Layered Typography "DS" (In Front of Robot) */}
            <div 
              ref={giantFrontRef}
              className="hero-giant hero-giant--front" 
              aria-hidden="true"
            >
              DS
            </div>

            {/* Compact Floating Glass Academic Dossier Card */}
            <div 
              ref={dossierRef}
              className="hero-dossier hidden lg:block absolute z-[5] left-0 bottom-10 w-64 p-4 space-y-3 text-xs shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white leading-tight">Academic Dossier</p>
                    <p className="text-[11px] text-white/70">Live registry sample</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-emerald-950 shadow-xs">
                  VERIFIED
                </span>
              </div>

              <div className="space-y-1.5 text-white/90">
                <div className="flex justify-between">
                  <span className="text-white/70">Register No.</span>
                  <span className="font-mono font-bold text-white">71762305041</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Department</span>
                  <span className="font-bold text-amber-200">B.Tech AI &amp; DS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Year &amp; Section</span>
                  <span className="font-bold text-white">II &bull; A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Document Vault</span>
                  <span className="font-bold text-emerald-300">8 files stored</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
