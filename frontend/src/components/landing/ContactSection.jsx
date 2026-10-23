import React from 'react';
import { 
  Mail, 
  MapPin, 
  Phone, 
  Clock, 
  HelpCircle, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

export const ContactSection = () => {
  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      <div className="rounded-3xl bg-white border border-gray-200/80 shadow-[0_10px_40px_rgba(11,27,58,0.04)] p-8 sm:p-12 relative overflow-hidden">
        
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
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Office Hours</div>
                  <div className="text-sm font-semibold text-[#0B1B3A] mt-0.5">
                    Monday &ndash; Saturday &bull; 8:45 AM &ndash; 4:45 PM IST
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Frequently Asked Questions & Quick Help */}
          <div className="lg:col-span-6 space-y-4">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Student Registration FAQ</span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 hover:bg-white hover:border-blue-200 transition-all">
              <h4 className="text-xs font-bold text-[#0B1B3A]">
                1. What if my Register Number is not found in the whitelist?
              </h4>
              <p className="text-[11.5px] text-gray-600 mt-1">
                Your Department Administrator or Faculty Advisor uploads the approved cohort whitelist before registration opens. If your record does not match, bring your Anna University hall ticket / admission order to the AI &amp; DS department office.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 hover:bg-white hover:border-blue-200 transition-all">
              <h4 className="text-xs font-bold text-[#0B1B3A]">
                2. Can I change my password after creating an account?
              </h4>
              <p className="text-[11.5px] text-gray-600 mt-1">
                Yes. Once registered, log into the Student Portal with your Register Number and password. You can manage your security settings and profile data from the dashboard.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 hover:bg-white hover:border-blue-200 transition-all">
              <h4 className="text-xs font-bold text-[#0B1B3A]">
                3. Are uploaded documents secure?
              </h4>
              <p className="text-[11.5px] text-gray-600 mt-1">
                All certificates, identity proofs, and marks cards are encrypted at rest and served exclusively through signed, time-limited tokens to authorized faculty coordinators and administrators.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-center gap-2.5 text-xs text-blue-900 font-medium">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Robert, our virtual department assistant, is available 24/7 on screen to guide you.</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default ContactSection;