const path = require('path');
const fs = require('fs');
const { isStorageConfigured, downloadObject } = require('../config/storage');

const uploadsDir = path.join(__dirname, '..', 'uploads');

/**
 * Reads a stored file from Cloud Storage, BLOB data, or local disk
 * Returns Buffer or null
 */
async function readStoredFile({ filePath, fileName, mimeType, fileData }) {
  const filename = path.basename(filePath || fileName || '');
  if (!filename) return null;

  // 1. Storage Provider (Supabase / R2)
  if (isStorageConfigured()) {
    try {
      const fileObj = await downloadObject(filename);
      if (fileObj && fileObj.buffer) {
        return fileObj.buffer;
      }
    } catch (e) {
      // ignore
    }
  }

  // 2. Database BLOB
  if (fileData) {
    return Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData);
  }

  // 3. Local disk fallback
  const diskPath = path.join(uploadsDir, filename);
  if (fs.existsSync(diskPath)) {
    try {
      return fs.readFileSync(diskPath);
    } catch (e) {
      // ignore
    }
  }

  return null;
}

module.exports = {
  readStoredFile
};
