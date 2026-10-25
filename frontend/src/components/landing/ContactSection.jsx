import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  MapPin, 
  Clock, 
  HelpCircle, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

export const ContactSection = () => {
  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="rounded-3xl bg-white border border-gray-200/80 shadow-[0_10px_40px_rgba(11,27,58,0.04)] p-8 sm:p-12 relative overflow-hidden"
      >
        
        {/* Subtle accent blob */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/60 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Contact Details */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold uppercase tracking-wider">
              <Mail className="w-3.5 h-3.5" />
              <span>Contact &amp; Student Helpdesk</span>
            </div>

            <h2 className="text-3xl font-extrabold text-[#0B1B3A] tracking-tight">
              Get in Touch with AI &amp; DS Dept.
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Have queries about student whitelist eligibility, document archival, or academic credentials? Our department coordination team is here to assist you.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Campus Address</div>
                  <div className="text-sm font-semibold text-[#0B1B3A] mt-0.5">
                    Department of Artificial Intelligence &amp; Data Science<br />
                    Anjalai Ammal Mahalingam Engineering College (AAMEC)<br />
                    Kovilvenni &ndash; 614 403, Tiruvarur District, Tamil Nadu.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Official Email</div>
                  <a 
                    href="mailto:aamecaidsskill@gmail.com" 
                    className="text-sm font-semibold text-blue-600 hover:underline mt-0.5 block"
                  >
                    aamecaidsskill@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Working Hours</div>
                  <div className="text-sm font-semibold text-[#0B1B3A] mt-0.5">
                    Monday &ndash; Saturday &bull; 09:00 AM &ndash; 05:00 PM IST
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Support & Assistance Card */}
          <div className="lg:col-span-6 space-y-4">
            <motion.div 
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              className="p-6 sm:p-8 rounded-2xl bg-[#F7F9FC] border border-gray-200/80 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0B1B3A]">
                    Student Help &amp; Grievance Redressal
                  </h3>
                  <p className="text-xs text-gray-500">
                    Direct assistance for enrolled AI &amp; DS students
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                If you encounter discrepancies in your Date of Birth, Register Number, or Community certificate during self-registration, please consult the Department Office in person with your original Admission Allotment Order.
              </p>

              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Authorized Administrative Portal &bull; ISO &amp; NBA Compliant</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Link Card */}
            <motion.a 
              href="https://aamec.edu.in" 
              target="_blank" 
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors group"
            >
              <div className="text-xs font-semibold text-gray-700 group-hover:text-blue-700">
                Explore Anna University Affiliation &amp; Regulation 2021
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors shrink-0" />
            </motion.a>
          </div>

        </div>

      </motion.div>
    </section>
  );
};
