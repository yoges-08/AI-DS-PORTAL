const crypto = require('crypto');

// 32-byte key represented as 64 hex characters
const envKeyHex = process.env.FIELD_ENCRYPTION_KEY || '';
let KEY = Buffer.from(envKeyHex, 'hex');

if (KEY.length !== 32) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: FIELD_ENCRYPTION_KEY (64 hex characters / 32 bytes) is required in production.');
    process.exit(1);
  } else {
    // Deterministic dev fallback key (32 bytes)
    KEY = crypto.createHash('sha256').update('aids_portal_dev_field_encryption_key_2026').digest();
  }
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
    console.warn('[fieldCrypto Decrypt Warning]: Could not decrypt data, returning raw value:', err.message);
    return value;
  }
}

module.exports = {
  encrypt,
  decrypt
};
