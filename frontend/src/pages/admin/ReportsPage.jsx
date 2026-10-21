import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileDown, 
  Filter, 
  Download, 
  GraduationCap, 
  Landmark, 
  ShieldCheck, 
  FileCheck2,
  Sparkles,
  Layers
} from 'lucide-react';
import { api } from '../../services/api';

export const ReportsPage = () => {
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [status, setStatus] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [activeDownloadType, setActiveDownloadType] = useState(null);

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      setActiveDownloadType('excel');
      await api.downloadExcel({ year, semester, section, status });
    } catch (err) {
      alert(`Excel export failed: ${err.message || 'Unable to download register.'}`);
    } finally {
      setDownloading(false);
      setActiveDownloadType(null);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      setActiveDownloadType('pdf');
      await api.downloadPdf({ year, semester, section, status });
    } catch (err) {
      alert(`PDF export failed: ${err.message || 'Unable to download report.'}`);
    } finally {
      setDownloading(false);
      setActiveDownloadType(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="border-b border-outline-variant/30 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-primary-fixed text-primary">
            Export Center
          </span>
          <span className="text-caption text-outline font-medium">Institutional Compliance & Audit Registers</span>
        </div>
        <h1 className="text-2xl font-bold text-primary tracking-tight">Department Reports & Data Exports</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Extract certified rosters, DOTE scholarship concession registers, and bank DBT audit sheets in Excel and PDF.
        </p>
      </div>

      {/* Filter & Export Command Center */}
      <div className="glass-card-l1 rounded-3xl p-6 sm:p-8 border border-white/60 shadow-lg backdrop-blur-xl bg-white/95 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
          <div className="flex items-center gap-2 font-bold text-primary text-sm">
            <Filter className="w-4 h-4 text-secondary" />
            <span>Scope Filter & Data Pipeline Selector</span>
          </div>
          <span className="text-caption text-outline font-medium">Live Query Engine</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-on-surface mb-1.5">Academic Cohort / Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-container-low/50 hover:bg-surface-container-low focus:bg-white border border-outline-variant/60 focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded-xl text-sm text-on-surface focus:outline-none transition-all font-medium"
            >
              <option value="">All Academic Years (1 to 4)</option>
              <option value="1">1st Year (AI & DS)</option>
              <option value="2">2nd Year (AI & DS)</option>
              <option value="3">3rd Year (AI & DS)</option>
              <option value="4">4th Year (AI & DS)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-on-surface mb-1.5">Current Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-container-low/50 hover:bg-surface-container-low focus:bg-white border border-outline-variant/60 focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded-xl text-sm text-on-surface focus:outline-none transition-all font-medium"
            >
              <option value="">All Semesters (1 to 8)</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-on-surface mb-1.5">Section</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-container-low/50 hover:bg-surface-container-low focus:bg-white border border-outline-variant/60 focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded-xl text-sm text-on-surface focus:outline-none transition-all font-medium"
            >
              <option value="">All Sections (A, B, C, D)</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-on-surface mb-1.5">Verification Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-container-low/50 hover:bg-surface-container-low focus:bg-white border border-outline-variant/60 focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded-xl text-sm text-on-surface focus:outline-none transition-all"
            >
              <option value="">All Verification Statuses</option>
              <option value="VERIFIED">Verified Records Only</option>
              <option value="SUBMITTED">Submitted Records Only</option>
              <option value="DRAFT">Pending Draft Only</option>
              <option value="REJECTED">Flagged / Rejected Only</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-outline-variant/30 flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadExcel}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>
              {downloading && activeDownloadType === 'excel'
                ? 'Exporting Excel Register...'
                : 'Download Excel Roster (.xlsx)'}
            </span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            <span>
              {downloading && activeDownloadType === 'pdf'
                ? 'Compiling PDF Dossier...'
                : 'Download Certified PDF Register'}
            </span>
          </button>
        </div>
      </div>

      {/* Reports Directory Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        
        {/* Card 1 */}
        <div className="glass-card-l1 rounded-3xl p-6 border border-white/60 shadow-md backdrop-blur-xl bg-white/95 space-y-3 hover:shadow-lg transition-all">
          <div className="w-10 h-10 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center text-primary mb-1">
            <GraduationCap className="w-5 h-5 text-secondary" />
          </div>
          <h4 className="font-bold text-primary text-sm">Scholarship & Communal Quotas</h4>
          <p className="text-on-surface-variant text-xs leading-relaxed">
            Export comprehensive registers including First Graduate eligibility, tahsildar certificate particulars, and PMS application statuses for Directorate of Technical Education (DOTE) submissions.
          </p>
          <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-secondary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Includes Revenue Certificate Verification Codes</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card-l1 rounded-3xl p-6 border border-white/60 shadow-md backdrop-blur-xl bg-white/95 space-y-3 hover:shadow-lg transition-all">
          <div className="w-10 h-10 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center text-primary mb-1">
            <Landmark className="w-5 h-5 text-secondary" />
          </div>
          <h4 className="font-bold text-primary text-sm">Direct Benefit Transfer (DBT) & Bank Audit</h4>
          <p className="text-on-surface-variant text-xs leading-relaxed">
            Export verified student bank account numbers, branch IFSC codes, and full Aadhaar records for scholarship disbursal reconciliation and government audits.
          </p>
          <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-secondary">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>NPCI / Aadhaar Seeded Account Compliance</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card-l1 rounded-3xl p-6 border border-white/60 shadow-md backdrop-blur-xl bg-white/95 space-y-3 hover:shadow-lg transition-all">
          <div className="w-10 h-10 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center text-primary mb-1">
            <Layers className="w-5 h-5 text-secondary" />
          </div>
          <h4 className="font-bold text-primary text-sm">Anna University Regulation Roster</h4>
          <p className="text-on-surface-variant text-xs leading-relaxed">
            Generate official section-wise student rosters with register number mapping, mode of admission (Government / Management / Lateral Entry), and 10th/12th school records.
          </p>
          <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-secondary">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Formatted for Anna University COE Audits</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-card-l1 rounded-3xl p-6 border border-white/60 shadow-md backdrop-blur-xl bg-white/95 space-y-3 hover:shadow-lg transition-all">
          <div className="w-10 h-10 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center text-primary mb-1">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          </div>
          <h4 className="font-bold text-primary text-sm">Secure Cloud Storage Vault Audit</h4>
          <p className="text-on-surface-variant text-xs leading-relaxed">
            All document URLs in exports reference authenticated endpoints backed by Cloudflare R2 object storage, ensuring private certificates remain strictly protected.
          </p>
          <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted S3 Private Bucket Architecture</span>
          </div>
        </div>

      </div>

    </div>
  );
};
