import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ProgressBar } from '../../components/ProgressBar';
import { DocumentUploadField } from '../../components/DocumentUploadField';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  Save, 
  ChevronRight, 
  ChevronLeft, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  Printer, 
  Lock,
  ArrowLeft,
  ArrowUp,
  X,
  ShieldAlert
} from 'lucide-react';

export const MultiStepForm = ({ studentId = null, onBack, onComplete }) => {
  const { user, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Student form state
  const [formData, setFormData] = useState({
    // Step 1: Personal
    name: '',
    registerNo: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    religion: '',
    community: '',
    caste: '',
    nationality: 'Indian',
    aadhaarNo: '',
    motherTongue: 'Tamil',
    photoPath: '',

    // Step 2: Contact
    mobile: '',
    altMobile: '',
    email: '',
    permanentAddress: '',
    communicationAddress: '',
    isSameAddress: false,
    district: '',
    state: 'Tamil Nadu',
    pincode: '',

    // Step 3: Family
    fatherName: '',
    motherName: '',
    guardianName: '',
    parentsOccupation: '',
    parentsMobile: '',
    annualIncome: '',

    // Step 4: Academic
    year: 1,
    section: 'A',
    currentSemester: 1,
    sslcSchool: '',
    sslcBoard: 'State Board',
    sslcYear: '',
    sslcPercentage: '',
    hscSchool: '',
    hscBoard: 'State Board',
    hscYear: '',
    hscPercentage: '',
    modeOfAdmission: 'Government Quota',

    // Step 5: Scholarship
    isFirstGraduate: false,
    isPms: false,
    pmsApplicationNo: '',
    pmsStatus: 'Applied',
    otherScholarshipName: '',
    otherScholarshipAmount: '',
    otherScholarshipStatus: '',
    communityCertNo: '',
    communityCertIssuer: '',
    communityCertDate: '',
    incomeCertNo: '',
    incomeCertIssuer: '',
    incomeCertDate: '',

    // Step 6: Bank
    bankAccHolder: '',
    bankName: '',
    bankAccNo: '',
    bankIfsc: '',
    bankBranch: '',

    // Status
    status: 'DRAFT',
    isLocked: false,
    declarationAccepted: false,
    documents: []
  });

  // Load student profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentProfile(studentId);
      if (res.success && res.student) {
        const s = res.student;
        setFormData((prev) => ({
          ...prev,
          name: s.name || '',
          registerNo: s.register_no || '',
          dob: s.dob || '',
          year: s.year || 1,
          section: s.section || 'A',
          gender: s.gender || '',
          bloodGroup: s.blood_group || '',
          religion: s.religion || '',
          community: s.community || '',
          caste: s.caste || '',
          nationality: s.nationality || 'Indian',
          aadhaarNo: s.aadhaar_no || '',
          motherTongue: s.mother_tongue || 'Tamil',
          photoPath: s.photo_path || '',

          mobile: s.mobile || '',
          altMobile: s.alt_mobile || '',
          email: s.email || '',
          permanentAddress: s.permanent_address || '',
          communicationAddress: s.communication_address || '',
          isSameAddress: Boolean(s.is_same_address),
          district: s.district || '',
          state: s.state || 'Tamil Nadu',
          pincode: s.pincode || '',

          fatherName: s.father_name || '',
          motherName: s.mother_name || '',
          guardianName: s.guardian_name || '',
          parentsOccupation: s.parents_occupation || '',
          parentsMobile: s.parents_mobile || '',
          annualIncome: s.annual_income !== null && s.annual_income !== undefined ? s.annual_income : '',

          sslcSchool: s.sslc_school || '',
          sslcBoard: s.sslc_board || 'State Board',
          sslcYear: s.sslc_year || '',
          sslcPercentage: s.sslc_percentage || '',
          hscSchool: s.hsc_school || '',
          hscBoard: s.hsc_board || 'State Board',
          hscYear: s.hsc_year || '',
          hscPercentage: s.hsc_percentage || '',
          currentSemester: s.current_semester || 1,
          modeOfAdmission: s.mode_of_admission || 'Government Quota',

          isFirstGraduate: Boolean(s.is_first_graduate),
          isPms: Boolean(s.is_pms),
          pmsApplicationNo: s.pms_application_no || '',
          pmsStatus: s.pms_status || 'Applied',
          otherScholarshipName: s.other_scholarship_name || '',
          otherScholarshipAmount: s.other_scholarship_amount || '',
          otherScholarshipStatus: s.other_scholarship_status || '',
          communityCertNo: s.community_cert_no || '',
          communityCertIssuer: s.community_cert_issuer || '',
          communityCertDate: s.community_cert_date ? s.community_cert_date.split('T')[0] : '',
          incomeCertNo: s.income_cert_no || '',
          incomeCertIssuer: s.income_cert_issuer || '',
          incomeCertDate: s.income_cert_date ? s.income_cert_date.split('T')[0] : '',

          bankAccHolder: s.bank_acc_holder || '',
          bankName: s.bank_name || '',
          bankAccNo: s.bank_acc_no || '',
          bankIfsc: s.bank_ifsc || '',
          bankBranch: s.bank_branch || '',

          status: s.status || 'DRAFT',
          isLocked: Boolean(s.is_locked),
          declarationAccepted: Boolean(s.declaration_accepted),
          documents: s.documents || []
        }));
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load student data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [studentId]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: val };
      if (name === 'isSameAddress' && checked) {
        updated.communicationAddress = prev.permanentAddress;
      }
      return updated;
    });

    // Clear inline error when student modifies the field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  /**
   * STRICT VALIDATION OF ALL MANDATORY (*) FIELDS FOR EACH STEP
   * Blocks student from proceeding if any mandatory field is missing or malformed.
   */
  const validateStep = (step) => {
    const errs = {};

    // STEP 1: PERSONAL DETAILS
    if (step === 1) {
      if (!formData.name || !String(formData.name).trim()) {
        errs.name = 'Full Name is mandatory and cannot be empty.';
      }
      if (!formData.gender || !String(formData.gender).trim()) {
        errs.gender = 'Gender selection is mandatory.';
      }
      if (!formData.religion || !String(formData.religion).trim()) {
        errs.religion = 'Religion selection is mandatory.';
      }
      if (!formData.community || !String(formData.community).trim()) {
        errs.community = 'Community selection is mandatory.';
      }
      if (!formData.aadhaarNo || !String(formData.aadhaarNo).trim()) {
        errs.aadhaarNo = 'Aadhaar Number is mandatory.';
      } else if (!/^\d{12}$/.test(String(formData.aadhaarNo).trim())) {
        errs.aadhaarNo = 'Aadhaar Number must be exactly 12 digits.';
      }
    }

    // STEP 2: CONTACT DETAILS
    else if (step === 2) {
      if (!formData.mobile || !String(formData.mobile).trim()) {
        errs.mobile = 'Student Mobile number is mandatory.';
      } else if (!/^[6-9]\d{9}$/.test(String(formData.mobile).trim())) {
        errs.mobile = 'Mobile number must be exactly 10 digits starting with 6-9.';
      }

      if (formData.altMobile && String(formData.altMobile).trim()) {
        if (!/^[6-9]\d{9}$/.test(String(formData.altMobile).trim())) {
          errs.altMobile = 'Alternate mobile number must be exactly 10 digits starting with 6-9.';
        }
      }

      if (!formData.email || !String(formData.email).trim()) {
        errs.email = 'Email Address is mandatory.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(formData.email).trim())) {
        errs.email = 'Please provide a valid email address.';
      }

      if (!formData.permanentAddress || !String(formData.permanentAddress).trim()) {
        errs.permanentAddress = 'Permanent Address is mandatory.';
      }

      const effectiveCommAddress = formData.isSameAddress ? formData.permanentAddress : formData.communicationAddress;
      if (!effectiveCommAddress || !String(effectiveCommAddress).trim()) {
        errs.communicationAddress = 'Communication Address is mandatory (or tick "Same as Permanent").';
      }

      if (!formData.district || !String(formData.district).trim()) {
        errs.district = 'District is mandatory.';
      }

      if (!formData.pincode || !String(formData.pincode).trim()) {
        errs.pincode = 'Pincode is mandatory.';
      } else if (!/^[1-9]\d{5}$/.test(String(formData.pincode).trim())) {
        errs.pincode = 'Pincode must be exactly 6 digits.';
      }
    }

    // STEP 3: FAMILY DETAILS
    else if (step === 3) {
      if (!formData.fatherName || !String(formData.fatherName).trim()) {
        errs.fatherName = "Father's Name is mandatory.";
      }
      if (!formData.motherName || !String(formData.motherName).trim()) {
        errs.motherName = "Mother's Name is mandatory.";
      }
      if (!formData.parentsMobile || !String(formData.parentsMobile).trim()) {
        errs.parentsMobile = "Parents' Mobile number is mandatory.";
      } else if (!/^[6-9]\d{9}$/.test(String(formData.parentsMobile).trim())) {
        errs.parentsMobile = "Parents' Mobile must be exactly 10 digits starting with 6-9.";
      }
      if (formData.annualIncome === '' || formData.annualIncome === null || formData.annualIncome === undefined) {
        errs.annualIncome = 'Annual Family Income is mandatory.';
      } else if (isNaN(formData.annualIncome) || Number(formData.annualIncome) < 0) {
        errs.annualIncome = 'Please provide a valid annual family income.';
      }
    }

    // STEP 4: ACADEMIC DETAILS
    else if (step === 4) {
      if (!formData.sslcSchool || !String(formData.sslcSchool).trim()) {
        errs.sslcSchool = 'SSLC School Name is mandatory.';
      }
      if (!formData.sslcBoard || !String(formData.sslcBoard).trim()) {
        errs.sslcBoard = 'SSLC Board of Examination is mandatory.';
      }
      if (!formData.sslcYear) {
        errs.sslcYear = 'SSLC Year of Passing is mandatory.';
      }
      if (!formData.sslcPercentage || isNaN(formData.sslcPercentage)) {
        errs.sslcPercentage = 'SSLC Percentage is mandatory.';
      }
      if (!formData.hscSchool || !String(formData.hscSchool).trim()) {
        errs.hscSchool = 'HSC School / Polytechnic Name is mandatory.';
      }
      if (!formData.hscBoard || !String(formData.hscBoard).trim()) {
        errs.hscBoard = 'HSC Board of Examination is mandatory.';
      }
      if (!formData.hscYear) {
        errs.hscYear = 'HSC Year of Passing is mandatory.';
      }
      if (!formData.hscPercentage || isNaN(formData.hscPercentage)) {
        errs.hscPercentage = 'HSC Percentage is mandatory.';
      }
      if (!formData.modeOfAdmission || !String(formData.modeOfAdmission).trim()) {
        errs.modeOfAdmission = 'Mode of Admission is mandatory.';
      }
    }

    // STEP 5: SCHOLARSHIP DETAILS
    else if (step === 5) {
      if (formData.isPms && (!formData.pmsApplicationNo || !String(formData.pmsApplicationNo).trim())) {
        errs.pmsApplicationNo = 'PMS Application Number is mandatory for PMS beneficiaries.';
      }
    }

    // STEP 6: BANK DETAILS
    else if (step === 6) {
      if (!formData.bankAccHolder || !String(formData.bankAccHolder).trim()) {
        errs.bankAccHolder = 'Account Holder Name is mandatory.';
      }
      if (!formData.bankName || !String(formData.bankName).trim()) {
        errs.bankName = 'Bank Name is mandatory.';
      }
      if (!formData.bankAccNo || !String(formData.bankAccNo).trim()) {
        errs.bankAccNo = 'Bank Account Number is mandatory.';
      }
      if (!formData.bankIfsc || !String(formData.bankIfsc).trim()) {
        errs.bankIfsc = 'Bank IFSC Code is mandatory.';
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(formData.bankIfsc).trim().toUpperCase())) {
        errs.bankIfsc = 'Invalid IFSC format (e.g., SBIN0001234).';
      }
    }

    // STEP 7: DOCUMENTS UPLOAD
    else if (step === 7) {
      const docTypes = (formData.documents || []).map((d) => d.doc_type || d.docType);

      if (!docTypes.includes('photo')) {
        errs.photo = 'Passport photograph is mandatory. Please upload your photo.';
      }
      if (!docTypes.includes('aadhaar')) {
        errs.aadhaar = 'Aadhaar Card copy is mandatory. Please upload your Aadhaar document.';
      }
      if (formData.community && formData.community !== 'OC' && !docTypes.includes('community_cert')) {
        errs.community_cert = `Community Certificate is mandatory for ${formData.community} category.`;
      }
      if (!docTypes.includes('bank_passbook')) {
        errs.bank_passbook = 'Bank Passbook front page copy is mandatory.';
      }
      if (!docTypes.includes('sslc_marksheet')) {
        errs.sslc_marksheet = 'SSLC (10th) Marksheet copy is mandatory.';
      }
      if (!docTypes.includes('hsc_marksheet')) {
        errs.hsc_marksheet = 'HSC (12th) / Diploma Marksheet copy is mandatory.';
      }
      if (formData.isFirstGraduate && !docTypes.includes('first_graduate_cert')) {
        errs.first_graduate_cert = 'First Graduate Certificate is mandatory for First Graduate concession.';
      }
    }

    setErrors(errs);
    const isValid = Object.keys(errs).length === 0;

    if (!isValid) {
      setMessage({
        type: 'error',
        text: 'ACTION LOCKED: Please fill in all mandatory fields marked with (*) before you can save or proceed to the next step.'
      });
      // Automatically scroll to and highlight the first invalid input
      setTimeout(() => {
        const firstErrEl = document.querySelector('.border-red-500, input:invalid, select:invalid, textarea:invalid');
        if (firstErrEl) {
          firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof firstErrEl.focus === 'function') firstErrEl.focus();
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }

    return isValid;
  };

  /**
   * Real-time check if current step has all mandatory (*) fields filled
   */
  const checkCurrentStepComplete = () => {
    if (currentStep === 1) {
      return Boolean(
        formData.name && String(formData.name).trim() &&
        formData.gender && String(formData.gender).trim() &&
        formData.community && String(formData.community).trim() &&
        formData.aadhaarNo && /^\d{12}$/.test(String(formData.aadhaarNo).trim())
      );
    }
    if (currentStep === 2) {
      const commAddr = formData.isSameAddress ? formData.permanentAddress : formData.communicationAddress;
      return Boolean(
        formData.mobile && /^[6-9]\d{9}$/.test(String(formData.mobile).trim()) &&
        formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(formData.email).trim()) &&
        formData.permanentAddress && String(formData.permanentAddress).trim() &&
        commAddr && String(commAddr).trim() &&
        formData.district && String(formData.district).trim() &&
        formData.pincode && /^[1-9]\d{5}$/.test(String(formData.pincode).trim())
      );
    }
    if (currentStep === 3) {
      return Boolean(
        formData.fatherName && String(formData.fatherName).trim() &&
        formData.motherName && String(formData.motherName).trim() &&
        formData.parentsMobile && /^[6-9]\d{9}$/.test(String(formData.parentsMobile).trim()) &&
        formData.annualIncome !== '' &&
        formData.annualIncome !== null &&
        formData.annualIncome !== undefined &&
        !isNaN(formData.annualIncome) &&
        Number(formData.annualIncome) >= 0
      );
    }
    if (currentStep === 4) {
      return Boolean(
        formData.modeOfAdmission && String(formData.modeOfAdmission).trim() &&
        formData.sslcSchool && String(formData.sslcSchool).trim() &&
        formData.sslcBoard && String(formData.sslcBoard).trim() &&
        formData.sslcYear &&
        formData.sslcPercentage && !isNaN(formData.sslcPercentage) &&
        formData.hscSchool && String(formData.hscSchool).trim() &&
        formData.hscBoard && String(formData.hscBoard).trim() &&
        formData.hscYear &&
        formData.hscPercentage && !isNaN(formData.hscPercentage)
      );
    }
    if (currentStep === 5) {
      if (formData.isPms) {
        return Boolean(formData.pmsApplicationNo && String(formData.pmsApplicationNo).trim());
      }
      return true;
    }
    if (currentStep === 6) {
      return Boolean(
        formData.bankAccHolder && String(formData.bankAccHolder).trim() &&
        formData.bankName && String(formData.bankName).trim() &&
        formData.bankAccNo && String(formData.bankAccNo).trim() &&
        formData.bankIfsc && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(formData.bankIfsc).trim().toUpperCase())
      );
    }
    if (currentStep === 7) {
      const docTypes = (formData.documents || []).map((d) => d.doc_type || d.docType);
      const hasPhoto = docTypes.includes('photo');
      const hasAadhaar = docTypes.includes('aadhaar');
      const hasComm = formData.community === 'OC' || docTypes.includes('community_cert');
      const hasPassbook = docTypes.includes('bank_passbook');
      const hasSslc = docTypes.includes('sslc_marksheet');
      const hasHsc = docTypes.includes('hsc_marksheet');
      const hasFg = !formData.isFirstGraduate || docTypes.includes('first_graduate_cert');
      return Boolean(hasPhoto && hasAadhaar && hasComm && hasPassbook && hasSslc && hasHsc && hasFg);
    }
    if (currentStep === 8) {
      return Boolean(formData.declarationAccepted);
    }
    return true;
  };

  const isCurrentStepComplete = checkCurrentStepComplete();

  // Save current step data as draft - LOCKED until mandatory fields are filled
  const handleSaveDraft = async () => {
    const isValid = validateStep(currentStep);
    if (!isValid) {
      setMessage({
        type: 'error',
        text: 'ACTION LOCKED: Please fill in all mandatory fields marked with (*) before you can Save Draft.'
      });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      await api.updateStudentProfile(formData, studentId);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setMessage({ type: 'success', text: `Step ${currentStep} details saved as draft successfully.` });
      refreshUser && refreshUser();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save details.' });
    } finally {
      setSaving(false);
    }
  };

  // Save and Exit - LOCKED until mandatory fields are filled
  const handleSaveAndExit = async () => {
    const isValid = validateStep(currentStep);
    if (!isValid) {
      setMessage({
        type: 'error',
        text: 'ACTION LOCKED: Please fill in all mandatory fields marked with (*) before you can Save and Exit.'
      });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      await api.updateStudentProfile(formData, studentId);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setMessage({ type: 'success', text: 'Details saved successfully. Returning...' });
      refreshUser && refreshUser();
      if (onBack) {
        onBack();
      } else if (onComplete) {
        onComplete();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save details.' });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Save & Continue: Locked until all * fields pass validation
   */
  const handleNext = async () => {
    // 1. Strict validation check
    const isValid = validateStep(currentStep);
    if (!isValid) {
      setMessage({
        type: 'error',
        text: 'ACTION LOCKED: Please fill in all mandatory fields marked with (*) before you can proceed to the next step.'
      });
      return; // STOP! User cannot proceed.
    }

    // 2. Auto-save valid step and advance
    try {
      setSaving(true);
      await api.updateStudentProfile(formData, studentId);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentStep((prev) => Math.min(8, prev + 1));
      setMessage({ type: '', text: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to auto-save.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    setMessage({ type: '', text: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepSelect = (targetStep) => {
    if (targetStep > currentStep) {
      // Must validate current step before allowing to jump forward
      const isValid = validateStep(currentStep);
      if (!isValid) {
        setMessage({
          type: 'error',
          text: `ACTION LOCKED: Step ${currentStep} has missing mandatory details (*). Complete them before navigating.`
        });
        return;
      }
    }
    setCurrentStep(targetStep);
    setMessage({ type: '', text: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 8 Final Submission Prompt
  const handleSubmit = (e) => {
    e && e.preventDefault();
    if (!formData.declarationAccepted) {
      setErrors((prev) => ({ ...prev, declarationAccepted: 'You must check the declaration checkbox to submit.' }));
      setMessage({ type: 'error', text: 'You must check the declaration box before final submission.' });
      return;
    }

    // Final check across all mandatory steps
    for (let step = 1; step <= 7; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        setMessage({
          type: 'error',
          text: `Submission Blocked: Step ${step} has incomplete mandatory details (*). Please complete them first.`
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Open confirmation modal
    setShowConfirmSubmit(true);
  };

  const executeFinalSubmit = async () => {
    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });
      await api.updateStudentProfile(formData, studentId);
      const res = await api.submitStudentProfile(true, studentId);
      setShowConfirmSubmit(false);
      setMessage({ type: 'success', text: res.message || 'Profile submitted successfully and locked for verification.' });
      setFormData((prev) => ({ ...prev, status: 'SUBMITTED', is_locked: 1 }));
      refreshUser && refreshUser();
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1500);
    } catch (err) {
      setShowConfirmSubmit(false);
      setMessage({ type: 'error', text: err.message || 'Submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Document upload callbacks
  const handleDocUploaded = (docType, doc) => {
    setFormData((prev) => {
      const existing = prev.documents.filter((d) => d.doc_type !== docType && d.docType !== docType);
      return {
        ...prev,
        photoPath: docType === 'photo' ? doc.filePath : prev.photoPath,
        documents: [...existing, doc]
      };
    });
    if (errors[docType]) {
      setErrors((prev) => ({ ...prev, [docType]: null }));
    }
  };

  const handleDocDeleted = (docType, docId) => {
    setFormData((prev) => ({
      ...prev,
      photoPath: docType === 'photo' ? '' : prev.photoPath,
      documents: prev.documents.filter((d) => d.id !== docId)
    }));
  };

  const getDoc = (type) => formData.documents.find((d) => (d.doc_type || d.docType) === type);

  if (loading) {
    return (
      <div className="bg-white border border-gov-border rounded p-8 text-center text-gray-500">
        Loading student record details...
      </div>
    );
  }

  const isLocked = formData.isLocked && user?.role !== 'ADMIN';

  // Helper for input border and error state styling
  const getInputClass = (fieldName, extra = '') => {
    return `w-full px-3 py-1.5 border rounded text-sm focus:outline-none disabled:bg-gray-100 ${
      errors[fieldName]
        ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-1 focus:ring-red-500'
        : 'border-gray-300 focus:border-gov-navy'
    } ${extra}`;
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      
      {/* Top Banner & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gov-border gap-2">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
              title="Return"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gov-navy tracking-tight">
              Student Details Form
            </h1>
            <p className="text-xs text-gov-subtle flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Register No: <span className="font-semibold text-gray-800">{formData.registerNo}</span></span>
              <span>| Year: <span className="font-semibold text-gray-800">{formData.year}</span></span>
              <span>| Section: <span className="font-semibold text-gray-800">{formData.section}</span></span>
              {lastSavedTime && (
                <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                  <CheckCircle className="w-3 h-3 mr-1" /> Last saved {lastSavedTime}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <StatusBadge status={formData.status} isLocked={formData.isLocked} />
          {formData.status === 'SUBMITTED' && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center px-2.5 py-1 text-xs border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 font-medium"
            >
              <Printer className="w-3.5 h-3.5 mr-1" /> Print Summary
            </button>
          )}
        </div>
      </div>

      {/* Lock Notice */}
      {isLocked && (
        <div className="mb-4 p-3 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-slate-600 shrink-0" />
          <span>
            <strong>Record Locked:</strong> This profile has been verified and locked by the department administrator. Form editing is disabled.
          </span>
        </div>
      )}

      {/* Feedback Alert Messages */}
      {message.text && (
        <div className={`mb-4 p-3.5 rounded text-xs flex items-center space-x-2.5 border font-medium ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-300' 
            : 'bg-red-50 text-red-800 border-red-300 shadow-sm'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Step Progress Bar with Locks */}
      <ProgressBar currentStep={currentStep} onSelectStep={handleStepSelect} />

      {/* Form Container */}
      <div className="bg-white border border-gov-border rounded p-6 shadow-sm">
        
        {/* STEP 1: PERSONAL DETAILS */}
        {currentStep === 1 && (
          <div>
            <div className="border-b border-gov-border pb-2.5 mb-4">
              <h2 className="text-base font-bold text-gov-navy uppercase tracking-wide">
                Step 1: Personal Details
              </h2>
              <p className="text-xs text-gov-subtle">
                Fields marked with <span className="text-red-600 font-bold">*</span> are mandatory and must be entered to advance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name (as per HSC / 10th Marks Sheet) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLocked}
                  className={getInputClass('name')}
                  placeholder="Enter full name"
                  required
                />
                {errors.name && <p className="text-xs text-red-600 mt-1 font-medium">{errors.name}</p>}
              </div>

              {/* Register Number (Read Only) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Register Number (Read-Only)
                </label>
                <input
                  type="text"
                  name="registerNo"
                  value={formData.registerNo}
                  readOnly
                  className="w-full px-3 py-1.5 border border-gray-200 bg-gray-100 rounded text-sm font-medium text-gray-700 cursor-not-allowed"
                />
              </div>

              {/* Date of Birth (Read Only) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date of Birth (Read-Only)
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  readOnly
                  className="w-full px-3 py-1.5 border border-gray-200 bg-gray-100 rounded text-sm font-medium text-gray-700 cursor-not-allowed"
                />
                <span className="text-[11px] text-gray-500">For DOB corrections, contact department admin.</span>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Gender <span className="text-red-600">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={isLocked}
                  className={getInputClass('gender')}
                >
                  <option value="">-- Select Gender --</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="text-xs text-red-600 mt-1 font-medium">{errors.gender}</p>}
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Blood Group
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  disabled={isLocked}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none disabled:bg-gray-100"
                >
                  <option value="">-- Select Blood Group --</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              {/* Religion */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Religion <span className="text-red-600">*</span>
                </label>
                <select
                  name="religion"
                  value={formData.religion}
                  onChange={handleChange}
                  disabled={isLocked}
                  className={getInputClass('religion')}
                >
                  <option value="">-- Select Religion --</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Christian">Christian</option>
                  <option value="Jain">Jain</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Other">Other</option>
                </select>
                {errors.religion && <p className="text-xs text-red-600 mt-1 font-medium">{errors.religion}</p>}
              </div>

              {/* Community */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Community <span className="text-red-600">*</span>
                </label>
                <select
                  name="community"
                  value={formData.community}
                  onChange={handleChange}
                  disabled={isLocked}
                  className={getInputClass('community')}
                >
                  <option value="">-- Select Community --</option>
                  <option value="OC">OC (Open Competition)</option>
                  <option value="BC">BC (Backward Class)</option>
                  <option value="BCM">BCM (BC Muslim)</option>
                  <option value="MBC">MBC (Most Backward Class)</option>
                  <option value="DNC">DNC (Denotified Communities)</option>
                  <option value="SC">SC (Scheduled Caste)</option>
                  <option value="SCA">SCA (SC Arunthathiyar)</option>
                  <option value="ST">ST (Scheduled Tribe)</option>
                </select>
                {errors.community && <p className="text-xs text-red-600 mt-1 font-medium">{errors.community}</p>}
              </div>

              {/* Caste */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Caste / Sub-Caste
                </label>
                <input
                  type="text"
                  name="caste"
                  value={formData.caste}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="e.g. Kongu Vellalar, Vanniyar, Adi Dravidar"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none disabled:bg-gray-100"
                />
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nationality
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  disabled={isLocked}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none disabled:bg-gray-100"
                />
              </div>

              {/* Aadhaar Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Aadhaar Number (12 Digits) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="aadhaarNo"
                  maxLength={12}
                  value={formData.aadhaarNo}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="12 digit Aadhaar number"
                  className={getInputClass('aadhaarNo')}
                />
                {errors.aadhaarNo && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{errors.aadhaarNo}</p>
                )}
              </div>

              {/* Mother Tongue */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mother Tongue
                </label>
                <input
                  type="text"
                  name="motherTongue"
                  value={formData.motherTongue}
                  onChange={handleChange}
                  disabled={isLocked}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                Student Passport Photo Upload
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-28 border border-gray-300 bg-gray-50 rounded flex items-center justify-center overflow-hidden shrink-0">
                  {formData.photoPath ? (
                    <img 
                      src={formData.photoPath} 
                      alt="Student" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-[11px] text-gray-400 text-center px-1">No Photo</span>
                  )}
                </div>
                <div className="flex-1 w-full">
                  <DocumentUploadField
                    label="Passport Size Photograph"
                    docType="photo"
                    helperText="JPG or PNG up to 2MB (Formal passport photograph)"
                    currentDoc={getDoc('photo')}
                    onUploadSuccess={handleDocUploaded}
                    onDeleteSuccess={handleDocDeleted}
                    disabled={isLocked}
                    studentId={studentId}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CONTACT DETAILS */}
        {currentStep === 2 && (
          <div>
            <div className="border-b border-gov-border pb-2.5 mb-4">
              <h2 className="text-base font-bold text-gov-navy uppercase tracking-wide">
                Step 2: Contact Details
              </h2>
              <p className="text-xs text-gov-subtle">
                Provide student mobile, communication and permanent residential address.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Student Mobile */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Student Mobile (10 Digits) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="mobile"
                  maxLength={10}
                  value={formData.mobile}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="e.g. 9876543210"
                  className={getInputClass('mobile')}
                />
                {errors.mobile && <p className="text-xs text-red-600 mt-1 font-medium">{errors.mobile}</p>}
              </div>

              {/* Alternate Mobile */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Alternate Mobile Number
                </label>
                <input
                  type="text"
                  name="altMobile"
                  maxLength={10}
                  value={formData.altMobile}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="e.g. 9845123456"
                  className={getInputClass('altMobile')}
                />
                {errors.altMobile && <p className="text-xs text-red-600 mt-1 font-medium">{errors.altMobile}</p>}
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="student.name@student.college.edu"
                  className={getInputClass('email')}
                />
                {errors.email && <p className="text-xs text-red-600 mt-1 font-medium">{errors.email}</p>}
              </div>

              {/* Permanent Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Permanent Address <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="permanentAddress"
                  rows={3}
                  value={formData.permanentAddress}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="Door No, Street Name, Village/Town"
                  className={getInputClass('permanentAddress')}
                />
                {errors.permanentAddress && <p className="text-xs text-red-600 mt-1 font-medium">{errors.permanentAddress}</p>}
              </div>

              {/* Same as Permanent Checkbox */}
              <div className="md:col-span-2 flex items-center">
                <input
                  type="checkbox"
                  id="isSameAddress"
                  name="isSameAddress"
                  checked={formData.isSameAddress}
                  onChange={handleChange}
                  disabled={isLocked}
                  className="h-4 w-4 text-gov-navy border-gray-300 rounded"
                />
                <label htmlFor="isSameAddress" className="ml-2 text-xs font-medium text-gray-700">
                  Communication address is same as Permanent Address
                </label>
              </div>

              {/* Communication Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Communication / Present Address <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="communicationAddress"
                  rows={3}
                  value={formData.isSameAddress ? formData.permanentAddress : formData.communicationAddress}
                  onChange={handleChange}
                  disabled={isLocked || formData.isSameAddress}
                  placeholder="Hostel Room / Rental Address / Local Guardian Address"
                  className={getInputClass('communicationAddress')}
                />
                {errors.communicationAddress && <p className="text-xs text-red-600 mt-1 font-medium">{errors.communicationAddress}</p>}
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  District <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="e.g. Erode, Salem, Coimbatore, Chennai"
                  className={getInputClass('district')}
                />
                {errors.district && <p className="text-xs text-red-600 mt-1 font-medium">{errors.district}</p>}
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={isLocked}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none disabled:bg-gray-100"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pincode (6 Digits) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="e.g. 638052"
                  className={getInputClass('pincode')}
                />
                {errors.pincode && <p className="text-xs text-red-600 mt-1 font-medium">{errors.pincode}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: FAMILY DETAILS */}
        {currentStep === 3 && (
          <div>
            <div className="border-b border-gov-border pb-2.5 mb-4">
              <h2 className="text-base font-bold text-gov-navy uppercase tracking-wide">
                Step 3: Family Details
              </h2>
              <p className="text-xs text-gov-subtle">
                Parentage, occupation, contact and annual family income particulars.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Father Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Father's Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  disabled={isLocked}
                  className={getInputClass('fatherName')}
                  placeholder="Enter father's name"
                />
                {errors.fatherName && <p className="text-xs text-red-600 mt-1 font-medium">{errors.fatherName}</p>}
              </div>

              {/* Mother Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mother's Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  disabled={isLocked}
                  className={getInputClass('motherName')}
                  placeholder="Enter mother's name"
                />
                {errors.motherName && <p className="text-xs text-red-600 mt-1 font-medium">{errors.motherName}</p>}
              </div>

              {/* Guardian Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Guardian's Name (if applicable)
                </label>
                <input
                  type="text"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleChange}
                  disabled={isLocked}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none disabled:bg-gray-100"
                />
              </div>

              {/* Parents Occupation */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Parents' / Guardian's Occupation
                </label>
                <input
                  type="text"
                  name="parentsOccupation"
                  value={formData.parentsOccupation}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="e.g. Agriculture, Business, Teacher, Private Service"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none disabled:bg-gray-100"
                />
              </div>

              {/* Parents Mobile */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Parents' Mobile Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="parentsMobile"
                  maxLength={10}
                  value={formData.parentsMobile}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="e.g. 9443322110"
                  className={getInputClass('parentsMobile')}
                />
                {errors.parentsMobile && <p className="text-xs text-red-600 mt-1 font-medium">{errors.parentsMobile}</p>}
              </div>

              {/* Annual Income */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Annual Family Income (INR ₹) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  step="1000"
                  name="annualIncome"
                  value={formData.annualIncome}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="e.g. 120000"
                  className={getInputClass('annualIncome')}
                />
                {errors.annualIncome && <p className="text-xs text-red-600 mt-1 font-medium">{errors.annualIncome}</p>}
                <span className="text-[11px] text-gray-500">As declared in the Revenue Income Certificate.</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: ACADEMIC DETAILS */}
        {currentStep === 4 && (
          <div>
            <div className="border-b border-gov-border pb-2.5 mb-4">
              <h2 className="text-base font-bold text-gov-navy uppercase tracking-wide">
                Step 4: Academic Details
              </h2>
              <p className="text-xs text-gov-subtle">
                Secondary school (SSLC), Higher secondary (HSC/Diploma), and current departmental standing.
              </p>
            </div>

            {/* Current Standing */}
            <div className="bg-gray-50 border border-gray-200 rounded p-3.5 mb-4">
              <h3 className="text-xs font-bold text-gov-navy uppercase tracking-wide mb-2.5">
                Current Program Enrollment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Current Year</label>
                  <input
                    type="text"
                    value={`Year ${formData.year}`}
                    readOnly
                    className="w-full px-2.5 py-1 border border-gray-200 bg-white rounded text-xs text-gray-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Section</label>
                  <input
                    type="text"
                    value={`Section ${formData.section}`}
                    readOnly
                    className="w-full px-2.5 py-1 border border-gray-200 bg-white rounded text-xs text-gray-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Current Semester</label>
                  <select
                    name="currentSemester"
                    value={formData.currentSemester}
                    onChange={handleChange}
                    disabled={isLocked}
                    className="w-full px-2.5 py-1 border border-gray-300 rounded text-xs focus:border-gov-navy focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Mode of Admission <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="modeOfAdmission"
                    value={formData.modeOfAdmission}
                    onChange={handleChange}
                    disabled={isLocked}
                    className={getInputClass('modeOfAdmission', 'py-1')}
                  >
                    <option value="Government Quota">Government Quota (TNEA)</option>
                    <option value="Management Quota">Management Quota</option>
                    <option value="Lateral Entry">Lateral Entry</option>
                    <option value="7.5% Govt School Quota">7.5% Govt School Quota</option>
                  </select>
                  {errors.modeOfAdmission && <p className="text-xs text-red-600 mt-1 font-medium">{errors.modeOfAdmission}</p>}
                </div>
              </div>
            </div>

            {/* SSLC (10th) */}
            <div className="border border-gray-200 rounded p-3.5 mb-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2.5">
                SSLC (10th Standard) Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    School Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="sslcSchool"
                    value={formData.sslcSchool}
                    onChange={handleChange}
                    disabled={isLocked}
                    className={getInputClass('sslcSchool')}
                    placeholder="Enter SSLC school name"
                  />
                  {errors.sslcSchool && <p className="text-xs text-red-600 mt-1 font-medium">{errors.sslcSchool}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Board of Examination <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="sslcBoard"
                    value={formData.sslcBoard}
                    onChange={handleChange}
                    disabled={isLocked}
                    className={getInputClass('sslcBoard')}
                  >
                    <option value="State Board">Tamil Nadu State Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.sslcBoard && <p className="text-xs text-red-600 mt-1 font-medium">{errors.sslcBoard}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Year of Passing <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="sslcYear"
                    value={formData.sslcYear}
                    onChange={handleChange}
                    disabled={isLocked}
                    placeholder="e.g. 2020"
                    className={getInputClass('sslcYear')}
                  />
                  {errors.sslcYear && <p className="text-xs text-red-600 mt-1 font-medium">{errors.sslcYear}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Marks / Percentage (%) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="sslcPercentage"
                    value={formData.sslcPercentage}
                    onChange={handleChange}
                    disabled={isLocked}
                    placeholder="e.g. 92.40"
                    className={getInputClass('sslcPercentage')}
                  />
                  {errors.sslcPercentage && <p className="text-xs text-red-600 mt-1 font-medium">{errors.sslcPercentage}</p>}
                </div>
              </div>
            </div>

            {/* HSC (12th / Diploma) */}
            <div className="border border-gray-200 rounded p-3.5">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2.5">
                HSC (12th Standard) / Diploma Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    School / Polytechnic Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="hscSchool"
                    value={formData.hscSchool}
                    onChange={handleChange}
                    disabled={isLocked}
                    className={getInputClass('hscSchool')}
                    placeholder="Enter HSC school/polytechnic name"
                  />
                  {errors.hscSchool && <p className="text-xs text-red-600 mt-1 font-medium">{errors.hscSchool}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Board of Examination <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="hscBoard"
                    value={formData.hscBoard}
                    onChange={handleChange}
                    disabled={isLocked}
                    className={getInputClass('hscBoard')}
                  >
                    <option value="State Board">Tamil Nadu State Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ISC</option>
                    <option value="DOTE">DOTE (Diploma)</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.hscBoard && <p className="text-xs text-red-600 mt-1 font-medium">{errors.hscBoard}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Year of Passing <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="hscYear"
                    value={formData.hscYear}
                    onChange={handleChange}
                    disabled={isLocked}
                    placeholder="e.g. 2022"
                    className={getInputClass('hscYear')}
                  />
                  {errors.hscYear && <p className="text-xs text-red-600 mt-1 font-medium">{errors.hscYear}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Marks / Percentage (%) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="hscPercentage"
                    value={formData.hscPercentage}
                    onChange={handleChange}
                    disabled={isLocked}
                    placeholder="e.g. 89.50"
                    className={getInputClass('hscPercentage')}
                  />
                  {errors.hscPercentage && <p className="text-xs text-red-600 mt-1 font-medium">{errors.hscPercentage}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: SCHOLARSHIP AND CATEGORY DETAILS */}
        {currentStep === 5 && (
          <div>
            <div className="border-b border-gov-border pb-2.5 mb-4">
              <h2 className="text-base font-bold text-gov-navy uppercase tracking-wide">
                Step 5: Scholarship and Category Details
              </h2>
              <p className="text-xs text-gov-subtle">
                First Graduate, Post Matric Scholarship (PMS), Community and Income certificate credentials.
              </p>
            </div>

            <div className="space-y-4">
              {/* First Graduate */}
              <div className="border border-gray-200 rounded p-3.5 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-gray-800 uppercase block">
                      First Graduate Status <span className="text-red-600">*</span>
                    </label>
                    <span className="text-[12px] text-gray-500">
                      Are you eligible and availing Tamil Nadu Government First Graduate fee concession?
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="isFirstGraduate"
                        checked={formData.isFirstGraduate === true}
                        onChange={() => setFormData((p) => ({ ...p, isFirstGraduate: true }))}
                        disabled={isLocked}
                        className="text-gov-navy"
                      />
                      <span className="ml-1.5 text-xs font-semibold">Yes</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="isFirstGraduate"
                        checked={formData.isFirstGraduate === false}
                        onChange={() => setFormData((p) => ({ ...p, isFirstGraduate: false }))}
                        disabled={isLocked}
                        className="text-gov-navy"
                      />
                      <span className="ml-1.5 text-xs font-semibold">No</span>
                    </label>
                  </div>
                </div>

                {formData.isFirstGraduate && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-blue-800 font-medium">
                      Note: You must upload the First Graduate Certificate issued by the Tahsildar in Step 7 before you can submit.
                    </p>
                  </div>
                )}
              </div>

              {/* PMS (Post Matric Scholarship) */}
              <div className="border border-gray-200 rounded p-3.5 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-gray-800 uppercase block">
                      Post Matric Scholarship (PMS) Beneficiary <span className="text-red-600">*</span>
                    </label>
                    <span className="text-[12px] text-gray-500">
                      Eligible for SC/SCA/ST/Converted Christian and MBC/BC eligible students.
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="isPms"
                        checked={formData.isPms === true}
                        onChange={() => setFormData((p) => ({ ...p, isPms: true }))}
                        disabled={isLocked}
                        className="text-gov-navy"
                      />
                      <span className="ml-1.5 text-xs font-semibold">Yes</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="isPms"
                        checked={formData.isPms === false}
                        onChange={() => setFormData((p) => ({ ...p, isPms: false }))}
                        disabled={isLocked}
                        className="text-gov-navy"
                      />
                      <span className="ml-1.5 text-xs font-semibold">No</span>
                    </label>
                  </div>
                </div>

                {formData.isPms && (
                  <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        PMS Application Number <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="pmsApplicationNo"
                        value={formData.pmsApplicationNo}
                        onChange={handleChange}
                        disabled={isLocked}
                        placeholder="e.g. PMS2024TN6612"
                        className={getInputClass('pmsApplicationNo')}
                      />
                      {errors.pmsApplicationNo && <p className="text-xs text-red-600 mt-1 font-medium">{errors.pmsApplicationNo}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        PMS Status
                      </label>
                      <select
                        name="pmsStatus"
                        value={formData.pmsStatus}
                        onChange={handleChange}
                        disabled={isLocked}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:border-gov-navy focus:outline-none"
                      >
                        <option value="Applied">Applied</option>
                        <option value="Approved">Approved</option>
                        <option value="Disbursed">Disbursed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Other Scholarships */}
              <div className="border border-gray-200 rounded p-3.5">
                <label className="text-xs font-bold text-gray-800 uppercase block mb-2">
                  Other Scholarships (NSP, Pragati, Private, NGO)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Scholarship Name</label>
                    <input
                      type="text"
                      name="otherScholarshipName"
                      value={formData.otherScholarshipName}
                      onChange={handleChange}
                      disabled={isLocked}
                      placeholder="e.g. AICTE Pragati Scholarship"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:border-gov-navy focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Sanctioned Amount (₹)</label>
                    <input
                      type="number"
                      name="otherScholarshipAmount"
                      value={formData.otherScholarshipAmount}
                      onChange={handleChange}
                      disabled={isLocked}
                      placeholder="e.g. 50000"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:border-gov-navy focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Status</label>
                    <input
                      type="text"
                      name="otherScholarshipStatus"
                      value={formData.otherScholarshipStatus}
                      onChange={handleChange}
                      disabled={isLocked}
                      placeholder="e.g. Received / In Process"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:border-gov-navy focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Certificate Particulars */}
              <div className="border border-gray-200 rounded p-3.5">
                <label className="text-xs font-bold text-gray-800 uppercase block mb-2">
                  Statutory Certificate Verification Details
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Community Cert Number</label>
                    <input
                      type="text"
                      name="communityCertNo"
                      value={formData.communityCertNo}
                      onChange={handleChange}
                      disabled={isLocked}
                      placeholder="e.g. CC/2021/10452"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:border-gov-navy focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Issuing Authority</label>
                    <input
                      type="text"
                      name="communityCertIssuer"
                      value={formData.communityCertIssuer}
                      onChange={handleChange}
                      disabled={isLocked}
                      placeholder="e.g. Tahsildar, Perundurai"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:border-gov-navy focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Issue Date</label>
                    <input
                      type="date"
                      name="communityCertDate"
                      value={formData.communityCertDate}
                      onChange={handleChange}
                      disabled={isLocked}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:border-gov-navy focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Income Cert Number</label>
                    <input
                      type="text"
                      name="incomeCertNo"
                      value={formData.incomeCertNo}
                      onChange={handleChange}
                      disabled={isLocked}
                      placeholder="e.g. IC/2024/0912"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:border-gov-navy focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Issuing Authority</label>
                    <input
                      type="text"
                      name="incomeCertIssuer"
                      value={formData.incomeCertIssuer}
                      onChange={handleChange}
                      disabled={isLocked}
                      placeholder="e.g. Tahsildar, Erode"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:border-gov-navy focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Issue Date</label>
                    <input
                      type="date"
                      name="incomeCertDate"
                      value={formData.incomeCertDate}
                      onChange={handleChange}
                      disabled={isLocked}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:border-gov-navy focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: BANK DETAILS */}
        {currentStep === 6 && (
          <div>
            <div className="border-b border-gov-border pb-2.5 mb-4">
              <h2 className="text-base font-bold text-gov-navy uppercase tracking-wide">
                Step 6: Bank Account Details
              </h2>
              <p className="text-xs text-gov-subtle">
                Official bank details for scholarship disbursements and academic reimbursements. Must be in student's own name.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Account Holder Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Account Holder Name (as per Bank Passbook) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="bankAccHolder"
                  value={formData.bankAccHolder}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="e.g. AARTHI S"
                  className={getInputClass('bankAccHolder')}
                />
                {errors.bankAccHolder && <p className="text-xs text-red-600 mt-1 font-medium">{errors.bankAccHolder}</p>}
              </div>

              {/* Bank Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bank Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="e.g. State Bank of India, Canara Bank, Indian Bank"
                  className={getInputClass('bankName')}
                />
                {errors.bankName && <p className="text-xs text-red-600 mt-1 font-medium">{errors.bankName}</p>}
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Account Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="bankAccNo"
                  value={formData.bankAccNo}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="e.g. 34567891234"
                  className={getInputClass('bankAccNo')}
                />
                {errors.bankAccNo && <p className="text-xs text-red-600 mt-1 font-medium">{errors.bankAccNo}</p>}
              </div>

              {/* IFSC Code */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  IFSC Code (11 Chars) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="bankIfsc"
                  maxLength={11}
                  value={formData.bankIfsc}
                  onChange={(e) => {
                    const upper = e.target.value.toUpperCase();
                    setFormData((p) => ({ ...p, bankIfsc: upper }));
                    if (errors.bankIfsc) setErrors((p) => ({ ...p, bankIfsc: null }));
                  }}
                  disabled={isLocked}
                  placeholder="e.g. SBIN0001234"
                  className={getInputClass('bankIfsc', 'uppercase')}
                />
                {errors.bankIfsc && <p className="text-xs text-red-600 mt-1 font-medium">{errors.bankIfsc}</p>}
              </div>

              {/* Branch Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  name="bankBranch"
                  value={formData.bankBranch}
                  onChange={handleChange}
                  disabled={isLocked}
                  placeholder="e.g. Perundurai ADB Branch"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-gov-navy focus:outline-none disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: DOCUMENTS UPLOAD */}
        {currentStep === 7 && (
          <div>
            <div className="border-b border-gov-border pb-2.5 mb-4">
              <h2 className="text-base font-bold text-gov-navy uppercase tracking-wide">
                Step 7: Documents Upload
              </h2>
              <p className="text-xs text-gov-subtle">
                Mandatory documents marked with <span className="text-red-600 font-bold">*</span> must be uploaded before moving to Review & Submission.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <DocumentUploadField
                  label="1. Student Passport Photo"
                  docType="photo"
                  required
                  helperText="JPG/PNG up to 2MB"
                  currentDoc={getDoc('photo')}
                  onUploadSuccess={handleDocUploaded}
                  onDeleteSuccess={handleDocDeleted}
                  disabled={isLocked}
                  studentId={studentId}
                />
                {errors.photo && <p className="text-xs text-red-600 mt-1 font-medium">{errors.photo}</p>}
              </div>

              <div>
                <DocumentUploadField
                  label="2. Aadhaar Card Copy"
                  docType="aadhaar"
                  required
                  helperText="PDF/JPG/PNG up to 2MB"
                  currentDoc={getDoc('aadhaar')}
                  onUploadSuccess={handleDocUploaded}
                  onDeleteSuccess={handleDocDeleted}
                  disabled={isLocked}
                  studentId={studentId}
                />
                {errors.aadhaar && <p className="text-xs text-red-600 mt-1 font-medium">{errors.aadhaar}</p>}
              </div>

              <div>
                <DocumentUploadField
                  label="3. Community Certificate"
                  docType="community_cert"
                  required={formData.community !== 'OC'}
                  helperText="PDF/JPG/PNG up to 2MB (Mandatory for BC/MBC/SC/ST)"
                  currentDoc={getDoc('community_cert')}
                  onUploadSuccess={handleDocUploaded}
                  onDeleteSuccess={handleDocDeleted}
                  disabled={isLocked}
                  studentId={studentId}
                />
                {errors.community_cert && <p className="text-xs text-red-600 mt-1 font-medium">{errors.community_cert}</p>}
              </div>

              <div>
                <DocumentUploadField
                  label="4. Income Certificate"
                  docType="income_cert"
                  helperText="PDF/JPG/PNG up to 2MB"
                  currentDoc={getDoc('income_cert')}
                  onUploadSuccess={handleDocUploaded}
                  onDeleteSuccess={handleDocDeleted}
                  disabled={isLocked}
                  studentId={studentId}
                />
                {errors.income_cert && <p className="text-xs text-red-600 mt-1 font-medium">{errors.income_cert}</p>}
              </div>

              {formData.isFirstGraduate && (
                <div>
                  <DocumentUploadField
                    label="5. First Graduate Certificate"
                    docType="first_graduate_cert"
                    required
                    helperText="Mandatory for First Graduate beneficiaries"
                    currentDoc={getDoc('first_graduate_cert')}
                    onUploadSuccess={handleDocUploaded}
                    onDeleteSuccess={handleDocDeleted}
                    disabled={isLocked}
                    studentId={studentId}
                  />
                  {errors.first_graduate_cert && <p className="text-xs text-red-600 mt-1 font-medium">{errors.first_graduate_cert}</p>}
                </div>
              )}

              <div>
                <DocumentUploadField
                  label="6. Bank Passbook Front Page"
                  docType="bank_passbook"
                  required
                  helperText="Showing Account No, Name & IFSC"
                  currentDoc={getDoc('bank_passbook')}
                  onUploadSuccess={handleDocUploaded}
                  onDeleteSuccess={handleDocDeleted}
                  disabled={isLocked}
                  studentId={studentId}
                />
                {errors.bank_passbook && <p className="text-xs text-red-600 mt-1 font-medium">{errors.bank_passbook}</p>}
              </div>

              <div>
                <DocumentUploadField
                  label="7. SSLC (10th) Mark Sheet"
                  docType="sslc_marksheet"
                  required
                  helperText="PDF/JPG/PNG up to 2MB"
                  currentDoc={getDoc('sslc_marksheet')}
                  onUploadSuccess={handleDocUploaded}
                  onDeleteSuccess={handleDocDeleted}
                  disabled={isLocked}
                  studentId={studentId}
                />
                {errors.sslc_marksheet && <p className="text-xs text-red-600 mt-1 font-medium">{errors.sslc_marksheet}</p>}
              </div>

              <div>
                <DocumentUploadField
                  label="8. HSC (12th) / Diploma Mark Sheet"
                  docType="hsc_marksheet"
                  required
                  helperText="PDF/JPG/PNG up to 2MB"
                  currentDoc={getDoc('hsc_marksheet')}
                  onUploadSuccess={handleDocUploaded}
                  onDeleteSuccess={handleDocDeleted}
                  disabled={isLocked}
                  studentId={studentId}
                />
                {errors.hsc_marksheet && <p className="text-xs text-red-600 mt-1 font-medium">{errors.hsc_marksheet}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: REVIEW AND SUBMIT */}
        {currentStep === 8 && (
          <div>
            <div className="border-b border-gov-border pb-2.5 mb-4">
              <h2 className="text-base font-bold text-gov-navy uppercase tracking-wide">
                Step 8: Review and Submit
              </h2>
              <p className="text-xs text-gov-subtle">
                Review all entered particulars carefully before final submission. Click on any step to revise.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="space-y-4 text-xs">
              
              {/* Personal & Contact Summary */}
              <div className="border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 mb-2 font-bold text-gov-navy">
                  <span>PERSONAL & CONTACT PARTICULARS</span>
                  <button 
                    type="button" 
                    onClick={() => setCurrentStep(1)} 
                    className="text-blue-600 hover:underline font-semibold text-[11px]"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div><span className="text-gray-500">Name:</span> <strong className="text-gray-800">{formData.name || '-'}</strong></div>
                  <div><span className="text-gray-500">Reg No:</span> <strong className="text-gray-800">{formData.registerNo}</strong></div>
                  <div><span className="text-gray-500">DOB:</span> <strong className="text-gray-800">{formData.dob}</strong></div>
                  <div><span className="text-gray-500">Gender:</span> <strong className="text-gray-800">{formData.gender}</strong></div>
                  <div><span className="text-gray-500">Community:</span> <strong className="text-gray-800">{formData.community} ({formData.caste || '-'})</strong></div>
                  <div><span className="text-gray-500">Mobile:</span> <strong className="text-gray-800">{formData.mobile || '-'}</strong></div>
                  <div><span className="text-gray-500">Email:</span> <strong className="text-gray-800">{formData.email || '-'}</strong></div>
                  <div><span className="text-gray-500">Aadhaar:</span> <strong className="text-gray-800">{formData.aadhaarNo ? `XXXX-XXXX-${formData.aadhaarNo.slice(-4)}` : '-'}</strong></div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Permanent Address:</span> <span className="text-gray-800">{formData.permanentAddress}, {formData.district}, {formData.pincode}</span>
                </div>
              </div>

              {/* Family & Academic Summary */}
              <div className="border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 mb-2 font-bold text-gov-navy">
                  <span>FAMILY & ACADEMIC PARTICULARS</span>
                  <button 
                    type="button" 
                    onClick={() => setCurrentStep(3)} 
                    className="text-blue-600 hover:underline font-semibold text-[11px]"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div><span className="text-gray-500">Father's Name:</span> <strong className="text-gray-800">{formData.fatherName || '-'}</strong></div>
                  <div><span className="text-gray-500">Mother's Name:</span> <strong className="text-gray-800">{formData.motherName || '-'}</strong></div>
                  <div><span className="text-gray-500">Parents Mobile:</span> <strong className="text-gray-800">{formData.parentsMobile || '-'}</strong></div>
                  <div><span className="text-gray-500">Annual Income:</span> <strong className="text-gray-800">₹{formData.annualIncome || '0'}</strong></div>
                  <div><span className="text-gray-500">10th Percentage:</span> <strong className="text-gray-800">{formData.sslcPercentage ? `${formData.sslcPercentage}%` : '-'}</strong></div>
                  <div><span className="text-gray-500">12th Percentage:</span> <strong className="text-gray-800">{formData.hscPercentage ? `${formData.hscPercentage}%` : '-'}</strong></div>
                  <div><span className="text-gray-500">Current Semester:</span> <strong className="text-gray-800">Sem {formData.currentSemester}</strong></div>
                  <div><span className="text-gray-500">Mode of Adm:</span> <strong className="text-gray-800">{formData.modeOfAdmission}</strong></div>
                </div>
              </div>

              {/* Scholarship & Bank Summary */}
              <div className="border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 mb-2 font-bold text-gov-navy">
                  <span>SCHOLARSHIP & BANK DETAILS</span>
                  <button 
                    type="button" 
                    onClick={() => setCurrentStep(5)} 
                    className="text-blue-600 hover:underline font-semibold text-[11px]"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div><span className="text-gray-500">First Graduate:</span> <strong className="text-gray-800">{formData.isFirstGraduate ? 'YES' : 'NO'}</strong></div>
                  <div><span className="text-gray-500">PMS Beneficiary:</span> <strong className="text-gray-800">{formData.isPms ? `YES (${formData.pmsStatus})` : 'NO'}</strong></div>
                  <div><span className="text-gray-500">Bank Name:</span> <strong className="text-gray-800">{formData.bankName || '-'}</strong></div>
                  <div><span className="text-gray-500">IFSC:</span> <strong className="text-gray-800">{formData.bankIfsc || '-'}</strong></div>
                  <div><span className="text-gray-500">Account No:</span> <strong className="text-gray-800">{formData.bankAccNo ? `XXXXXX${formData.bankAccNo.slice(-4)}` : '-'}</strong></div>
                  <div><span className="text-gray-500">Uploaded Docs:</span> <strong className="text-green-700">{formData.documents.length} Files Uploaded</strong></div>
                </div>
              </div>

              {/* Declaration Checkbox */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="declarationAccepted"
                    checked={formData.declarationAccepted}
                    onChange={handleChange}
                    disabled={isLocked}
                    className="mt-0.5 h-4 w-4 text-gov-navy border-gray-300 rounded focus:ring-gov-navy"
                  />
                  <span className="text-xs text-gray-800 font-medium leading-relaxed">
                    <strong>STUDENT DECLARATION:</strong> I hereby declare that all information furnished above is true, complete, and correct to the best of my knowledge and belief. I understand that in the event of any information being found false or incorrect at any stage, my scholarship eligibility and departmental enrollment status are liable to be revoked.
                  </span>
                </label>
                {errors.declarationAccepted && (
                  <p className="text-xs text-red-600 mt-2 font-semibold">
                    {errors.declarationAccepted}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step Status Lock Banner */}
        {!isLocked && (
          <div className={`mt-6 p-3 rounded text-xs flex items-center justify-between border ${
            isCurrentStepComplete 
              ? 'bg-green-50/80 border-green-300 text-green-900' 
              : 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-sm'
          }`}>
            <div className="flex items-center space-x-2.5">
              {isCurrentStepComplete ? (
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>
                <strong>Step {currentStep} {isCurrentStepComplete ? 'Complete' : 'Mandatory Fields Locked'}:</strong>{' '}
                {isCurrentStepComplete
                  ? 'All mandatory (*) details are entered. You can Save Draft, Save & Exit, or Continue to the next step.'
                  : 'You must fill all mandatory fields marked with (*) before you can proceed or save.'}
              </span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase border ${
              isCurrentStepComplete 
                ? 'bg-green-100 text-green-800 border-green-300' 
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {isCurrentStepComplete ? 'UNLOCKED' : 'LOCKED'}
            </span>
          </div>
        )}

        {/* Bottom Form Actions (Save draft, Save & Exit, Next, Prev, Submit) */}
        <div className="mt-4 pt-4 border-t border-gov-border flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={saving || submitting}
                className="inline-flex items-center px-3.5 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!isLocked && (
              <>
                {/* Save Draft */}
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving || submitting}
                  className={`inline-flex items-center px-3.5 py-1.5 border rounded text-xs font-semibold transition-colors ${
                    isCurrentStepComplete
                      ? 'border-gov-navy text-gov-navy hover:bg-blue-50'
                      : 'border-amber-400 text-amber-900 bg-amber-50/50 hover:bg-amber-100'
                  }`}
                  title={isCurrentStepComplete ? 'Save current step as draft' : 'Fill mandatory (*) fields to save draft'}
                >
                  {isCurrentStepComplete ? (
                    <Save className="w-4 h-4 mr-1.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save as Draft'}</span>
                </button>

                {/* Save & Exit */}
                <button
                  type="button"
                  onClick={handleSaveAndExit}
                  disabled={saving || submitting}
                  className={`inline-flex items-center px-3.5 py-1.5 border rounded text-xs font-semibold transition-colors ${
                    isCurrentStepComplete
                      ? 'border-gray-400 text-gray-700 bg-white hover:bg-gray-50'
                      : 'border-amber-300 text-amber-800 bg-amber-50/30 hover:bg-amber-100'
                  }`}
                  title={isCurrentStepComplete ? 'Save and exit form' : 'Fill mandatory (*) fields to save and exit'}
                >
                  {isCurrentStepComplete ? (
                    <Save className="w-4 h-4 mr-1.5 text-gray-600" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save & Exit'}</span>
                </button>
              </>
            )}

            {currentStep < 8 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={saving || submitting}
                className={`inline-flex items-center px-4 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors ${
                  isCurrentStepComplete
                    ? 'bg-gov-navy text-white hover:bg-gov-navy-dark'
                    : 'bg-amber-700 text-white hover:bg-amber-800'
                }`}
                title={isCurrentStepComplete ? 'Proceed to next step' : 'Complete mandatory (*) fields to advance'}
              >
                {!isCurrentStepComplete && (
                  <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-200" />
                )}
                <span>Save & Continue</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              !isLocked && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !formData.declarationAccepted}
                  className="inline-flex items-center px-5 py-1.5 bg-green-700 text-white rounded text-xs font-bold hover:bg-green-800 disabled:opacity-50 shadow-sm"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  <span>{submitting ? 'Submitting...' : 'Final Submit Record'}</span>
                </button>
              )
            )}
          </div>
        </div>

      </div>

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 p-3 bg-gov-navy text-white rounded-full shadow-lg hover:bg-gov-navy-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gov-navy z-40 transition-all duration-200"
          title="Back to Top"
          aria-label="Back to Top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Final Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-200 overflow-hidden transform transition-all">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-amber-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-full text-amber-700">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Confirm Final Submission</h3>
                  <p className="text-xs text-gray-500">Department of AI & DS – Student Record Portal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="text-gray-400 hover:text-gray-600 rounded-md p-1"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 text-xs text-gray-600 space-y-3 leading-relaxed">
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 flex items-start space-x-2">
                <Lock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Important Notice:</strong> Once submitted, your profile will be <strong>locked</strong> for administrative verification. You will not be able to edit your personal or academic information or re-upload documents without administrator permission.
                </span>
              </div>
              <p>
                Please verify that all details entered across all 8 sections (Personal, Contact, Family, Academic, Scholarship, Bank, and Documents) are accurate and match your original certificates.
              </p>
            </div>

            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                disabled={submitting}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                Review Details
              </button>
              <button
                type="button"
                onClick={executeFinalSubmit}
                disabled={submitting}
                className="inline-flex items-center px-4 py-1.5 text-xs font-bold text-white bg-green-700 hover:bg-green-800 rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Confirm & Lock Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
