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

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Header scroll entrance
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

      // 2. Cards Staggered 3D Perspective Reveal
      const validCards = cardsRef.current.filter(Boolean);
      if (validCards.length > 0) {
        gsap.fromTo(
          validCards,
          { 
            y: 50, 
            opacity: 0, 
            rotationX: 14, 
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

  return (
    <section 
      ref={sectionRef} 
      id="features" 
      className="py-20 sm:py-28 bg-slate-50/70 border-y border-slate-200/60 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div 
          ref={headerRef}
          className="text-center max-w-3xl mx-auto space-y-3 mb-16"
        >
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
                ref={(el) => (cardsRef.current[idx] = el)}
                onClick={() => openLogin('STUDENT')}
                className="glass-card-feature p-6 sm:p-7 space-y-4 flex flex-col justify-between cursor-pointer group bg-white/90 hover:bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 transform hover:-translate-y-1.5"
              >
                <div className="space-y-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 ${feat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
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
