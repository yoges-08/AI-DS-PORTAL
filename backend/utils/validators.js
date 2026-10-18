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

/**
 * Normalize and validate Date of Birth
 * Returns 'YYYY-MM-DD' on success, or null on invalid date
 */
const normalizeDob = (rawDob) => {
  if (!rawDob && rawDob !== 0) return null;

  let y, m, d;

  if (rawDob instanceof Date) {
    if (isNaN(rawDob.getTime())) return null;
    y = rawDob.getUTCFullYear();
    m = rawDob.getUTCMonth() + 1;
    d = rawDob.getUTCDate();
  } else if (typeof rawDob === 'number') {
    // Excel serial number (approx 1950 to 2050 is 18264 to 54789)
    if (!Number.isFinite(rawDob) || rawDob < 1000 || rawDob > 60000) return null;
    const excelDate = new Date(Math.round((rawDob - 25569) * 86400 * 1000));
    if (isNaN(excelDate.getTime())) return null;
    y = excelDate.getUTCFullYear();
    m = excelDate.getUTCMonth() + 1;
    d = excelDate.getUTCDate();
  } else if (typeof rawDob === 'string') {
    const trimmed = rawDob.trim();
    if (!trimmed) return null;

    // 1) YYYY-MM-DD or YYYY/MM/DD
    const matchYMD = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (matchYMD) {
      y = parseInt(matchYMD[1], 10);
      m = parseInt(matchYMD[2], 10);
      d = parseInt(matchYMD[3], 10);
    } else {
      // 2) DD-MM-YYYY or DD/MM/YYYY
      const matchDMY = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
      if (matchDMY) {
        d = parseInt(matchDMY[1], 10);
        m = parseInt(matchDMY[2], 10);
        y = parseInt(matchDMY[3], 10);
      } else {
        // 3) DDMMYYYY (8 digits)
        const matchDigits = trimmed.match(/^(\d{2})(\d{2})(\d{4})$/);
        if (matchDigits) {
          d = parseInt(matchDigits[1], 10);
          m = parseInt(matchDigits[2], 10);
          y = parseInt(matchDigits[3], 10);
        } else {
          return null;
        }
      }
    }
  } else {
    return null;
  }

  if (y < 1950 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
    return null;
  }

  // Strict calendar verification (rejects e.g. Feb 31)
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return null;
  }

  const pad = (n) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}`;
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
  dobToPasswordString,
  normalizeDob
};

