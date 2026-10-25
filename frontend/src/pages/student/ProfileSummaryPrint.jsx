import React, { useEffect, useState } from 'react';
import { api, getFileUrl } from '../../services/api';
import { Printer, ArrowLeft, CheckCircle2, ShieldCheck, Award, GraduationCap, Building2 } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export const ProfileSummaryPrint = ({ studentId = null, onBack }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getStudentProfile(studentId);
        if (res.success) {
          setStudent(res.student);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-outline space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium">Generating official student dossier sheet...</span>
      </div>
    );
  }

  if (!student) {
    return <div className="p-12 text-center text-sm text-error">Student record not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto pb-16">
      
      {/* Action Header (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-outline-variant/30 no-print gap-3">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 border border-outline-variant/40 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface-variant transition-all active:scale-95"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-primary-fixed text-primary">
                A4 Gazette Dossier
              </span>
              <h1 className="text-xl font-bold text-primary tracking-tight">Student Profile Verification Summary</h1>
            </div>
            <p className="text-xs text-outline mt-0.5">
              Official Departmental Record Copy • DOTE & University Statutory Audit Standard
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save A4 PDF</span>
        </button>
      </div>

      {/* Printable Sheet (Standard Tamil Nadu UMIS / DOTE / University Record Format) */}
      <div className="bg-white border border-outline-variant/40 p-4 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-xl text-black print:p-0 print:border-none print:shadow-none print:rounded-none">
        
        {/* Institutional Header */}
        <div className="border-b-2 border-primary pb-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:flex-row">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <img src="/college-logo.webp" alt="AAMEC Crest" className="w-12 h-12 sm:w-16 sm:h-16 object-contain shrink-0" />
            <div>
              <h1 className="text-sm sm:text-base font-black uppercase tracking-wide text-primary leading-tight">
                Anjalai Ammal Mahalingam Engineering College
              </h1>
              <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-800">
                Department of Artificial Intelligence & Data Science
              </h2>
              <h3 className="text-[10px] sm:text-[11px] font-semibold uppercase text-gray-600 tracking-wide">
                Department Student Information System (UMIS Portal)
              </h3>
              <p className="text-[9.5px] sm:text-[10px] text-gray-500">
                Official Student Master Profile & Statutory Concessions Verification Dossier
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4 shrink-0 self-end sm:self-auto">
            <img src="/aids-logo.jpg" alt="AI & DS Emblem" className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-gray-300 object-cover shadow-xs" />
            <div className="text-right">
              <StatusBadge status={student.status} isLocked={Boolean(student.is_locked)} />
              <div className="text-[10px] text-gray-500 mt-1 font-mono">
                {new Date().toLocaleDateString('en-GB')}
              </div>
            </div>
          </div>
        </div>

        {/* Identification Table with Photo */}
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <div className="flex-1 overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full min-w-[500px] sm:min-w-0 text-xs border border-gray-300 border-collapse">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-bold p-2 w-1/4 border-r border-gray-300">Register Number</td>
                <td className="p-2 font-mono font-bold text-sm w-1/4 border-r border-gray-300 text-primary">{student.register_no}</td>
                <td className="bg-gray-50 font-bold p-2 w-1/4 border-r border-gray-300">Date of Birth</td>
                <td className="p-2 w-1/4 font-medium">{student.dob}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-bold p-2 border-r border-gray-300">Full Name</td>
                <td className="p-2 font-bold uppercase border-r border-gray-300" colSpan={3}>{student.name}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-bold p-2 border-r border-gray-300">Class & Section</td>
                <td className="p-2 border-r border-gray-300 font-medium">{student.year ? `Year ${student.year}` : 'Not set'}{student.section ? ` • Section ${student.section}` : ''}</td>
                <td className="bg-gray-50 font-bold p-2 border-r border-gray-300">Current Semester</td>
                <td className="p-2 font-medium">Semester {student.current_semester || 1}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-bold p-2 border-r border-gray-300">Gender / Blood</td>
                <td className="p-2 border-r border-gray-300">{student.gender || '-'} / {student.blood_group || '-'}</td>
                <td className="bg-gray-50 font-bold p-2 border-r border-gray-300">Community / Caste</td>
                <td className="p-2">{student.community} ({student.caste || '-'})</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-bold p-2 border-r border-gray-300">Aadhaar Number</td>
                <td className="p-2 font-mono border-r border-gray-300">
                  {student.aadhaar_no ? `XXXX-XXXX-${student.aadhaar_no.slice(-4)}` : 'Not Provided'}
                </td>
                <td className="bg-gray-50 font-bold p-2 border-r border-gray-300">Admission Mode</td>
                <td className="p-2">{student.mode_of_admission || 'Government Quota'}</td>
              </tr>
            </tbody>
            </table>
          </div>

          {/* Student Photo Box */}
          <div className="w-28 h-36 border border-gray-300 bg-gray-50 rounded-2xl flex flex-col items-center justify-center p-1 shrink-0 self-center sm:self-start overflow-hidden shadow-sm">
            {student.photo_path ? (
              <img src={getFileUrl(student.photo_path)} alt={student.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="text-[10px] text-gray-400 text-center font-medium">Affix Passport Photo</div>
            )}
          </div>
        </div>

        {/* Section 1: Contact Details */}
        <div className="mb-5">
          <h4 className="text-xs font-bold uppercase bg-gray-100 p-2 border border-gray-300 mb-1 text-primary">
            1. Contact & Residential Details
          </h4>
          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full min-w-[500px] sm:min-w-0 text-xs border border-gray-300 border-collapse">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-semibold p-2 w-1/4 border-r border-gray-300">Student Mobile</td>
                <td className="p-2 w-1/4 border-r border-gray-300">{student.mobile || '-'}</td>
                <td className="bg-gray-50 font-semibold p-2 w-1/4 border-r border-gray-300">Alternate Mobile</td>
                <td className="p-2 w-1/4">{student.alt_mobile || '-'}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-semibold p-2 border-r border-gray-300">Email Address</td>
                <td className="p-2 border-r border-gray-300" colSpan={3}>{student.email || '-'}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-semibold p-2 border-r border-gray-300">Permanent Address</td>
                <td className="p-2 border-r border-gray-300" colSpan={3}>
                  {student.permanent_address || '-'}, District: {student.district || '-'}, Pincode: {student.pincode || '-'}
                </td>
              </tr>
              <tr>
                <td className="bg-gray-50 font-semibold p-2 border-r border-gray-300">Communication Address</td>
                <td className="p-2 border-r border-gray-300" colSpan={3}>
                  {student.communication_address || student.permanent_address || '-'}
                </td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Family Particulars */}
        <div className="mb-5">
          <h4 className="text-xs font-bold uppercase bg-gray-100 p-2 border border-gray-300 mb-1 text-primary">
            2. Family & Income Particulars
          </h4>
          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full min-w-[500px] sm:min-w-0 text-xs border border-gray-300 border-collapse">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-semibold p-2 w-1/4 border-r border-gray-300">Father's Name</td>
                <td className="p-2 w-1/4 border-r border-gray-300">{student.father_name || '-'}</td>
                <td className="bg-gray-50 font-semibold p-2 w-1/4 border-r border-gray-300">Mother's Name</td>
                <td className="p-2 w-1/4">{student.mother_name || '-'}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-semibold p-2 border-r border-gray-300">Parents Occupation</td>
                <td className="p-2 border-r border-gray-300">{student.parents_occupation || '-'}</td>
                <td className="bg-gray-50 font-semibold p-2 border-r border-gray-300">Parents Mobile</td>
                <td className="p-2">{student.parents_mobile || '-'}</td>
              </tr>
              <tr>
                <td className="bg-gray-50 font-semibold p-2 border-r border-gray-300">Annual Family Income</td>
                <td className="p-2 border-r border-gray-300 font-semibold text-primary" colSpan={3}>
                  ₹ {student.annual_income ? Number(student.annual_income).toLocaleString('en-IN') : '0.00'}
                </td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Academic Record */}
        <div className="mb-5">
          <h4 className="text-xs font-bold uppercase bg-gray-100 p-2 border border-gray-300 mb-1 text-primary">
            3. Qualifying Examination Records
          </h4>
          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full min-w-[500px] sm:min-w-0 text-xs border border-gray-300 border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300 text-left font-bold">
                <th className="p-2 border-r border-gray-300">Course / Standard</th>
                <th className="p-2 border-r border-gray-300">Institution Name</th>
                <th className="p-2 border-r border-gray-300">Board</th>
                <th className="p-2 border-r border-gray-300">Year</th>
                <th className="p-2">Percentage (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold border-r border-gray-300">SSLC (10th)</td>
                <td className="p-2 border-r border-gray-300">{student.sslc_school || '-'}</td>
                <td className="p-2 border-r border-gray-300">{student.sslc_board || '-'}</td>
                <td className="p-2 border-r border-gray-300">{student.sslc_year || '-'}</td>
                <td className="p-2 font-bold text-primary">{student.sslc_percentage ? `${student.sslc_percentage}%` : '-'}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold border-r border-gray-300">HSC (12th) / Diploma</td>
                <td className="p-2 border-r border-gray-300">{student.hsc_school || '-'}</td>
                <td className="p-2 border-r border-gray-300">{student.hsc_board || '-'}</td>
                <td className="p-2 border-r border-gray-300">{student.hsc_year || '-'}</td>
                <td className="p-2 font-bold text-primary">{student.hsc_percentage ? `${student.hsc_percentage}%` : '-'}</td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Scholarship & Bank Details */}
        <div className="mb-5">
          <h4 className="text-xs font-bold uppercase bg-gray-100 p-2 border border-gray-300 mb-1 text-primary">
            4. Statutory Concessions, Scholarship & Bank Details
          </h4>
          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full min-w-[500px] sm:min-w-0 text-xs border border-gray-300 border-collapse">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-semibold p-2 w-1/4 border-r border-gray-300">First Graduate Concession</td>
                <td className="p-2 w-1/4 border-r border-gray-300 font-bold text-primary">{student.is_first_graduate ? 'YES (Eligible)' : 'NO'}</td>
                <td className="bg-gray-50 font-semibold p-2 w-1/4 border-r border-gray-300">PMS Beneficiary</td>
                <td className="p-2 w-1/4 font-bold">{student.is_pms ? `YES (${student.pms_status || 'Applied'})` : 'NO'}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-semibold p-2 border-r border-gray-300">Bank Name & Branch</td>
                <td className="p-2 border-r border-gray-300">{student.bank_name || '-'} ({student.bank_branch || '-'})</td>
                <td className="bg-gray-50 font-semibold p-2 border-r border-gray-300">IFSC Code</td>
                <td className="p-2 font-mono">{student.bank_ifsc || '-'}</td>
              </tr>
              <tr>
                <td className="bg-gray-50 font-semibold p-2 border-r border-gray-300">Account Holder Name</td>
                <td className="p-2 border-r border-gray-300">{student.bank_acc_holder || '-'}</td>
                <td className="bg-gray-50 font-semibold p-2 border-r border-gray-300">Account Number</td>
                <td className="p-2 font-mono font-bold text-primary">{student.bank_acc_no ? `XXXXXX${student.bank_acc_no.slice(-4)}` : '-'}</td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Uploaded Documents Verification Status */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase bg-gray-100 p-2 border border-gray-300 mb-1 text-primary">
            5. Attached Supporting Credentials Checklist
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {['photo', 'aadhaar', 'community_cert', 'income_cert', 'first_graduate_cert', 'bank_passbook', 'sslc_marksheet', 'hsc_marksheet'].map((type) => {
              const doc = student.documents?.find((d) => d.doc_type === type);
              return (
                <div key={type} className="border border-gray-200 p-2 rounded-xl flex items-center justify-between bg-surface-container-low/40">
                  <span className="capitalize text-gray-700 text-[11px] font-medium">{type.replace(/_/g, ' ')}:</span>
                  {doc ? (
                    <span className="text-emerald-700 font-bold text-[10px] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Uploaded
                    </span>
                  ) : (
                    <span className="text-gray-400 text-[10px]">Not Uploaded</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Signatures & Declarations */}
        <div className="mt-10 pt-6 border-t border-gray-400 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs print:grid-cols-3">
          <div>
            <div className="h-10"></div>
            <div className="border-t border-gray-500 pt-1.5 font-semibold text-gray-900">
              Signature of the Student
            </div>
            <div className="text-[10px] text-gray-500">
              Date: {student.submission_date ? new Date(student.submission_date).toLocaleDateString('en-GB') : '____/____/2026'}
            </div>
          </div>

          <div>
            <div className="h-10"></div>
            <div className="border-t border-gray-500 pt-1.5 font-semibold text-gray-900">
              Department Verification In-Charge
            </div>
            <div className="text-[10px] text-gray-500">Class Advisor / Tutor</div>
          </div>

          <div>
            <div className="h-10"></div>
            <div className="border-t border-gray-500 pt-1.5 font-semibold text-gray-900">
              Head of the Department
            </div>
            <div className="text-[10px] text-gray-500">Dept of AI & DS (Institutional Seal)</div>
          </div>
        </div>

      </div>
    </div>
  );
};
