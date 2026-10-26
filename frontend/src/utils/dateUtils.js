/**
 * Date formatting and input masking utilities
 * Standardizes Date of Birth (DOB) display and entry to DD/MM/YYYY (Date/Month/Year).
 */

/**
 * Format any raw date (YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, Date object) to DD/MM/YYYY
 * @param {string|Date} dobStr
 * @returns {string} Formatted date (DD/MM/YYYY) or fallback placeholder
 */
export const formatDisplayDob = (dobStr) => {
  if (!dobStr && dobStr !== 0) return '—';

  if (dobStr instanceof Date) {
    if (isNaN(dobStr.getTime())) return '—';
    const d = String(dobStr.getDate()).padStart(2, '0');
    const m = String(dobStr.getMonth() + 1).padStart(2, '0');
    const y = dobStr.getFullYear();
    return `${d}/${m}/${y}`;
  }

  const str = String(dobStr).trim();
  if (!str) return '—';

  // 1) YYYY-MM-DD or YYYY/MM/DD
  const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) {
    const y = ymd[1];
    const m = ymd[2].padStart(2, '0');
    const d = ymd[3].padStart(2, '0');
    return `${d}/${m}/${y}`;
  }

  // 2) DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    const y = dmy[3];
    return `${d}/${m}/${y}`;
  }

  // 3) DDMMYYYY (8 digits)
  const d8 = str.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (d8) {
    return `${d8[1]}/${d8[2]}/${d8[3]}`;
  }

  return str;
};

/**
 * Interactive input auto-formatter for DD/MM/YYYY entry
 * Handles keystrokes, digit-only extraction, and smooth backspacing.
 * @param {string} val Current input value
 * @param {string} prevVal Previous input value
 * @returns {string} Formatted DD/MM/YYYY string
 */
export const formatDobInput = (val, prevVal = '') => {
  if (!val) return '';

  // Handle backspace when user deletes slash
  if (prevVal && val.length < prevVal.length) {
    if (prevVal.endsWith('/') && !val.endsWith('/')) {
      return val.slice(0, -1);
    }
    return val;
  }

  // Extract digits only, up to 8 digits (DDMMYYYY)
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
};

/**
 * Convert DD/MM/YYYY or DD-MM-YYYY to standard ISO YYYY-MM-DD
 * @param {string} dobStr
 * @returns {string} ISO date YYYY-MM-DD or original
 */
export const dobToIso = (dobStr) => {
  if (!dobStr) return '';
  const str = String(dobStr).trim();

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    const y = dmy[3];
    return `${y}-${m}-${d}`;
  }

  // Match YYYY-MM-DD
  const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) {
    const y = ymd[1];
    const m = ymd[2].padStart(2, '0');
    const d = ymd[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return str;
};

/**
 * Validate whether a string is a complete and valid DD/MM/YYYY date
 * @param {string} dob
 * @returns {boolean}
 */
export const isValidDob = (dob) => {
  if (!dob) return false;
  const match = String(dob).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;

  const d = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const y = parseInt(match[3], 10);

  if (y < 1950 || y > 2050 || m < 1 || m > 12 || d < 1 || d > 31) return false;

  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};
