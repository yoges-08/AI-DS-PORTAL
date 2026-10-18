import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileText, Trash2, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

export const DocumentUploadField = ({
  label,
  docType,
  required = false,
  helperText = 'PDF, JPG, PNG, WebP up to 2MB',
  currentDoc,
  onUploadSuccess,
  onDeleteSuccess,
  disabled = false,
  studentId = null
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Check size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 2 MB limit.`);
      return;
    }

    // Check file type and extension
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/jpg', 'image/pjpeg', 'image/x-png',
      'image/webp', 'application/pdf'
    ];

    if (!allowedExts.includes(ext) || (!allowedTypes.includes(file.type) && file.type !== '')) {
      setError('Only PDF, JPG, PNG, and WebP formats are permitted.');
      return;
    }

    try {
      setUploading(true);
      const res = await api.uploadDocument(file, docType, studentId);
      if (res.success) {
        onUploadSuccess && onUploadSuccess(docType, res.document);
      }
    } catch (err) {
      console.error('[Document Upload Error]:', err);
      setError(err.message || 'Failed to upload document. Please ensure backend server is running.');
    } finally {
      setUploading(false);
      // Reset input value
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!currentDoc || disabled) return;
    if (!window.confirm(`Are you sure you want to remove the uploaded ${label}?`)) return;

    try {
      setUploading(true);
      const res = await api.deleteDocument(currentDoc.id, studentId);
      if (res.success) {
        onDeleteSuccess && onDeleteSuccess(docType, currentDoc.id);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border border-gov-border rounded p-3.5 bg-white">
      <div className="flex items-start justify-between">
        <div>
          <label className="text-xs font-semibold text-gray-800 uppercase tracking-wide block">
            {label} {required && <span className="text-red-600">*</span>}
          </label>
          <span className="text-[12px] text-gray-500">{helperText}</span>
        </div>

        {currentDoc ? (
          <span className="inline-flex items-center text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Uploaded
          </span>
        ) : (
          <span className="inline-flex items-center text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
            Pending
          </span>
        )}
      </div>

      {/* Uploaded File Row */}
      {currentDoc ? (
        <div className="mt-3 flex items-center justify-between bg-gray-50 border border-gray-200 rounded p-2 text-xs">
          <div className="flex items-center space-x-2 truncate">
            <FileText className="w-4 h-4 text-gov-navy shrink-0" />
            <span className="font-medium text-gray-700 truncate" title={currentDoc.fileName || currentDoc.file_name}>
              {currentDoc.fileName || currentDoc.file_name || 'Document'}
            </span>
            <span className="text-gray-400 text-[11px] shrink-0">
              ({currentDoc.fileSize || currentDoc.file_size ? `${Math.round((currentDoc.fileSize || currentDoc.file_size) / 1024)} KB` : ''})
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0 ml-2">
            <a
              href={currentDoc.filePath || currentDoc.file_path}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-2 py-1 text-xs text-gov-navy hover:underline bg-white border border-gray-300 rounded"
              title="Preview / Open document"
            >
              <ExternalLink className="w-3 h-3 mr-1" /> View
            </a>
            {!disabled && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={uploading}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                title="Delete document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <label className={`inline-flex items-center px-3 py-1.5 border border-gov-navy text-gov-navy text-xs font-semibold rounded cursor-pointer hover:bg-blue-50 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            <span>{uploading ? 'Uploading...' : 'Choose File to Upload'}</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              disabled={disabled || uploading}
              className="sr-only"
            />
          </label>
        </div>
      )}

      {error && (
        <div className="mt-2 text-xs text-red-600 flex items-center">
          <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
