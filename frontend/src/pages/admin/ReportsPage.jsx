import React, { useState } from 'react';
import { FileSpreadsheet, FileDown, Filter, Printer, Download } from 'lucide-react';
import { api } from '../../services/api';

export const ReportsPage = () => {
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [status, setStatus] = useState('');

  const handleDownloadExcel = () => {
    const url = api.getExcelExportUrl({ year, section, status });
    window.open(url, '_blank');
  };

  const handleDownloadPdf = () => {
    const url = api.getPdfExportUrl({ year, section, status });
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="border-b border-gov-border pb-3">
        <h1 className="text-xl font-bold text-gov-navy">Reports & Official Data Exports</h1>
        <p className="text-xs text-gray-500">
          Generate official institutional registers, scholarship audit extracts, and student biodata sheets.
        </p>
      </div>

      {/* Filter & Export Card */}
      <div className="bg-white border border-gov-border rounded p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gov-navy flex items-center">
          <Filter className="w-3.5 h-3.5 mr-1.5" /> Scope Filter for Export
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Academic Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:border-gov-navy focus:outline-none"
            >
              <option value="">All Academic Years (1 to 4)</option>
              <option value="1">1st Year (AI & DS)</option>
              <option value="2">2nd Year (AI & DS)</option>
              <option value="3">3rd Year (AI & DS)</option>
              <option value="4">4th Year (AI & DS)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Section</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:border-gov-navy focus:outline-none"
            >
              <option value="">All Sections (A, B, C)</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Verification Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:border-gov-navy focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="VERIFIED">Verified Records Only</option>
              <option value="SUBMITTED">Submitted Records Only</option>
              <option value="DRAFT">Pending Draft Only</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadExcel}
            className="inline-flex items-center px-4 py-2 bg-green-700 text-white rounded text-xs font-bold hover:bg-green-800 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            <span>Generate & Download Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center px-4 py-2 bg-gov-navy text-white rounded text-xs font-bold hover:bg-gov-navy-dark shadow-sm"
          >
            <FileDown className="w-4 h-4 mr-2" />
            <span>Generate & Download Official PDF Register</span>
          </button>
        </div>
      </div>

      {/* Reports Directory Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gov-border rounded p-4 text-xs space-y-2">
          <h4 className="font-bold text-gray-900 uppercase">Scholarship Concession Registers</h4>
          <p className="text-gray-600">
            Export comprehensive registers including First Graduate eligibility, tahsildar certificate particulars, and PMS application statuses for Directorate of Technical Education (DOTE) submissions.
          </p>
        </div>

        <div className="bg-white border border-gov-border rounded p-4 text-xs space-y-2">
          <h4 className="font-bold text-gray-900 uppercase">Bank Disbursal Audit Sheets</h4>
          <p className="text-gray-600">
            Export verified student bank accounts, verified IFSC codes, and Aadhaar links for direct benefit transfer (DBT) verifications.
          </p>
        </div>
      </div>
    </div>
  );
};
