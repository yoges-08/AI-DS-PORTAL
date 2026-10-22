import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  KeyRound, 
  CheckCircle, 
  XCircle, 
  Printer, 
  ExternalLink, 
  FileText, 
  Edit3, 
  AlertCircle,
  Trash2,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Landmark,
  Award,
  Users
} from 'lucide-react';
import { api, getFileUrl } from '../services/api';
import { StatusBadge } from './StatusBadge';

export const StudentDetailModal = ({ studentId, isOpen, onClose, onRefresh, onEditStudent }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [rejectionModal, setRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadData = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const res = await api.getStudentProfile(studentId);
      if (res.success) {
        setStudent(res.student);
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to load details.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setMsg({ type: '', text: '' });
    }
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  // Lock / Unlock
  const handleToggleLock = async () => {
    if (!student) return;
    const newLock = !student.is_locked;
    try {
      setActionLoading(true);
      const res = await api.toggleLock(student.id, newLock);
      setMsg({ type: 'success', text: res.message });
      setStudent((prev) => ({ ...prev, is_locked: newLock ? 1 : 0 }));
      onRefresh && onRefresh();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to toggle lock.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Password to DOB
  const handleResetPassword = async () => {
    if (!student) return;
    if (!window.confirm(`Are you sure you want to reset password for ${student.name} back to Date of Birth?`)) return;

    try {
      setActionLoading(true);
      const res = await api.resetPassword(student.id);
      setMsg({ type: 'success', text: res.message });
      onRefresh && onRefresh();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to reset password.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Update Status
  const handleStatusUpdate = async (newStatus, reason = '') => {
    if (!student) return;
    try {
      setActionLoading(true);
      const res = await api.updateStudentStatus(student.id, newStatus, reason);
      setMsg({ type: 'success', text: res.message });
      setStudent((prev) => ({ ...prev, status: newStatus, rejection_reason: reason || null }));
      setRejectionModal(false);
      onRefresh && onRefresh();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to update status.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Permanently Delete Student Record and Login
  const handleDeleteStudent = async () => {
    if (!student) return;
    const confirmPrompt = `Are you sure you want to PERMANENTLY delete student ${student.name} (${student.register_no})?\n\nThis will permanently delete:\n• Their login credentials\n• Their entire master profile\n• All uploaded certificates and documents\n\nThis action cannot be undone. Proceed?`;
    if (!window.confirm(confirmPrompt)) return;

    try {
      setActionLoading(true);
      const res = await api.deleteStudent(student.id);
      alert(res.message || 'Student record deleted successfully.');
      onClose();
      onRefresh && onRefresh();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to delete student record.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/60 shadow-[0_24px_64px_rgba(0,0,0,0.18)] rounded-3xl w-full max-w-4xl my-auto max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-primary via-primary-container to-secondary px-6 py-4 flex items-center justify-between shrink-0 text-white shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                  Dossier #{student?.register_no || 'INSPECTOR'}
                </h3>
                {student && <StatusBadge status={student.status} isLocked={Boolean(student.is_locked)} />}
              </div>
              <p className="text-xs text-white/70">
                Department of AI & Data Science • Academic Master Record
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="bg-surface-container-low/80 border-b border-outline-variant/30 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 backdrop-blur-md text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleLock}
              disabled={actionLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border transition-all active:scale-95 ${
                student?.is_locked
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-white text-on-surface border-outline-variant/50 hover:bg-surface-container shadow-sm'
              }`}
            >
              {student?.is_locked ? <Unlock className="w-3.5 h-3.5 text-amber-700" /> : <Lock className="w-3.5 h-3.5 text-primary" />}
              <span>{student?.is_locked ? 'Unlock Record' : 'Lock Record'}</span>
            </button>

            <button
              onClick={handleResetPassword}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-outline-variant/50 text-on-surface rounded-xl font-semibold hover:bg-surface-container shadow-sm transition-all active:scale-95"
              title="Reset password to Date of Birth"
            >
              <KeyRound className="w-3.5 h-3.5 text-primary" />
              <span>Reset Password to DOB</span>
            </button>

            <button
              onClick={() => onEditStudent && onEditStudent(student.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-outline-variant/50 text-secondary rounded-xl font-semibold hover:bg-secondary-fixed/30 shadow-sm transition-all active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={handleDeleteStudent}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-error rounded-xl font-semibold hover:bg-red-50 shadow-sm transition-all active:scale-95"
              title="Permanently delete student profile and login"
            >
              <Trash2 className="w-3.5 h-3.5 text-error" />
              <span>Delete Record</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {student?.status !== 'VERIFIED' && (
              <button
                onClick={() => handleStatusUpdate('VERIFIED')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm transition-all active:scale-95"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verify & Approve</span>
              </button>
            )}

            {student?.status !== 'REJECTED' && (
              <button
                onClick={() => setRejectionModal(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-sm transition-all active:scale-95"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Banner */}
        {msg.text && (
          <div className={`px-6 py-2.5 text-xs flex items-center space-x-2 border-b ${
            msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {msg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span className="font-medium">{msg.text}</span>
          </div>
        )}

        {/* Rejection Prompt Inline */}
        {rejectionModal && (
          <div className="bg-rose-50/80 backdrop-blur-md border-b border-rose-200 p-5 text-xs">
            <h4 className="font-bold text-rose-900 mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              State Detailed Rejection / Discrepancy Reason:
            </h4>
            <textarea
              rows={2}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Bank passbook not clearly readable; income certificate date expired."
              className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-rose-500 mb-3 shadow-inner"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRejectionModal(false)}
                className="px-3 py-1.5 bg-white border border-outline-variant/40 rounded-xl text-on-surface-variant font-medium hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate('REJECTED', rejectionReason)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm transition-all active:scale-95"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-on-surface bg-surface/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-outline space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Loading student dossier from secure storage...</span>
            </div>
          ) : !student ? (
            <div className="text-center py-16 text-error">Failed to load student information.</div>
          ) : (
            <>
              {/* Photo & Primary Demographics Hero */}
              <div className="bg-surface-container-low/70 border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-5 relative overflow-hidden backdrop-blur-md">
                <div className="relative shrink-0 flex justify-center">
                  <div className="w-28 h-36 rounded-2xl border-2 border-white shadow-md bg-surface-container-high overflow-hidden flex items-center justify-center">
                    {student.photo_path ? (
                      <img src={getFileUrl(student.photo_path)} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-outline font-medium text-center px-2">No Photo Uploaded</span>
                    )}
                  </div>
                  <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${student.is_locked ? 'bg-amber-500' : 'bg-emerald-500'}`} title={student.is_locked ? 'Record Locked' : 'Active'} />
                </div>

                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-y-3.5 gap-x-4">
                  <div>
                    <span className="text-outline block text-[11px] font-medium uppercase tracking-wider">Register Number</span>
                    <strong className="font-mono text-sm text-primary tracking-wide">{student.register_no}</strong>
                  </div>
                  <div>
                    <span className="text-outline block text-[11px] font-medium uppercase tracking-wider">Full Name</span>
                    <strong className="text-sm text-on-surface">{student.name}</strong>
                  </div>
                  <div>
                    <span className="text-outline block text-[11px] font-medium uppercase tracking-wider">Date of Birth</span>
                    <strong className="text-sm text-on-surface">{student.dob}</strong>
                  </div>
                  <div>
                    <span className="text-outline block text-[11px] font-medium uppercase tracking-wider">Year & Section</span>
                    <strong className="text-on-surface">{student.year ? `Year ${student.year}` : 'Not set'}{student.section ? ` • Sec ${student.section}` : ''}</strong>
                  </div>
                  <div>
                    <span className="text-outline block text-[11px] font-medium uppercase tracking-wider">Gender / Blood</span>
                    <strong className="text-on-surface">{student.gender || '-'} / {student.blood_group || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-outline block text-[11px] font-medium uppercase tracking-wider">Community / Caste</span>
                    <strong className="text-on-surface">{student.community} ({student.caste || '-'})</strong>
                  </div>
                  <div>
                    <span className="text-outline block text-[11px] font-medium uppercase tracking-wider">Aadhaar (Visible)</span>
                    <strong className="font-mono text-primary">{student.aadhaar_no || 'Not Provided'}</strong>
                  </div>
                  <div>
                    <span className="text-outline block text-[11px] font-medium uppercase tracking-wider">Nationality</span>
                    <strong className="text-on-surface">{student.nationality || 'Indian'}</strong>
                  </div>
                  <div>
                    <span className="text-outline block text-[11px] font-medium uppercase tracking-wider">Mother Tongue</span>
                    <strong className="text-on-surface">{student.mother_tongue || 'Tamil'}</strong>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-surface-container-low/60 border border-outline-variant/30 rounded-2xl p-5 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2 mb-3 text-primary font-bold uppercase tracking-wider text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-secondary" />
                  <span>Contact & Communication Particulars</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><span className="text-outline block text-[11px]">Student Mobile:</span> <strong className="text-on-surface">{student.mobile || '-'}</strong></div>
                  <div><span className="text-outline block text-[11px]">Alternate Mobile:</span> <strong className="text-on-surface">{student.alt_mobile || '-'}</strong></div>
                  <div><span className="text-outline block text-[11px]">Email:</span> <strong className="text-on-surface">{student.email || '-'}</strong></div>
                </div>
                <div className="mt-3 pt-3 border-t border-outline-variant/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-outline block text-[11px]">Permanent Address:</span>
                    <span className="text-on-surface font-medium">{student.permanent_address || '-'}, District: {student.district || '-'}, Pincode: {student.pincode || '-'}</span>
                  </div>
                  <div>
                    <span className="text-outline block text-[11px]">Communication Address:</span>
                    <span className="text-on-surface font-medium">{student.communication_address || student.permanent_address || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Family & Academic Standing */}
              <div className="bg-surface-container-low/60 border border-outline-variant/30 rounded-2xl p-5 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2 mb-3 text-primary font-bold uppercase tracking-wider text-[11px]">
                  <Users className="w-3.5 h-3.5 text-secondary" />
                  <span>Family Particulars & Academic Records</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  <div><span className="text-outline block text-[11px]">Father's Name:</span> <strong className="text-on-surface">{student.father_name || '-'}</strong></div>
                  <div><span className="text-outline block text-[11px]">Mother's Name:</span> <strong className="text-on-surface">{student.mother_name || '-'}</strong></div>
                  <div><span className="text-outline block text-[11px]">Parents Mobile:</span> <strong className="text-on-surface">{student.parents_mobile || '-'}</strong></div>
                  <div><span className="text-outline block text-[11px]">Parents Occupation:</span> <strong className="text-on-surface">{student.parents_occupation || '-'}</strong></div>
                  <div><span className="text-outline block text-[11px]">Annual Family Income:</span> <strong className="text-primary font-semibold">₹ {student.annual_income ? Number(student.annual_income).toLocaleString('en-IN') : '0.00'}</strong></div>
                  <div><span className="text-outline block text-[11px]">Mode of Admission:</span> <strong className="text-on-surface">{student.mode_of_admission || '-'}</strong></div>
                  <div><span className="text-outline block text-[11px]">10th Standard:</span> <strong className="text-on-surface">{student.sslc_percentage ? `${student.sslc_percentage}% (${student.sslc_school || ''})` : '-'}</strong></div>
                  <div><span className="text-outline block text-[11px]">12th / Diploma:</span> <strong className="text-on-surface">{student.hsc_percentage ? `${student.hsc_percentage}% (${student.hsc_school || ''})` : '-'}</strong></div>
                  <div><span className="text-outline block text-[11px]">Current Semester:</span> <strong className="text-primary font-semibold">Semester {student.current_semester || 1}</strong></div>
                </div>
              </div>

              {/* Scholarship & Bank Particulars */}
              <div className="bg-surface-container-low/60 border border-outline-variant/30 rounded-2xl p-5 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2 mb-3 text-primary font-bold uppercase tracking-wider text-[11px]">
                  <Landmark className="w-3.5 h-3.5 text-secondary" />
                  <span>Scholarships & Bank Account Details</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  <div>
                    <span className="text-outline block text-[11px]">First Graduate:</span> 
                    <strong className={student.is_first_graduate ? 'text-emerald-700' : 'text-on-surface'}>
                      {student.is_first_graduate ? 'YES (Eligible)' : 'NO'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-outline block text-[11px]">PMS Beneficiary:</span> 
                    <strong className="text-on-surface">
                      {student.is_pms ? `YES (App: ${student.pms_application_no || 'N/A'}, Status: ${student.pms_status || 'Applied'})` : 'NO'}
                    </strong>
                  </div>
                  <div><span className="text-outline block text-[11px]">Bank Name:</span> <strong className="text-on-surface">{student.bank_name || '-'}</strong></div>
                  <div><span className="text-outline block text-[11px]">Account Number:</span> <strong className="font-mono text-primary font-semibold">{student.bank_acc_no || '-'}</strong></div>
                  <div><span className="text-outline block text-[11px]">IFSC Code:</span> <strong className="font-mono text-on-surface">{student.bank_ifsc || '-'}</strong></div>
                  <div><span className="text-outline block text-[11px]">Branch:</span> <strong className="text-on-surface">{student.bank_branch || '-'}</strong></div>
                </div>
              </div>

              {/* Documents Preview Section */}
              <div className="bg-surface-container-low/60 border border-outline-variant/30 rounded-2xl p-5 shadow-sm backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2 mb-3">
                  <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-secondary" />
                    <span>Uploaded Documents & Proofs ({student.documents?.length || 0})</span>
                  </div>
                  <span className="text-[11px] text-outline font-medium">Secured in Cloudflare R2</span>
                </div>

                {student.documents && student.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {student.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-white/90 border border-outline-variant/30 rounded-xl hover:shadow-md transition-all">
                        <div className="flex items-center space-x-2.5 truncate min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-secondary-fixed/50 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <div className="truncate">
                            <span className="font-semibold block capitalize truncate text-on-surface text-xs">{doc.doc_type.replace(/_/g, ' ')}</span>
                            <span className="text-[10px] text-outline truncate block font-mono">{doc.file_name}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await api.openDocument(doc.file_path);
                            } catch (err) {
                              alert(err.message || 'Failed to open document');
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-container-high hover:bg-secondary-fixed/60 text-primary border border-outline-variant/40 rounded-lg text-[11px] font-semibold transition-all shrink-0 ml-2 shadow-sm cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-outline italic text-center py-4">No documents uploaded by student yet.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-surface-container-lowest/90 border-t border-outline-variant/30 px-6 py-3.5 flex items-center justify-between shrink-0 text-xs backdrop-blur-xl">
          <span className="text-outline font-mono text-[11px]">
            Audit ID: {student ? `STU-${student.id}` : ''} • Last Modified: {student?.updated_at ? new Date(student.updated_at).toLocaleString('en-GB') : '-'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl font-semibold transition-all active:scale-95 shadow-sm"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
