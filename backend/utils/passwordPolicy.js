const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'password1',
  '12345678',
  '123456789',
  'qwerty123',
  'admin@123',
  'faculty@123',
  'welcome1',
  'welcome123'
]);

/**
 * Validates password strength according to institutional security policy
 * @param {string} password 
 * @param {object} options { registerNo, dob, minLength }
 * @returns {string|null} Error message or null if valid
 */
function checkPassword(password, { registerNo = '', dob = '', minLength = 8 } = {}) {
  const p = String(password || '');

  if (p.length < minLength) {
    return `Password must be at least ${minLength} characters long.`;
  }
  if (Buffer.byteLength(p, 'utf8') > 72) {
    return 'Password must not exceed 72 bytes in length.';
  }
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) {
    return 'Password must contain both letters and numbers.';
  }

  const lower = p.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) {
    return 'That password is too common. Please choose a more secure password.';
  }

  if (registerNo && lower.includes(String(registerNo).toLowerCase().trim())) {
    return 'Password must not contain your Register Number.';
  }

  if (dob) {
    const cleanDob = String(dob).replace(/[^0-9]/g, '');
    if (cleanDob && cleanDob.length >= 6 && lower.includes(cleanDob)) {
      return 'Password must not contain your Date of Birth.';
    }
  }

  return null;
}

module.exports = {
  checkPassword,
  COMMON_PASSWORDS
};
