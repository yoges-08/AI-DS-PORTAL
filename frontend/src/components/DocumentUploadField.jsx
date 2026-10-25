import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileText, Trash2, ExternalLink } from 'lucide-react';
import { api, getFileUrl } from '../services/api';

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

    // Reset error
    setError('');

    // Size validation (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 2 MB limit.`);
      e.target.value = '';
      return;
    }

    // Type validation
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setError('Only PDF, JPG, PNG, and WebP files are permitted.');
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);
      const res = await api.uploadDocument(file, docType, studentId);
      if (res.success && res.document) {
        onUploadSuccess && onUploadSuccess(docType, res.document);
      }
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!currentDoc?.id) return;
    if (!window.confirm(`Are you sure you want to delete this ${label}?`)) return;

    try {
      setUploading(true);
      await api.deleteDocument(currentDoc.id, studentId);
      onDeleteSuccess && onDeleteSuccess(docType, currentDoc.id);
    } catch (err) {
      setError(err.message || 'Failed to delete document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-white/75 backdrop-blur-md border border-outline-variant/40 rounded-2xl hover:border-outline-variant transition-all shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-xs font-bold text-on-surface uppercase tracking-wide block">
            {label} {required && <span className="text-rose-600">*</span>}
          </label>
          <span className="text-[11px] text-on-surface-variant">{helperText}</span>
        </div>

        {currentDoc ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
          </span>
        ) : (
          <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            Pending
          </span>
        )}
      </div>

      {/* Uploaded File Row */}
      {currentDoc ? (
        <div className="mt-3 flex items-center justify-between bg-surface-container/60 border border-outline-variant/30 rounded-xl p-2.5 text-xs">
          <div className="flex items-center space-x-2 truncate">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-on-surface truncate" title={currentDoc.fileName || currentDoc.file_name}>
              {currentDoc.fileName || currentDoc.file_name || 'Document'}
            </span>
            <span className="text-outline text-[11px] shrink-0 font-mono">
              ({currentDoc.fileSize || currentDoc.file_size ? `${Math.round((currentDoc.fileSize || currentDoc.file_size) / 1024)} KB` : ''})
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0 ml-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await api.openDocument(currentDoc.filePath || currentDoc.file_path);
                } catch (err) {
                  alert(err.message || 'Failed to open document');
                }
              }}
              className="inline-flex items-center justify-center px-3 py-2 min-h-[38px] text-xs font-semibold text-primary hover:bg-white bg-white/70 border border-outline-variant/40 rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95"
              title="Preview / Open document"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View
            </button>
            {!disabled && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={uploading}
                className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors active:scale-95"
                title="Delete document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <label className={`w-full sm:w-auto inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 bg-white border border-outline-variant/60 hover:border-primary text-primary text-xs font-semibold rounded-xl cursor-pointer hover:bg-surface-container transition-all shadow-2xs active:scale-98 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Upload className="w-4 h-4 mr-2" />
            <span>{uploading ? 'Uploading...' : 'Choose File to Upload'}</span>
            <input
              type="file"
              disabled={disabled || uploading}
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
            />
          </label>
        </div>
      )}

      {error && (
        <div className="mt-2 text-xs text-rose-700 bg-rose-50/80 p-2 rounded-lg border border-rose-200/60 flex items-center space-x-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
