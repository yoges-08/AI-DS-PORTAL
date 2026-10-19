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
  Trash2
} from 'lucide-react';
import { api } from '../services/api';
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white border border-gov-border rounded-md shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gov-navy text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <h3 className="text-sm sm:text-base font-bold tracking-wide uppercase">
              Student Master Profile Dossier
            </h3>
            {student && <StatusBadge status={student.status} isLocked={Boolean(student.is_locked)} />}
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="bg-gray-100 border-b border-gray-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleLock}
              disabled={actionLoading}
              className={`inline-flex items-center px-3 py-1.5 rounded font-semibold border ${
                student?.is_locked
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {student?.is_locked ? <Unlock className="w-3.5 h-3.5 mr-1" /> : <Lock className="w-3.5 h-3.5 mr-1" />}
              <span>{student?.is_locked ? 'Unlock Record' : 'Lock Record'}</span>
            </button>

            <button
              onClick={handleResetPassword}
              disabled={actionLoading}
              className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-800 rounded font-semibold hover:bg-gray-50"
              title="Reset password to Date of Birth"
            >
              <KeyRound className="w-3.5 h-3.5 mr-1 text-gov-navy" />
              <span>Reset Password to DOB</span>
            </button>

            <button
              onClick={() => onEditStudent && onEditStudent(student.id)}
              className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-800 rounded font-semibold hover:bg-gray-50"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1 text-blue-700" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={handleDeleteStudent}
              disabled={actionLoading}
              className="inline-flex items-center px-3 py-1.5 bg-white border border-red-300 text-red-700 rounded font-semibold hover:bg-red-50"
              title="Permanently delete student profile and login"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1 text-red-600" />
              <span>Delete Record</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {student?.status !== 'VERIFIED' && (
              <button
                onClick={() => handleStatusUpdate('VERIFIED')}
                disabled={actionLoading}
                className="inline-flex items-center px-3 py-1.5 bg-green-700 text-white rounded font-bold hover:bg-green-800"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Verify
              </button>
            )}

            {student?.status !== 'REJECTED' && (
              <button
                onClick={() => setRejectionModal(true)}
                disabled={actionLoading}
                className="inline-flex items-center px-3 py-1.5 bg-red-700 text-white rounded font-bold hover:bg-red-800"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
              </button>
            )}
          </div>
        </div>

        {/* Message Banner */}
        {msg.text && (
          <div className={`px-5 py-2 text-xs flex items-center space-x-1.5 border-b ${
            msg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {msg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-green-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Rejection Prompt Inline */}
        {rejectionModal && (
          <div className="bg-red-50 border-b border-red-200 p-4 text-xs">
            <h4 className="font-bold text-red-900 mb-1">State Rejection Reason:</h4>
            <textarea
              rows={2}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Bank passbook not clearly readable; income certificate date expired."
              className="w-full p-2 border border-red-300 rounded text-xs focus:outline-none focus:border-red-600 mb-2"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRejectionModal(false)}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate('REJECTED', rejectionReason)}
                className="px-3 py-1 bg-red-700 text-white rounded font-bold hover:bg-red-800"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-800">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading student dossier...</div>
          ) : !student ? (
            <div className="text-center py-12 text-red-600">Failed to load student information.</div>
          ) : (
            <>
              {/* Photo & Primary Demographics */}
              <div className="flex flex-col sm:flex-row gap-5 border border-gray-200 p-4 rounded bg-gray-50/50">
                <div className="w-24 h-32 border border-gray-300 bg-gray-100 rounded flex items-center justify-center overflow-hidden shrink-0">
                  {student.photo_path ? (
                    <img src={student.photo_path} alt="Student" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] text-gray-400 text-center">No Photo</span>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-gray-500 block text-[11px]">Register Number</span>
                    <strong className="font-mono text-sm text-gov-navy">{student.register_no}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Full Name</span>
                    <strong className="text-sm">{student.name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Date of Birth</span>
                    <strong>{student.dob}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Year & Section</span>
                    <strong>{student.year ? `Year ${student.year}` : 'Not set'}{student.section ? ` - Sec ${student.section}` : ''}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Gender / Blood Group</span>
                    <strong>{student.gender || '-'} / {student.blood_group || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Community / Caste</span>
                    <strong>{student.community} ({student.caste || '-'})</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Aadhaar (Full Visible)</span>
                    <strong className="font-mono text-gov-navy">{student.aadhaar_no || 'Not Provided'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Nationality</span>
                    <strong>{student.nationality || 'Indian'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Mother Tongue</span>
                    <strong>{student.mother_tongue || 'Tamil'}</strong>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border border-gray-200 rounded p-4">
                <h4 className="font-bold text-gov-navy uppercase border-b border-gray-200 pb-1.5 mb-2.5">
                  Contact & Communication Particulars
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><span className="text-gray-500">Student Mobile:</span> <strong>{student.mobile || '-'}</strong></div>
                  <div><span className="text-gray-500">Alternate Mobile:</span> <strong>{student.alt_mobile || '-'}</strong></div>
                  <div><span className="text-gray-500">Email:</span> <strong>{student.email || '-'}</strong></div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-500 block">Permanent Address:</span>
                    <span>{student.permanent_address || '-'}, District: {student.district || '-'}, Pincode: {student.pincode || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Communication Address:</span>
                    <span>{student.communication_address || student.permanent_address || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Family & Academic Standing */}
              <div className="border border-gray-200 rounded p-4">
                <h4 className="font-bold text-gov-navy uppercase border-b border-gray-200 pb-1.5 mb-2.5">
                  Family Particulars & Academic Records
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><span className="text-gray-500">Father's Name:</span> <strong>{student.father_name || '-'}</strong></div>
                  <div><span className="text-gray-500">Mother's Name:</span> <strong>{student.mother_name || '-'}</strong></div>
                  <div><span className="text-gray-500">Parents Mobile:</span> <strong>{student.parents_mobile || '-'}</strong></div>
                  <div><span className="text-gray-500">Parents Occupation:</span> <strong>{student.parents_occupation || '-'}</strong></div>
                  <div><span className="text-gray-500">Annual Family Income:</span> <strong className="text-gov-navy">₹ {student.annual_income ? Number(student.annual_income).toLocaleString('en-IN') : '0.00'}</strong></div>
                  <div><span className="text-gray-500">Mode of Admission:</span> <strong>{student.mode_of_admission || '-'}</strong></div>
                  <div><span className="text-gray-500">10th Standard:</span> <strong>{student.sslc_percentage ? `${student.sslc_percentage}% (${student.sslc_school || ''})` : '-'}</strong></div>
                  <div><span className="text-gray-500">12th / Diploma:</span> <strong>{student.hsc_percentage ? `${student.hsc_percentage}% (${student.hsc_school || ''})` : '-'}</strong></div>
                  <div><span className="text-gray-500">Semester:</span> <strong>Semester {student.current_semester || 1}</strong></div>
                </div>
              </div>

              {/* Scholarship & Bank Particulars */}
              <div className="border border-gray-200 rounded p-4">
                <h4 className="font-bold text-gov-navy uppercase border-b border-gray-200 pb-1.5 mb-2.5">
                  Scholarships & Bank Account Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><span className="text-gray-500">First Graduate:</span> <strong className="text-gov-navy">{student.is_first_graduate ? 'YES (Eligible)' : 'NO'}</strong></div>
                  <div><span className="text-gray-500">PMS Beneficiary:</span> <strong>{student.is_pms ? `YES (App: ${student.pms_application_no || 'N/A'}, Status: ${student.pms_status || 'Applied'})` : 'NO'}</strong></div>
                  <div><span className="text-gray-500">Bank Name:</span> <strong>{student.bank_name || '-'}</strong></div>
                  <div><span className="text-gray-500">Account Number (Full):</span> <strong className="font-mono text-gov-navy">{student.bank_acc_no || '-'}</strong></div>
                  <div><span className="text-gray-500">IFSC Code:</span> <strong className="font-mono">{student.bank_ifsc || '-'}</strong></div>
                  <div><span className="text-gray-500">Branch:</span> <strong>{student.bank_branch || '-'}</strong></div>
                </div>
              </div>

              {/* Documents Preview Table */}
              <div className="border border-gray-200 rounded p-4">
                <h4 className="font-bold text-gov-navy uppercase border-b border-gray-200 pb-1.5 mb-2.5">
                  Uploaded Documents & Proofs ({student.documents?.length || 0})
                </h4>
                {student.documents && student.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {student.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded">
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="w-4 h-4 text-gov-navy shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold block capitalize truncate">{doc.doc_type.replace('_', ' ')}</span>
                            <span className="text-[10px] text-gray-500 truncate block">{doc.file_name}</span>
                          </div>
                        </div>
                        <a
                          href={doc.file_path}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center px-2 py-1 bg-white border border-gray-300 text-gov-navy rounded text-[11px] font-semibold hover:bg-gray-100 shrink-0 ml-2"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" /> View / Download
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No documents uploaded by student yet.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex items-center justify-between shrink-0 text-xs">
          <span className="text-gray-500">
            Audit ID: {student ? `STU-${student.id}` : ''} | Last Updated: {student?.updated_at ? new Date(student.updated_at).toLocaleString('en-GB') : '-'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
