import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-gov-border rounded-md shadow-lg w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-gov-navy text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wide">Bulk Import Student Records</h3>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 text-xs space-y-4">
          
          {/* Instructions & Template Download */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 leading-relaxed">
            <p className="font-semibold mb-1">Spreadsheet Template Instructions:</p>
            <p>File must include columns: <strong>Register Number</strong>, <strong>Name</strong>, <strong>DOB (YYYY-MM-DD)</strong>, <strong>Year (1-4)</strong>, and <strong>Section (A/B/C)</strong>.</p>
            <div className="mt-2.5">
              <a
                href="/sample_student_bulk_import.csv"
                download="sample_student_bulk_import.csv"
                className="inline-flex items-center text-xs text-gov-navy font-bold hover:underline"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Download Sample CSV Template
              </a>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-900 rounded space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                <span>{result.message}</span>
              </div>
              <p>Inserted: <strong>{result.insertedCount}</strong> | Skipped/Duplicate: <strong>{result.skippedCount}</strong></p>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2 text-[11px] text-amber-900 bg-amber-50 p-2 border border-amber-200 rounded">
                  <p className="font-semibold">Notice notes:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Upload Form */}
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center hover:border-gov-navy transition-colors">
              <input
                type="file"
                id="bulkFile"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="sr-only"
              />
              <label htmlFor="bulkFile" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-gov-navy mb-1.5" />
                <span className="font-semibold text-gov-navy">Click to browse spreadsheet</span>
                <span className="text-[11px] text-gray-500 mt-0.5">.xlsx, .xls, or .csv up to 10MB</span>
                {file && (
                  <span className="mt-2 font-mono text-xs text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                    Selected: {file.name}
                  </span>
                )}
              </label>
            </div>

            <div className="pt-2 border-t border-gray-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="px-4 py-1.5 bg-gov-navy text-white rounded font-semibold hover:bg-gov-navy-dark disabled:opacity-50"
              >
                {loading ? 'Uploading & Processing...' : 'Start Import'}
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
