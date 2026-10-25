import React from 'react';
import { 
  Award, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  BookOpen, 
  Sparkles, 
  Database,
  Cloud
} from 'lucide-react';

export const AccreditationTicker = () => {
  const items = [
    { label: 'NBA Accredited', sub: 'National Quality Benchmark', icon: Award, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: "NAAC 'A' Grade", sub: 'Accredited Institution', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Anna University', sub: 'Affiliated Institution', icon: BookOpen, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: 'AICTE Approved', sub: 'New Delhi Recognition', icon: Globe, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { label: 'IEEE Student Branch', sub: 'Computational Intelligence', icon: Cpu, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { label: 'AWS Cloud Academy', sub: 'Distributed AI Infrastructure', icon: Cloud, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { label: 'CUDA GPU Lab', sub: 'NVIDIA Hardware Acceleration', icon: Database, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { label: 'DOTE Tamil Nadu', sub: 'Government Concession Compliance', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200' }
  ];

  // Duplicate for seamless infinite loop
  const tickerItems = [...items, ...items];

  return (
    <div className="w-full py-4 bg-white/70 backdrop-blur-xl border-y border-slate-200/60 overflow-hidden relative select-none">
      
      {/* Left/Right Edge Gradient Fade Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#F7F9FC] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#F7F9FC] to-transparent z-10 pointer-events-none" />

      {/* Marquee Track */}
      <div className="animate-marquee flex items-center gap-4 sm:gap-6">
        {tickerItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-blue-300 transition-all cursor-default shrink-0"
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 ${item.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 tracking-tight leading-none">
                  {item.label}
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5 leading-none">
                  {item.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
