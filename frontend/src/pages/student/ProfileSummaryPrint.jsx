import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';
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
    return <div className="p-8 text-center text-sm text-gray-500">Loading profile summary...</div>;
  }

  if (!student) {
    return <div className="p-8 text-center text-sm text-red-600">Student record not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Action Header (Hidden in Print) */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gov-border no-print">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gov-navy">Student Profile Verification Summary</h1>
            <p className="text-xs text-gray-500">Official Departmental Record Copy</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center px-4 py-1.5 bg-gov-navy text-white text-xs font-semibold rounded hover:bg-gov-navy-dark shadow-sm"
        >
          <Printer className="w-4 h-4 mr-1.5" /> Print Profile Sheet
        </button>
      </div>

      {/* Printable Sheet (Standard Tamil Nadu UMIS / DOTE / University Record Format) */}
      <div className="bg-white border border-gov-border p-8 print-container rounded shadow-sm text-black">
        
        {/* Institutional Header */}
        <div className="border-b-2 border-gov-navy pb-4 mb-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src="/logo.svg" alt="Emblem" className="w-16 h-16 object-contain" />
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-gov-navy">
                Department of Artificial Intelligence & Data Science
              </h2>
              <h3 className="text-xs font-semibold uppercase text-gray-700 tracking-wide">
                Department Student Information System (UMIS Portal)
              </h3>
              <p className="text-[11px] text-gray-500">
                Official Student Master Profile & Statutory Concessions Verification Dossier
              </p>
            </div>
          </div>

          <div className="text-right">
            <StatusBadge status={student.status} isLocked={Boolean(student.is_locked)} />
            <div className="text-[10px] text-gray-500 mt-1">
              Generated: {new Date().toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>

        {/* Identification Table with Photo */}
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <table className="flex-1 text-xs border border-gray-300 border-collapse">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-bold p-2 w-1/4 border-r border-gray-300">Register Number</td>
                <td className="p-2 font-mono font-bold text-sm w-1/4 border-r border-gray-300">{student.register_no}</td>
                <td className="bg-gray-50 font-bold p-2 w-1/4 border-r border-gray-300">Date of Birth</td>
                <td className="p-2 w-1/4">{student.dob}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-bold p-2 border-r border-gray-300">Full Name</td>
                <td className="p-2 font-bold uppercase border-r border-gray-300" colSpan={3}>{student.name}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-bold p-2 border-r border-gray-300">Class & Section</td>
                <td className="p-2 border-r border-gray-300">Year {student.year} - Section {student.section}</td>
                <td className="bg-gray-50 font-bold p-2 border-r border-gray-300">Current Semester</td>
                <td className="p-2">Semester {student.current_semester || 1}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-bold p-2 border-r border-gray-300">Gender / Blood Group</td>
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

          {/* Student Photo Box */}
          <div className="w-28 h-36 border border-gray-400 bg-gray-50 rounded flex flex-col items-center justify-center p-1 shrink-0 self-center sm:self-start">
            {student.photo_path ? (
              <img src={student.photo_path} alt="Photo" className="w-full h-full object-cover" />
            ) : (
              <div className="text-[10px] text-gray-400 text-center">Affix Passport Photo</div>
            )}
          </div>
        </div>

        {/* Section 1: Contact Details */}
        <div className="mb-5">
          <h4 className="text-xs font-bold uppercase bg-gray-100 p-1.5 border border-gray-300 mb-1 text-gov-navy">
            1. Contact & Residential Details
          </h4>
          <table className="w-full text-xs border border-gray-300 border-collapse">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-semibold p-1.5 w-1/4 border-r border-gray-300">Student Mobile</td>
                <td className="p-1.5 w-1/4 border-r border-gray-300">{student.mobile || '-'}</td>
                <td className="bg-gray-50 font-semibold p-1.5 w-1/4 border-r border-gray-300">Alternate Mobile</td>
                <td className="p-1.5 w-1/4">{student.alt_mobile || '-'}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-semibold p-1.5 border-r border-gray-300">Email Address</td>
                <td className="p-1.5 border-r border-gray-300" colSpan={3}>{student.email || '-'}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-semibold p-1.5 border-r border-gray-300">Permanent Address</td>
                <td className="p-1.5 border-r border-gray-300" colSpan={3}>
                  {student.permanent_address || '-'}, District: {student.district || '-'}, Pincode: {student.pincode || '-'}
                </td>
              </tr>
              <tr>
                <td className="bg-gray-50 font-semibold p-1.5 border-r border-gray-300">Communication Address</td>
                <td className="p-1.5 border-r border-gray-300" colSpan={3}>
                  {student.communication_address || student.permanent_address || '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Family Particulars */}
        <div className="mb-5">
          <h4 className="text-xs font-bold uppercase bg-gray-100 p-1.5 border border-gray-300 mb-1 text-gov-navy">
            2. Family & Income Particulars
          </h4>
          <table className="w-full text-xs border border-gray-300 border-collapse">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-semibold p-1.5 w-1/4 border-r border-gray-300">Father's Name</td>
                <td className="p-1.5 w-1/4 border-r border-gray-300">{student.father_name || '-'}</td>
                <td className="bg-gray-50 font-semibold p-1.5 w-1/4 border-r border-gray-300">Mother's Name</td>
                <td className="p-1.5 w-1/4">{student.mother_name || '-'}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-semibold p-1.5 border-r border-gray-300">Parents Occupation</td>
                <td className="p-1.5 border-r border-gray-300">{student.parents_occupation || '-'}</td>
                <td className="bg-gray-50 font-semibold p-1.5 border-r border-gray-300">Parents Mobile</td>
                <td className="p-1.5">{student.parents_mobile || '-'}</td>
              </tr>
              <tr>
                <td className="bg-gray-50 font-semibold p-1.5 border-r border-gray-300">Annual Family Income</td>
                <td className="p-1.5 border-r border-gray-300 font-semibold" colSpan={3}>
                  ₹ {student.annual_income ? Number(student.annual_income).toLocaleString('en-IN') : '0.00'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Academic Record */}
        <div className="mb-5">
          <h4 className="text-xs font-bold uppercase bg-gray-100 p-1.5 border border-gray-300 mb-1 text-gov-navy">
            3. Qualifying Examination Records
          </h4>
          <table className="w-full text-xs border border-gray-300 border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300 text-left">
                <th className="p-1.5 border-r border-gray-300">Course / Standard</th>
                <th className="p-1.5 border-r border-gray-300">Institution Name</th>
                <th className="p-1.5 border-r border-gray-300">Board</th>
                <th className="p-1.5 border-r border-gray-300">Year</th>
                <th className="p-1.5">Percentage (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="p-1.5 font-semibold border-r border-gray-300">SSLC (10th)</td>
                <td className="p-1.5 border-r border-gray-300">{student.sslc_school || '-'}</td>
                <td className="p-1.5 border-r border-gray-300">{student.sslc_board || '-'}</td>
                <td className="p-1.5 border-r border-gray-300">{student.sslc_year || '-'}</td>
                <td className="p-1.5 font-bold">{student.sslc_percentage ? `${student.sslc_percentage}%` : '-'}</td>
              </tr>
              <tr>
                <td className="p-1.5 font-semibold border-r border-gray-300">HSC (12th) / Diploma</td>
                <td className="p-1.5 border-r border-gray-300">{student.hsc_school || '-'}</td>
                <td className="p-1.5 border-r border-gray-300">{student.hsc_board || '-'}</td>
                <td className="p-1.5 border-r border-gray-300">{student.hsc_year || '-'}</td>
                <td className="p-1.5 font-bold">{student.hsc_percentage ? `${student.hsc_percentage}%` : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 4: Scholarship & Bank Details */}
        <div className="mb-5">
          <h4 className="text-xs font-bold uppercase bg-gray-100 p-1.5 border border-gray-300 mb-1 text-gov-navy">
            4. Statutory Concessions, Scholarship & Bank Details
          </h4>
          <table className="w-full text-xs border border-gray-300 border-collapse">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-semibold p-1.5 w-1/4 border-r border-gray-300">First Graduate Concession</td>
                <td className="p-1.5 w-1/4 border-r border-gray-300 font-bold">{student.is_first_graduate ? 'YES' : 'NO'}</td>
                <td className="bg-gray-50 font-semibold p-1.5 w-1/4 border-r border-gray-300">PMS Beneficiary</td>
                <td className="p-1.5 w-1/4 font-bold">{student.is_pms ? `YES (${student.pms_status || 'Applied'})` : 'NO'}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-50 font-semibold p-1.5 border-r border-gray-300">Bank Name & Branch</td>
                <td className="p-1.5 border-r border-gray-300">{student.bank_name || '-'} ({student.bank_branch || '-'})</td>
                <td className="bg-gray-50 font-semibold p-1.5 border-r border-gray-300">IFSC Code</td>
                <td className="p-1.5 font-mono">{student.bank_ifsc || '-'}</td>
              </tr>
              <tr>
                <td className="bg-gray-50 font-semibold p-1.5 border-r border-gray-300">Account Holder Name</td>
                <td className="p-1.5 border-r border-gray-300">{student.bank_acc_holder || '-'}</td>
                <td className="bg-gray-50 font-semibold p-1.5 border-r border-gray-300">Account Number</td>
                <td className="p-1.5 font-mono">{student.bank_acc_no ? `XXXXXX${student.bank_acc_no.slice(-4)}` : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 5: Uploaded Documents Verification Status */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase bg-gray-100 p-1.5 border border-gray-300 mb-1 text-gov-navy">
            5. Attached Supporting Credentials
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {['photo', 'aadhaar', 'community_cert', 'income_cert', 'first_graduate_cert', 'bank_passbook', 'sslc_marksheet', 'hsc_marksheet'].map((type) => {
              const doc = student.documents?.find((d) => d.doc_type === type);
              return (
                <div key={type} className="border border-gray-200 p-1.5 rounded flex items-center justify-between">
                  <span className="capitalize text-gray-700 text-[11px] font-medium">{type.replace('_', ' ')}:</span>
                  {doc ? (
                    <span className="text-green-700 font-bold text-[10px]">Verified/Uploaded</span>
                  ) : (
                    <span className="text-gray-400 text-[10px]">Not Uploaded</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Signatures & Declarations */}
        <div className="mt-8 pt-6 border-t border-gray-400 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="h-10"></div>
            <div className="border-t border-gray-500 pt-1 font-semibold">
              Signature of the Student
            </div>
            <div className="text-[10px] text-gray-500">
              Date: {student.submission_date ? new Date(student.submission_date).toLocaleDateString('en-GB') : '____/____/2026'}
            </div>
          </div>

          <div>
            <div className="h-10"></div>
            <div className="border-t border-gray-500 pt-1 font-semibold">
              Department Verification In-Charge
            </div>
            <div className="text-[10px] text-gray-500">Class Advisor / Tutor</div>
          </div>

          <div>
            <div className="h-10"></div>
            <div className="border-t border-gray-500 pt-1 font-semibold">
              Head of the Department
            </div>
            <div className="text-[10px] text-gray-500">Dept of AI & DS (Seal)</div>
          </div>
        </div>

      </div>
    </div>
  );
};
