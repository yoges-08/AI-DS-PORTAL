import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, FileText, Check, AlertTriangle, Eye, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export const BulkImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Lock body scroll while modal is active (prevents background scroll and blur misalignment)
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError('');
      setResult(null);
      setPreviewData(null);

      // Automatically run preview
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

  const handleConfirmImport = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.bulkImportStudents(file);
      if (res.success) {
        setResult(res);
        setPreviewData(null);
        onSuccess && onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to process bulk import.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto apple-modal-backdrop flex min-h-full items-start sm:items-center justify-center p-2 sm:p-6 animate-fade-in">
      {/* Click-away backdrop overlay */}
      <div className="fixed inset-0 bg-transparent" onClick={onClose} aria-hidden="true" />
      
      {/* Modal Dialog Card */}
      <div className="relative z-10 apple-modal-card rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col my-2 sm:my-auto transition-all">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Student Whitelist Ingestion</h3>
              <p className="text-[11px] text-white/70">Pre-register candidate eligibility • 2-Column Schema</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-xs space-y-5 overflow-y-auto max-h-[82vh]">
          
          {/* Official Templates & Format Specifications Card */}
          <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold">
                <FileText className="w-4 h-4 text-secondary" />
                <span className="text-xs uppercase tracking-wider">Required 2-Column Schema</span>
              </div>
              <span className="text-[11px] text-outline font-semibold">2 Columns: Register Number, DOB</span>
            </div>

            {/* Small format table */}
            <div className="overflow-x-auto rounded-xl border border-outline-variant/40 bg-white">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-surface-container font-semibold text-primary">
                  <tr>
                    <th className="px-3 py-1.5 border-b border-outline-variant/30">Register Number</th>
                    <th className="px-3 py-1.5 border-b border-outline-variant/30">DOB</th>
                    <th className="px-3 py-1.5 border-b border-outline-variant/30">Requirement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-on-surface-variant font-mono">
                  <tr>
                    <td className="px-3 py-1 text-primary font-semibold">71762305041</td>
                    <td className="px-3 py-1">2005-02-14</td>
                    <td className="px-3 py-1 font-sans text-[10.5px]">Text format; alphanumeric</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 text-primary font-semibold">71762305042</td>
                    <td className="px-3 py-1">14-07-2005</td>
                    <td className="px-3 py-1 font-sans text-[10.5px]">DD-MM-YYYY or Date cell</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              <strong>Whitelist Only:</strong> Uploading eligible Register Numbers and DOBs pre-registers eligibility. Students will self-create their account, name, email, and chosen password on the login page.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href="/sample_student_bulk_import.xlsx"
                download="sample_student_bulk_import.xlsx"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-outline-variant/40 rounded-xl text-primary font-semibold hover:bg-surface-container shadow-sm transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download Sample .xlsx</span>
              </a>
              <a
                href="/sample_student_bulk_import.csv"
                download="sample_student_bulk_import.csv"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-outline-variant/40 rounded-xl text-primary font-semibold hover:bg-surface-container shadow-sm transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-secondary" />
                <span>Download Sample .csv</span>
              </a>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* PREVIEW STEP: Shown before final commit */}
          {previewLoading && (
            <div className="p-4 rounded-2xl bg-surface-container-low text-center space-y-2">
              <div className="inline-block animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
              <p className="text-primary font-medium">Validating file &amp; generating preview...</p>
            </div>
          )}

          {previewData && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Ingestion File Preview</span>
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

              {/* Sample Table */}
              {previewData.preview && previewData.preview.length > 0 && (
                <div className="overflow-x-auto max-h-40 rounded-xl border border-blue-200/80 bg-white">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-blue-100/70 text-blue-950 font-semibold sticky top-0">
                      <tr>
                        <th className="px-2.5 py-1">Row</th>
                        <th className="px-2.5 py-1">Register No</th>
                        <th className="px-2.5 py-1">DOB (Parsed)</th>
                        {previewData.preview.some(r => r.email) && <th className="px-2.5 py-1">Pre-bound Email</th>}
                        <th className="px-2.5 py-1">Prospective Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100 font-mono text-[11px]">
                      {previewData.preview.map((row, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/50">
                          <td className="px-2.5 py-1 text-outline font-sans">{row.rowNum}</td>
                          <td className="px-2.5 py-1 font-semibold text-primary">{row.registerNo}</td>
                          <td className="px-2.5 py-1 text-on-surface">{row.dob}</td>
                          {previewData.preview.some(r => r.email) && (
                            <td className="px-2.5 py-1 text-on-surface font-sans text-[10.5px] truncate max-w-[130px]">{row.email || '-'}</td>
                          )}
                          <td className="px-2.5 py-1 font-sans">
                            {row.status === 'NEW' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">New Pre-registration</span>
                            )}
                            {row.status === 'UPDATE_DOB' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">Update DOB</span>
                            )}
                            {row.status === 'ALREADY_REGISTERED' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">Already Claimed</span>
                            )}
                            {row.status === 'EXISTS' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700 font-medium">Unchanged</span>
                            )}
                            {row.status === 'EMAIL_IN_USE' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold">Email Conflict</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Preview Errors */}
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

          {/* Import Result Summary */}
          {result && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 font-bold text-emerald-900">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{result.message}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200/60 text-center">
                  <div className="text-[10px] uppercase font-bold text-outline">New Whitelist</div>
                  <div className="text-lg font-bold text-emerald-700">{result.insertedCount || 0}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200/60 text-center">
                  <div className="text-[10px] uppercase font-bold text-outline">DOB Updated</div>
                  <div className="text-lg font-bold text-primary">{result.updatedCount || 0}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200/60 text-center">
                  <div className="text-[10px] uppercase font-bold text-outline">Skipped / Claimed</div>
                  <div className="text-lg font-bold text-outline">{result.skippedCount || 0}</div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="text-[11px] text-amber-900 bg-amber-50/80 p-3 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Import Notes &amp; Exceptions:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-900 max-h-24 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Upload Dropzone Form */}
          <form onSubmit={handleConfirmImport} className="space-y-4">
            <div className="rounded-2xl border-2 border-dashed border-secondary/40 bg-surface-container-low/40 hover:bg-surface-container-low/80 transition-all p-5 text-center relative group cursor-pointer shadow-sm">
              <input
                type="file"
                id="bulkFile"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="sr-only"
              />
              <label htmlFor="bulkFile" className="cursor-pointer flex flex-col items-center">
                <div className="w-11 h-11 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center text-secondary mb-2 group-hover:scale-105 transition-transform shadow-sm">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-primary text-xs">Drop whitelist file here or browse</span>
                <span className="text-[10.5px] text-outline mt-0.5">Accepts .xlsx, .xls, or .csv (Register Number, DOB)</span>
                {file && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-xs text-primary bg-secondary-fixed/50 px-3 py-1 rounded-xl border border-secondary/30">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </label>
            </div>

            <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-on-surface font-semibold transition-all active:scale-95 text-xs"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading || !file || previewLoading || (previewData && previewData.validCount === 0)}
                className="px-5 py-2 bg-primary hover:bg-primary-container text-white rounded-xl font-semibold shadow-md disabled:opacity-50 transition-all active:scale-95 flex items-center gap-1.5 text-xs"
              >
                {loading ? 'Committing Whitelist...' : 'Confirm & Ingest Whitelist'}
                {!loading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>,
    document.body
  );
};
