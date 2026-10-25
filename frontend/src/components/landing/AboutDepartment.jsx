import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
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
      </motion.div>

      {/* Stats Counter Bar with Staggered Springs */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-12 sm:mb-16"
      >
        {departmentStats.map((stat, i) => (
          <motion.div 
            key={i}
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.95 },
              visible: { 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: { type: 'spring', stiffness: 300, damping: 20 }
              }
            }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="p-3.5 sm:p-5 rounded-2xl bg-white border border-gray-200/80 shadow-[0_4px_20px_rgba(11,27,58,0.03)] text-center transition-shadow hover:shadow-lg"
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
          </motion.div>
        ))}
      </motion.div>

      {/* Highlights Grid */}
      <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
        {highlights.map((item, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/70 shadow-[0_4px_20px_rgba(11,27,58,0.02)] space-y-3 transition-shadow hover:shadow-md"
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
          </motion.div>
        ))}
      </div>

      {/* Institutional Link Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-12 text-center"
      >
        <motion.a 
          href="https://aamec.edu.in" 
          target="_blank" 
          rel="noopener noreferrer"
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-gray-200 text-sm font-semibold text-[#0B1B3A] hover:bg-gray-50 shadow-sm transition-colors"
        >
          <span>Visit Official College Website (AAMEC)</span>
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </motion.a>
      </motion.div>
    </section>
  );
};
