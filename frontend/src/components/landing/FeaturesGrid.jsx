import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const FeaturesGrid = () => {
  const { openLogin } = useAuthModal();
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef([]);

  const features = [
    {
      num: '01',
      icon: UserCheck,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      badge: 'Real-time Verification',
      title: 'Live Whitelist Self-Signup',
      desc: 'Students verify Anna University Register Number and Date of Birth against pre-registered cohort lists before creating accounts with their chosen passwords.'
    },
    {
      num: '02',
      icon: ShieldCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      badge: 'Zero-Knowledge Privacy',
      title: 'Encrypted Document Vault',
      desc: 'Private cloud storage for student certificates, 10th & 12th marksheets, Aadhaar, and bank passbooks with automatic mime-type validation and access control.'
    },
    {
      num: '03',
      icon: FileSpreadsheet,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      badge: 'Institutional Formats',
      title: 'Official Gazette Dossiers',
      desc: 'Generate printable A4 student dossiers and custom Excel rosters filtered by year, section, community, scholarship status, and admission quota.'
    },
    {
      num: '04',
      icon: Award,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      badge: 'Government Concessions',
      title: 'Scholarship Verifications',
      desc: 'Automated verification workflows for First Graduate (FG) and Post-Matric Scholarship (PMS) beneficiaries with dedicated administrative review.'
    },
    {
      num: '05',
      icon: Lock,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      badge: 'ISO Compliant Security',
      title: 'Institutional Audit Trails',
      desc: 'Permanent security logging for record locks, profile verifications, rejections with mandatory notes, and admin temporary key generations.'
    },
    {
      num: '06',
      icon: Layers,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      badge: 'Guided 6-Step Intake',
      title: 'Multi-Step Dossier Wizard',
      desc: 'Step-by-step profile builder covering personal bio-data, academic progression, parent details, communication addresses, and bank coordinates.'
    }
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header entrance
      gsap.fromTo(
        headerRef.current,
        { y: 35, opacity: 0 },
        {
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out'
        }
      );

      // Staggered 3D Perspective Reveal
      const validCards = cardsRef.current.filter(Boolean);
      if (validCards.length > 0) {
        gsap.fromTo(
          validCards,
          { 
            y: 55, 
            opacity: 0, 
            rotationX: 16, 
            transformPerspective: 1000 
          },
          {
            scrollTrigger: {
              trigger: validCards[0],
              start: 'top 82%',
              toggleActions: 'play none none reverse'
            },
            y: 0,
            opacity: 1,
            rotationX: 0,
            duration: 0.75,
            stagger: 0.1,
            ease: 'back.out(1.15)'
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Spotlight mouse effect on cards
  const handleMouseMove = (e, index) => {
    const card = cardsRef.current[index];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <section 
      ref={sectionRef} 
      id="features" 
      className="py-20 sm:py-28 bg-slate-50/70 border-y border-slate-200/60 relative overflow-hidden"
    >
      {/* Background ambient accents */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div 
          ref={headerRef}
          className="text-center max-w-3xl mx-auto space-y-3 mb-16"
        >
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-bold uppercase tracking-wider">
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

        {/* Feature Cards Grid with Interactive Spotlight */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                ref={(el) => (cardsRef.current[idx] = el)}
                onMouseMove={(e) => handleMouseMove(e, idx)}
                onClick={() => openLogin('STUDENT')}
                className="group relative p-7 space-y-4 flex flex-col justify-between cursor-pointer bg-white/95 hover:bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
              >
                {/* Dynamic Mouse Spotlight Background Overlay */}
                <div 
                  className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'radial-gradient(500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(59, 130, 246, 0.08), transparent 40%)'
                  }}
                />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 shadow-xs ${feat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                      {feat.num}
                    </span>
                  </div>

                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                      {feat.badge}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                      {feat.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 relative z-10">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:text-blue-800 transition-colors">
                    <span>Explore in Portal</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
