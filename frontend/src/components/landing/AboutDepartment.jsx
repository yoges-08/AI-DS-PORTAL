import React from 'react';
import { 
  Cpu, 
  Award, 
  BookOpen, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';

export const AboutDepartment = () => {
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

  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative scroll-mt-20">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center mb-16">
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
            className="p-3.5 sm:p-5 rounded-2xl bg-white border border-gray-200/80 shadow-[0_4px_20px_rgba(11,27,58,0.03)] text-center transition-transform hover:-translate-y-1"
          >
            <div className="text-lg min-[380px]:text-xl sm:text-3xl font-black text-blue-600 tracking-tight truncate">
              {stat.value}
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#0B1B3A] mt-1 truncate">
              {stat.label}
            </div>
            <div className="text-[10.5px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug">
              {stat.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Vision/Mission & Pillars */}
      <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
        
        {/* Left Column: Vision & Mission Glass Card */}
        <div className="lg:col-span-5 p-5 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          {/* Subtle watermark background */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-200 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Vision &amp; Department Mission</span>
            </div>

            <h3 className="text-2xl font-bold tracking-tight text-white mb-3">
              Department Vision
            </h3>
            <p className="text-sm text-blue-100/90 leading-relaxed mb-6">
              "To emerge as a premier centre of excellence in Artificial Intelligence and Data Science education and research, fostering ethically conscious, socially responsible, and technically superior innovators capable of addressing global challenges."
            </p>

            <h3 className="text-lg font-bold tracking-tight text-white mb-3 pt-4 border-t border-white/10">
              Department Mission
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-blue-100/80">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Deliver high-caliber academic curriculum bridging theoretical rigor and scalable software execution.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Nurture collaboration with global industry partners, research institutions, and leading open-source ecosystems.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Instill professional integrity, research ethics, and commitment to human-centric technological advancement.</span>
              </li>
            </ul>
          </div>

          <div className="pt-8 mt-8 border-t border-white/10 flex items-center justify-between text-xs text-blue-200/90">
            <div>
              <div className="font-semibold text-white">Anjalai Ammal Mahalingam Engg. College</div>
              <div className="text-[11px] text-blue-300">Kovilvenni - 614 403, Tiruvarur District</div>
            </div>
            <img src="/college-logo.webp" alt="College Crest" className="w-10 h-10 object-contain drop-shadow" />
          </div>
        </div>

        {/* Right Column: Key Department Pillars */}
        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
          {highlights.map((item, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-[0_4px_20px_rgba(11,27,58,0.03)] hover:border-blue-300 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">
                  0{idx + 1}
                </div>
                <h4 className="text-base font-bold text-[#0B1B3A] mb-2">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}

          {/* Infrastructure Callout */}
          <div className="sm:col-span-2 p-5 rounded-2xl bg-blue-50/80 border border-blue-200/70 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#0B1B3A]">Autonomous Digital Student Record System</div>
                <div className="text-xs text-gray-600">Built in-house for real-time document verification, scholarship validation, and Anna University audit trails.</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default AboutDepartment;