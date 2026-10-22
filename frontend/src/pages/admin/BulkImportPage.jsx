import React, { useState } from 'react';
import { FileSpreadsheet, Upload, Download, CheckCircle, AlertCircle, FileText, Check, AlertTriangle, Eye, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

export const BulkImportPage = () => {
  const [file, setFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError('');
      setResult(null);
      setPreviewData(null);

      try {
        setPreviewLoading(true);
        const preview = await api.previewBulkImport(f);
        if (preview.success) {
          setPreviewData(preview);
        }
      } catch (err) {
        setError(err.message || 'Failed to parse spreadsheet preview.');
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an Excel or CSV file.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.bulkImportStudents(file);
      if (res.success) {
        setResult(res);
        setPreviewData(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to process bulk import.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="border-b border-outline-variant/30 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-primary-fixed text-primary">
            Batch Operations
          </span>
          <span className="text-caption text-outline font-medium">Department Ingestion Pipeline</span>
        </div>
        <h1 className="text-2xl font-bold text-primary tracking-tight">Bulk Import Student Whitelist</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Ingest eligible cohort registers via 2-column Excel (.xlsx) or CSV format. Eligible students self-register their accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Dropzone & Upload (7 cols) */}
        <div className="md:col-span-7 glass-card-l1 rounded-3xl p-6 sm:p-7 border border-white/60 shadow-lg backdrop-blur-xl bg-white/95 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
            <div className="flex items-center gap-2 font-bold text-primary">
              <Upload className="w-5 h-5 text-secondary" />
              <span>Eligibility Whitelist Ingestion</span>
            </div>
            <span className="text-caption text-outline">Max 5 MB &bull; 2 Columns</span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* PREVIEW STEP */}
          {previewLoading && (
            <div className="p-4 rounded-2xl bg-surface-container-low text-center space-y-2">
              <div className="inline-block animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
              <p className="text-primary font-medium text-xs">Validating spreadsheet &amp; generating preview...</p>
            </div>
          )}

          {previewData && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Spreadsheet File Preview</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-semibold">
                    Valid: {previewData.validCount}
                  </span>
                  {previewData.invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-semibold">
                      Invalid: {previewData.invalidCount}
                    </span>
                  )}
                  <span className="text-outline">Total: {previewData.totalRows}</span>
                </div>
              </div>

              {previewData.preview && previewData.preview.length > 0 && (
                <div className="overflow-x-auto max-h-48 rounded-xl border border-blue-200/80 bg-white">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-blue-100/70 text-blue-950 font-semibold sticky top-0">
                      <tr>
                        <th className="px-2.5 py-1">Row</th>
                        <th className="px-2.5 py-1">Register No</th>
                        <th className="px-2.5 py-1">DOB</th>
                        <th className="px-2.5 py-1">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100 font-mono text-[11px]">
                      {previewData.preview.map((row, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/50">
                          <td className="px-2.5 py-1 text-outline font-sans">{row.rowNum}</td>
                          <td className="px-2.5 py-1 font-semibold text-primary">{row.registerNo}</td>
                          <td className="px-2.5 py-1 text-on-surface">{row.dob}</td>
                          <td className="px-2.5 py-1 font-sans">
                            {row.status === 'NEW' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">New</span>
                            )}
                            {row.status === 'UPDATE_DOB' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">Update DOB</span>
                            )}
                            {row.status === 'ALREADY_REGISTERED' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">Claimed</span>
                            )}
                            {row.status === 'EXISTS' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700 font-medium">Unchanged</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {previewData.errors && previewData.errors.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Errors in file ({previewData.errors.length}):</span>
                  </div>
                  <ul className="list-disc list-inside max-h-20 overflow-y-auto space-y-0.5 text-[10.5px]">
                    {previewData.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs space-y-3">
              <div className="flex items-center space-x-2 font-bold text-emerald-900">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{result.message}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white border border-emerald-200 font-semibold text-emerald-700">
                  New: {result.insertedCount || 0}
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-200 font-semibold text-primary">
                  Updated: {result.updatedCount || 0}
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-200 font-semibold text-outline">
                  Skipped: {result.skippedCount || 0}
                </div>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="text-[11px] bg-white p-2.5 border border-emerald-200 rounded-xl">
                  <span className="font-semibold block mb-1 text-emerald-900">Row Notes:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-on-surface-variant max-h-24 overflow-y-auto">
                    {result.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="rounded-2xl border-2 border-dashed border-secondary/40 bg-surface-container-low/40 hover:bg-surface-container-low/80 transition-all p-8 text-center relative group cursor-pointer shadow-sm">
              <input
                type="file"
                id="pageBulkFile"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="sr-only"
              />
              <label htmlFor="pageBulkFile" className="cursor-pointer flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center text-secondary mb-3 group-hover:scale-105 transition-transform shadow-sm">
                  <FileSpreadsheet className="w-7 h-7 text-primary" />
                </div>
                <span className="font-semibold text-primary text-base">Drop Whitelist File Here</span>
                <p className="text-xs text-outline mt-1 max-w-xs">
                  Upload 2-column spreadsheet (Register Number, DOB) to pre-register cohort eligibility.
                </p>
                {file && (
                  <div className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs text-primary bg-secondary-fixed/60 px-3.5 py-1 rounded-xl border border-secondary/30">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !file || previewLoading || (previewData && previewData.validCount === 0)}
              className="w-full py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50 transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{loading ? 'Ingesting Whitelist...' : 'Confirm & Ingest Whitelist'}</span>
            </button>
          </form>
        </div>

        {/* Guide & Templates (5 cols) */}
        <div className="md:col-span-5 space-y-5">
          <div className="glass-card-l1 rounded-3xl p-6 border border-white/60 shadow-lg backdrop-blur-xl bg-white/95 space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <FileText className="w-4 h-4 text-secondary" />
              <span>Whitelist Schema Specifications</span>
            </div>
            
            <p className="text-xs text-on-surface-variant leading-relaxed">
              The spreadsheet parser requires <strong>2 columns only</strong> (case-insensitive headers):
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/30 flex items-start gap-2">
                <span className="font-mono font-bold text-primary shrink-0">1.</span>
                <div>
                  <strong className="text-on-surface">Register Number:</strong>
                  <span className="text-outline block text-[11px]">Official university registration number. Stored as text.</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/30 flex items-start gap-2">
                <span className="font-mono font-bold text-primary shrink-0">2.</span>
                <div>
                  <strong className="text-on-surface">DOB:</strong>
                  <span className="text-outline block text-[11px]">DD-MM-YYYY, YYYY-MM-DD, or Excel date cell format.</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-secondary-fixed/30 border border-secondary/20 rounded-xl text-[11px] text-primary">
              <strong>Student Self-Signup:</strong> Do NOT add Name, Email, Year, or Section. Students will enter their full name, email, and choose their own secure password during signup.
            </div>

            <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">Download Sample Files</span>
              <div className="flex items-center gap-2">
                <a
                  href="/sample_student_bulk_import.xlsx"
                  download="sample_student_bulk_import.xlsx"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold text-xs border border-outline-variant/40 shadow-sm transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>.xlsx</span>
                </a>
                <a
                  href="/sample_student_bulk_import.csv"
                  download="sample_student_bulk_import.csv"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold text-xs border border-outline-variant/40 shadow-sm transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-secondary" />
                  <span>.csv</span>
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
