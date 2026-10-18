import React, { useState } from 'react';
import { FileSpreadsheet, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export const BulkImportPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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
      }
    } catch (err) {
      setError(err.message || 'Failed to process bulk import.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="border-b border-gov-border pb-3">
        <h1 className="text-xl font-bold text-gov-navy">Bulk Import Student Records</h1>
        <p className="text-xs text-gray-500">
          Upload department cohort lists in Excel (.xlsx) or CSV format. Passwords are automatically initialized as DOB.
        </p>
      </div>

      {/* Guide Card */}
      <div className="bg-white border border-gov-border rounded p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gov-navy">
          Import File Requirements & Mapping Rules
        </h3>
        <p className="text-xs text-gray-700 leading-relaxed">
          The spreadsheet must contain the following header columns (case-insensitive):
        </p>
        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
          <li><strong>Register Number:</strong> e.g., 71762305041 (must be unique).</li>
          <li><strong>Name:</strong> Full name as per 10th/12th marksheet.</li>
          <li><strong>DOB:</strong> Format YYYY-MM-DD (e.g., 2005-02-14). Initial password is set to DDMMYYYY (14022005).</li>
          <li><strong>Year:</strong> Numeric integer between 1 and 4.</li>
          <li><strong>Section:</strong> Department section letter: A, B, or C.</li>
        </ul>

        <div className="pt-3 border-t border-gray-100 flex items-center space-x-3">
          <a
            href="/sample_student_bulk_import.csv"
            download="sample_student_bulk_import.csv"
            className="inline-flex items-center px-3 py-1.5 bg-gov-navy text-white text-xs font-semibold rounded hover:bg-gov-navy-dark shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download CSV Template
          </a>
        </div>
      </div>

      {/* Upload Box */}
      <div className="bg-white border border-gov-border rounded p-6 shadow-sm">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-900 rounded text-xs space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span>{result.message}</span>
            </div>
            <p>Records Imported: <strong>{result.insertedCount}</strong> | Skipped / Existing: <strong>{result.skippedCount}</strong></p>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2 text-[11px] bg-white p-2.5 border border-green-200 rounded">
                <span className="font-semibold block mb-1">Row Notes:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {result.errors.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded p-8 text-center hover:border-gov-navy transition-colors">
            <input
              type="file"
              id="pageBulkFile"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setError('');
                setResult(null);
              }}
              className="sr-only"
            />
            <label htmlFor="pageBulkFile" className="cursor-pointer flex flex-col items-center">
              <Upload className="w-10 h-10 text-gov-navy mb-2" />
              <span className="text-sm font-semibold text-gov-navy">Click to browse spreadsheet file</span>
              <span className="text-xs text-gray-500 mt-1">Accepts .xlsx, .xls, or .csv (Max 10MB)</span>
              {file && (
                <span className="mt-3 font-mono text-xs text-gray-800 bg-gray-100 px-3 py-1 rounded border border-gray-300">
                  Ready: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !file}
              className="px-5 py-2 bg-gov-navy text-white text-xs font-bold rounded hover:bg-gov-navy-dark disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Processing Import...' : 'Upload & Import Records'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
