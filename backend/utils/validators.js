/**
 * Input validation utilities for Student Information System
 */

const validateMobile = (mobile) => {
  if (!mobile) return false;
  // Exactly 10 digits starting with 6-9
  return /^[6-9]\d{9}$/.test(String(mobile).trim());
};

const validateAadhaar = (aadhaar) => {
  if (!aadhaar) return false;
  // Exactly 12 digits
  return /^\d{12}$/.test(String(aadhaar).trim());
};

const validateIfsc = (ifsc) => {
  if (!ifsc) return false;
  // 4 letters, 0, followed by 6 alphanumeric characters
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(ifsc).trim().toUpperCase());
};

const validatePincode = (pincode) => {
  if (!pincode) return false;
  // 6 digits starting with 1-9
  return /^[1-9]\d{5}$/.test(String(pincode).trim());
};

const validateEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
};

const validateRegisterNo = (regNo) => {
  if (!regNo) return false;
  // Typically 11 or 12 digits or alphanumeric e.g., 71762105001 or 312321104001
  return /^[a-zA-Z0-9]{5,20}$/.test(String(regNo).trim());
};

/**
 * Mask sensitive data for table views
 */
const maskAadhaar = (aadhaar) => {
  if (!aadhaar || String(aadhaar).length < 4) return 'XXXX-XXXX-XXXX';
  const clean = String(aadhaar).trim();
  const lastFour = clean.slice(-4);
  return `XXXX-XXXX-${lastFour}`;
};

const maskBankAcc = (accNo) => {
  if (!accNo || String(accNo).length < 4) return 'XXXXXXXX';
  const clean = String(accNo).trim();
  const lastFour = clean.slice(-4);
  return `XXXXXX${lastFour}`;
};

/**
 * Convert DOB (YYYY-MM-DD) to default password (DDMMYYYY)
 */
const dobToPasswordString = (dob) => {
  if (!dob) return '';
  // handles YYYY-MM-DD
  const parts = String(dob).split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${day}${month}${year}`;
  }
  // If already DDMMYYYY
  return String(dob).replace(/\D/g, '');
};

module.exports = {
  validateMobile,
  validateAadhaar,
  validateIfsc,
  validatePincode,
  validateEmail,
  validateRegisterNo,
  maskAadhaar,
  maskBankAcc,
  dobToPasswordString
};
