const crypto = require('crypto');

/**
 * 256-bit AES-GCM Key Initialization
 * Resolves 32-byte cryptographic key with seamless fallbacks:
 * 1. Explicit 64-hex FIELD_ENCRYPTION_KEY
 * 2. Any custom passphrase string hashed with SHA-256 (32 bytes)
 * 3. Derived from JWT_SECRET or COOKIE_SECRET in production reverse proxy
 * 4. Deterministic fallback in local development
 */
let KEY;
const envKey = (process.env.FIELD_ENCRYPTION_KEY || '').trim();

if (envKey && envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
  KEY = Buffer.from(envKey, 'hex');
} else if (envKey) {
  KEY = crypto.createHash('sha256').update(envKey).digest();
} else if (process.env.NODE_ENV === 'production') {
  console.error('FATAL: A unique 64-hex-character FIELD_ENCRYPTION_KEY must be configured in production.');
  process.exit(1);
} else if (process.env.JWT_SECRET) {
  KEY = crypto.createHash('sha256').update(process.env.JWT_SECRET + ':aids_field_encryption_salt').digest();
  console.log('[fieldCrypto Notice] FIELD_ENCRYPTION_KEY not explicitly configured; securely derived 256-bit AES key from server JWT secret.');
} else {
  KEY = crypto.createHash('sha256').update('aids_portal_dev_field_encryption_key_2026').digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 * Format: enc:<ivHex>:<tagHex>:<ciphertextHex>
 */
function encrypt(plain) {
  if (plain === null || plain === undefined || plain === '') return plain;
  try {
    const iv = crypto.randomBytes(12); // Recommended 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
    const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
  } catch (err) {
    console.error('[fieldCrypto Encrypt Error]:', err.message);
    throw err;
  }
}

/**
 * Decrypts an AES-256-GCM encrypted string, or passes legacy unencrypted data through
 */
function decrypt(value) {
  if (typeof value !== 'string' || !value.startsWith('enc:')) {
    return value; // Legacy plaintext or null
  }
  try {
    const parts = value.split(':');
    if (parts.length !== 4) return value;
    const [, ivHex, tagHex, dataHex] = parts;
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const dec = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
    return dec.toString('utf8');
  } catch (err) {
    console.warn('[fieldCrypto Decrypt Warning]: Could not decrypt data:', err.message);
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt
};
