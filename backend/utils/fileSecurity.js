const path = require('path');

/**
 * Binary file type signature (magic bytes) detection.
 * Inspects raw buffer bytes to prevent malicious file uploads disguised with false extensions.
 */
function detectFileTypeFromBuffer(buffer) {
  if (!buffer || buffer.length < 4) return null;

  // 1. PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { ext: '.pdf', mime: 'application/pdf', type: 'PDF' };
  }

  // 2. JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: '.jpg', mime: 'image/jpeg', type: 'JPEG' };
  }

  // 3. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ext: '.png', mime: 'image/png', type: 'PNG' };
  }

  // 4. WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { ext: '.webp', mime: 'image/webp', type: 'WebP' };
  }

  // 5. Excel XLSX / ZIP Archive: PK\x03\x04
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return { ext: '.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', type: 'XLSX' };
  }

  // 6. Legacy Excel XLS (OLE2 compound document): D0 CF 11 E0 A1 B1 1A E1
  if (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1
  ) {
    return { ext: '.xls', mime: 'application/vnd.ms-excel', type: 'XLS' };
  }

  return null;
}

/**
 * Validates document buffer against allowed academic document extensions (.pdf, .jpg, .jpeg, .png, .webp).
 * Returns { valid: boolean, error?: string, detectedType?: object }
 */
function validateDocumentBuffer(buffer, originalname) {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Uploaded file is empty.' };
  }

  const detected = detectFileTypeFromBuffer(buffer);
  if (!detected) {
    return {
      valid: false,
      error: 'File signature verification failed: file content is not a valid PDF, JPG, PNG, or WebP document.'
    };
  }

  const allowedDocumentTypes = ['PDF', 'JPEG', 'PNG', 'WebP'];
  if (!allowedDocumentTypes.includes(detected.type)) {
    return {
      valid: false,
      error: `Disallowed file content: detected ${detected.type}. Only PDF, JPG, PNG, or WebP documents are allowed.`
    };
  }

  // Verify that the claimed extension matches the binary signature
  const claimedExt = path.extname(originalname || '').toLowerCase();
  const validExtsForType = {
    PDF: ['.pdf'],
    JPEG: ['.jpg', '.jpeg'],
    PNG: ['.png'],
    WebP: ['.webp']
  };

  const expectedExts = validExtsForType[detected.type] || [];
  if (claimedExt && !expectedExts.includes(claimedExt)) {
    return {
      valid: false,
      error: `File extension mismatch: file extension "${claimedExt}" does not match its real content type (${detected.type}).`
    };
  }

  return { valid: true, detectedType: detected };
}

/**
 * Validates spreadsheet buffer against allowed import extensions (.xlsx, .xls, .csv).
 */
function validateSpreadsheetBuffer(buffer, originalname) {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Uploaded spreadsheet is empty.' };
  }

  const claimedExt = path.extname(originalname || '').toLowerCase();
  const detected = detectFileTypeFromBuffer(buffer);

  if (claimedExt === '.xlsx') {
    if (!detected || detected.type !== 'XLSX') {
      return { valid: false, error: 'Corrupted or spoofed .xlsx file. Binary signature does not match Excel OpenXML format.' };
    }
    return { valid: true, detectedType: detected };
  }

  if (claimedExt === '.xls') {
    if (!detected || detected.type !== 'XLS') {
      return { valid: false, error: 'Corrupted or spoofed .xls file. Binary signature does not match Excel legacy format.' };
    }
    return { valid: true, detectedType: detected };
  }

  if (claimedExt === '.csv') {
    // CSV is plain text: verify no binary null bytes in the first 1KB
    const sample = buffer.slice(0, Math.min(1024, buffer.length));
    for (let i = 0; i < sample.length; i++) {
      if (sample[i] === 0x00) {
        return { valid: false, error: 'Invalid CSV file: binary control characters detected.' };
      }
    }
    return { valid: true, detectedType: { ext: '.csv', mime: 'text/csv', type: 'CSV' } };
  }

  return { valid: false, error: 'Invalid file format. Only .xlsx, .xls, or .csv files are supported.' };
}

module.exports = {
  detectFileTypeFromBuffer,
  validateDocumentBuffer,
  validateSpreadsheetBuffer
};
