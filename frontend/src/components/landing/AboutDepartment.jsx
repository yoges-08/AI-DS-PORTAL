import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  Cpu,
  Layers,
  Server,
  ShieldCheck
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const AboutDepartment = () => {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const statsRef = useRef([]);
  const labsRef = useRef([]);
  const highlightsRef = useRef([]);

  const departmentStats = [
    { label: 'NBA & NAAC', value: 'Accredited', desc: 'National Quality Standards' },
    { label: 'Anna University', value: 'Affiliated', desc: 'Approved by AICTE New Delhi' },
    { label: 'High-Performance', value: 'GPU Labs', desc: 'Deep Learning & Cloud Clusters' },
    { label: 'Placement Record', value: '95%+', desc: 'In Product & AI Enterprises' },
  ];

  const flagshipLabs = [
    {
      title: 'CUDA GPU Deep Learning Cluster',
      specs: 'NVIDIA RTX & A-Series Tensor Workstations',
      desc: 'Hardware-accelerated parallel computing suite configured for multi-layer perception, Transformer architectures, and generative adversarial models.',
      icon: Cpu,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      title: 'Distributed Cloud & MLOps Sandbox',
      specs: 'Kubernetes, Docker, Apache Spark & Kafka',
      desc: 'Production-grade distributed computing testbed where students orchestrate continuous integration, model versioning, and high-throughput data pipelines.',
      icon: Server,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    {
      title: 'Autonomous Systems & Edge AI Hub',
      specs: 'NVIDIA Jetson Nano, LiDAR & Sensory Arrays',
      desc: 'Embedded compute laboratory for real-time robotic vision, drone navigation, edge intelligence, and IoT sensor fusion.',
      icon: Layers,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
    {
      title: 'Ethical AI & Governance Sandbox',
      specs: 'Explainable AI (XAI) & Fairness Frameworks',
      desc: 'Rigorous testing suite dedicated to bias mitigation, algorithmic transparency, differential data privacy, and compliance with statutory standards.',
      icon: ShieldCheck,
      color: 'text-sky-600 bg-sky-50 border-sky-200'
    }
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Header reveal
      gsap.fromTo(
        headerRef.current,
        { y: 30, opacity: 0 },
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

      // 2. Stats bar staggered flip & lift
      const validStats = statsRef.current.filter(Boolean);
      if (validStats.length > 0) {
        gsap.fromTo(
          validStats,
          { y: 35, opacity: 0, scale: 0.94 },
          {
            scrollTrigger: {
              trigger: validStats[0],
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            },
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'back.out(1.2)'
          }
        );
      }

      // 3. Flagship Labs reveal
      const validLabs = labsRef.current.filter(Boolean);
      if (validLabs.length > 0) {
        gsap.fromTo(
          validLabs,
          { y: 45, opacity: 0 },
          {
            scrollTrigger: {
              trigger: validLabs[0],
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            },
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power3.out'
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      id="about" 
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative scroll-mt-20 overflow-hidden"
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Section Header */}
      <div 
        ref={headerRef}
        className="max-w-3xl mx-auto text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Academic Excellence &bull; Department of AI &amp; DS</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1B3A] tracking-tight">
          Nurturing Tomorrow's AI Innovators
        </h2>
        <p className="mt-4 text-base text-gray-600 leading-relaxed">
          The Department of Artificial Intelligence and Data Science at Anjalai Ammal Mahalingam Engineering College (AAMEC) equips students with rigorous mathematical foundations, practical engineering acumen, and real-world problem-solving skills.
        </p>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-16">
        {departmentStats.map((stat, i) => (
          <div 
            key={i}
            ref={(el) => (statsRef.current[i] = el)}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-center"
          >
            <div className="text-lg min-[380px]:text-xl sm:text-3xl font-black text-blue-600 tracking-tight truncate">
              {stat.value}
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#0B1B3A] mt-1 truncate">
              {stat.label}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
              {stat.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Flagship Infrastructure Section Title */}
      <div className="mb-8 text-center sm:text-left">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
          Cutting-Edge Facilities
        </span>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
          Flagship AI &amp; High-Performance Computing Labs
        </h3>
      </div>

      {/* Flagship Labs Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {flagshipLabs.map((lab, idx) => {
          const Icon = lab.icon;
          return (
            <div 
              key={idx}
              ref={(el) => (labsRef.current[idx] = el)}
              className="p-6 sm:p-7 rounded-3xl bg-white/95 border border-slate-200/90 shadow-xs hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 transform hover:-translate-y-1.5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${lab.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 leading-tight">
                    {lab.title}
                  </h4>
                  <span className="text-[11px] font-mono text-blue-600 font-semibold">
                    {lab.specs}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                {lab.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Institutional Link Footer */}
      <div className="mt-14 text-center">
        <a 
          href="https://aamec.edu.in" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-sm font-semibold text-[#0B1B3A] shadow-xs hover:shadow-md transition-all transform active:scale-95 hover:-translate-y-0.5"
        >
          <span>Visit Official College Website (AAMEC)</span>
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </a>
      </div>
    </section>
  );
};
