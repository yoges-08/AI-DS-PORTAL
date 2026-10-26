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

const isScientificNotation = (val) => {
  if (!val && val !== 0) return false;
  return /^[0-9]+(\.[0-9]+)?[eE]\+?[0-9]+$/i.test(String(val).trim());
};

const cleanRegisterNo = (regNo) => {
  if (!regNo && regNo !== 0) return '';
  let str = String(regNo).trim();
  // Strip trailing float .0 from Excel numbers formatted with decimals (e.g. 71762305041.0)
  str = str.replace(/\.0+$/, '').trim();
  return str;
};

const validateRegisterNo = (regNo) => {
  if (isScientificNotation(regNo)) return false;
  const clean = cleanRegisterNo(regNo);
  if (!clean) return false;
  // Typically 5 to 20 alphanumeric characters
  return /^[a-zA-Z0-9]{5,20}$/.test(clean);
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
 * Supports YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY (Excel US), DDMMYYYY, JS Dates and Excel serial numbers.
 * Returns 'YYYY-MM-DD' on success, or null on invalid date
 */
const normalizeDob = (rawDob, formatHint = null) => {
  if (!rawDob && rawDob !== 0) return null;

  let y, m, d;

  if (rawDob instanceof Date) {
    if (isNaN(rawDob.getTime())) return null;
    y = rawDob.getFullYear();
    m = rawDob.getMonth() + 1;
    d = rawDob.getDate();
  } else if (typeof rawDob === 'number') {
    // Excel serial number (approx 1950 to 2050 is 18264 to 54789)
    if (!Number.isFinite(rawDob) || rawDob < 1000 || rawDob > 60000) return null;
    const excelDate = new Date(Math.round((rawDob - 25569) * 86400 * 1000));
    if (isNaN(excelDate.getTime())) return null;
    y = excelDate.getFullYear();
    m = excelDate.getMonth() + 1;
    d = excelDate.getDate();
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
      // 2) Two-part date: M/D/YYYY or D/M/YYYY
      const match2Part = trimmed.match(/^(\d{1,2})([-/.])(\d{1,2})[-/.](\d{4})$/);
      if (match2Part) {
        const p1 = parseInt(match2Part[1], 10);
        const sep = match2Part[2];
        const p2 = parseInt(match2Part[3], 10);
        y = parseInt(match2Part[4], 10);

        if (p2 > 12 && p1 <= 12) {
          // Definitely M/D/YYYY (e.g. 2/14/2005)
          m = p1;
          d = p2;
        } else if (p1 > 12 && p2 <= 12) {
          // Definitely D/M/YYYY (e.g. 14/2/2005)
          d = p1;
          m = p2;
        } else if (formatHint === 'MDY') {
          m = p1;
          d = p2;
        } else {
          // Standard Indian format: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
          d = p1;
          m = p2;
        }
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

/**
 * Validate student age (must be real calendar date, not in future, age between minAge and maxAge)
 * Default age window: 15 to 40 years
 */
const validateStudentAge = (dobString, minAge = 15, maxAge = 40) => {
  if (!dobString) return false;
  const parts = String(dobString).split('-');
  if (parts.length !== 3) return false;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  const birthDate = new Date(Date.UTC(y, m - 1, d));
  const today = new Date();
  if (birthDate > today) return false;

  let age = today.getUTCFullYear() - y;
  const monthDiff = (today.getUTCMonth() + 1) - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < d)) {
    age--;
  }
  return age >= minAge && age <= maxAge;
};

const formatDisplayDob = (dob) => {
  if (!dob) return '';
  const parts = String(dob).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return String(dob);
};

module.exports = {
  formatDisplayDob,
  cleanRegisterNo,
  isScientificNotation,
  validateMobile,
  validateAadhaar,
  validateIfsc,
  validatePincode,
  validateEmail,
  validateRegisterNo,
  maskAadhaar,
  maskBankAcc,
  dobToPasswordString,
  normalizeDob,
  validateStudentAge
};
