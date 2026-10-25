import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const AboutDepartment = () => {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const statsRef = useRef([]);
  const highlightsRef = useRef([]);

  const departmentStats = [
    { label: 'NBA & NAAC', value: 'Accredited', desc: 'National Quality Standards' },
    { label: 'Anna University', value: 'Affiliated', desc: 'Approved by AICTE New Delhi' },
    { label: 'High-Performance', value: 'GPU Labs', desc: 'Deep Learning & Cloud Clusters' },
    { label: 'Placement Record', value: '95%+', desc: 'In Product & AI Enterprises' },
  ];

  const highlights = [
    {
      title: 'Industry-Aligned Curriculum',
      desc: 'Specialized coursework covering Supervised/Unsupervised Learning, Deep Neural Networks, Natural Language Processing, Computer Vision, and Big Data Engineering.'
    },
    {
      title: 'State-of-the-Art Computing Lab',
      desc: 'Equipped with dedicated workstation clusters, CUDA-accelerated hardware, and modern containerized sandbox environments for student projects and research.'
    },
    {
      title: 'Ethical & Responsible AI',
      desc: 'Emphasis on data privacy, algorithmic fairness, governance, and transparent machine learning practices aligned with global standards.'
    },
    {
      title: 'Live Hackathons & Research Output',
      desc: 'Active student participation in national hackathons, IEEE conferences, open-source repositories, and intellectual property publications.'
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

      // 3. Highlight cards slide-in
      const validHighlights = highlightsRef.current.filter(Boolean);
      if (validHighlights.length > 0) {
        gsap.fromTo(
          validHighlights,
          { y: 40, opacity: 0 },
          {
            scrollTrigger: {
              trigger: validHighlights[0],
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
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative scroll-mt-20"
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Section Header */}
      <div 
        ref={headerRef}
        className="max-w-3xl mx-auto text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-12 sm:mb-16">
        {departmentStats.map((stat, i) => (
          <div 
            key={i}
            ref={(el) => (statsRef.current[i] = el)}
            className="p-3.5 sm:p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-center"
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

      {/* Highlights Grid */}
      <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
        {highlights.map((item, index) => (
          <div 
            key={index}
            ref={(el) => (highlightsRef.current[index] = el)}
            className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/70 shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#0B1B3A]">
                {item.title}
              </h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed pl-11">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Institutional Link Footer */}
      <div className="mt-12 text-center">
        <a 
          href="https://aamec.edu.in" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-sm font-semibold text-[#0B1B3A] shadow-xs hover:shadow-sm transition-all transform active:scale-95 hover:-translate-y-0.5"
        >
          <span>Visit Official College Website (AAMEC)</span>
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </a>
      </div>
    </section>
  );
};
