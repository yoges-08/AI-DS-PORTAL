import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, FileText, Check, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export const BulkImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async (e) => {
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
        onSuccess && onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to process bulk import.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/60 shadow-[0_24px_64px_rgba(0,0,0,0.18)] rounded-3xl w-full max-w-xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Bulk Ingestion Pipeline</h3>
              <p className="text-[11px] text-white/70">Cohort Roster Batch Import • Automated Schema Parsing</p>
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
        <div className="p-6 text-xs space-y-5 overflow-y-auto max-h-[80vh]">
          
          {/* Official Templates Card */}
          <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold">
                <FileText className="w-4 h-4 text-secondary" />
                <span className="text-xs uppercase tracking-wider">Official Ingestion Templates</span>
              </div>
              <span className="text-[11px] text-outline font-medium">Columns: Register No, Name, DOB</span>
            </div>
            <p className="text-on-surface-variant text-[11.5px] leading-relaxed">
              Upload class roster. The DOB will automatically be encrypted as initial login password (DDMMYYYY). Students select Year & Section upon logging in.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href="/sample_student_bulk_import.xlsx"
                download="sample_student_bulk_import.xlsx"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-outline-variant/40 rounded-xl text-primary font-semibold hover:bg-surface-container shadow-sm transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel (.xlsx) Template</span>
              </a>
              <a
                href="/sample_student_bulk_import.csv"
                download="sample_student_bulk_import.csv"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-outline-variant/40 rounded-xl text-primary font-semibold hover:bg-surface-container shadow-sm transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-secondary" />
                <span>CSV (.csv) Template</span>
              </a>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {result && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 font-bold text-emerald-900">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{result.message}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200/60 text-center">
                  <div className="text-[10px] uppercase font-bold text-outline">New Added</div>
                  <div className="text-lg font-bold text-emerald-700">{result.insertedCount || 0}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200/60 text-center">
                  <div className="text-[10px] uppercase font-bold text-outline">Updated</div>
                  <div className="text-lg font-bold text-primary">{result.updatedCount || 0}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200/60 text-center">
                  <div className="text-[10px] uppercase font-bold text-outline">Skipped</div>
                  <div className="text-lg font-bold text-outline">{result.skippedCount || 0}</div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="text-[11px] text-amber-900 bg-amber-50/80 p-3 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Import Notes & Exceptions:</span>
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
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="rounded-2xl border-2 border-dashed border-secondary/40 bg-surface-container-low/40 hover:bg-surface-container-low/80 transition-all p-6 text-center relative group cursor-pointer shadow-sm">
              <input
                type="file"
                id="bulkFile"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="sr-only"
              />
              <label htmlFor="bulkFile" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center text-secondary mb-2 group-hover:scale-105 transition-transform shadow-sm">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <span className="font-semibold text-primary text-sm">Drop batch roster file here or browse</span>
                <span className="text-[11px] text-outline mt-1">Accepts .xlsx, .xls, or .csv (up to 10 MB)</span>
                {file && (
                  <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-primary bg-secondary-fixed/50 px-3 py-1 rounded-xl border border-secondary/30">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </label>
            </div>

            <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-on-surface font-semibold transition-all active:scale-95"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="px-5 py-2 bg-primary hover:bg-primary-container text-white rounded-xl font-semibold shadow-md disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? 'Processing Batch...' : 'Execute Ingestion'}
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
