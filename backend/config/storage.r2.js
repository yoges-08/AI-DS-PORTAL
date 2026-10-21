/**
 * Cloudflare R2 Storage Adapter (Stub)
 * 
 * To switch to Cloudflare R2 in the future:
 * 1. Install @aws-sdk/client-s3 (if not present).
 * 2. Configure S3Client with:
 *    - region: 'auto'
 *    - endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
 *    - credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY }
 * 3. Implement uploadObject, downloadObject, deleteObject, objectExists, and isConfigured.
 * 4. Set STORAGE_PROVIDER=r2 in your environment variables.
 */

const isConfigured = () => {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  );
};

const uploadObject = async () => {
  throw new Error('R2 provider not implemented yet. Set STORAGE_PROVIDER=supabase or implement storage.r2.js.');
};

const downloadObject = async () => {
  throw new Error('R2 provider not implemented yet. Set STORAGE_PROVIDER=supabase or implement storage.r2.js.');
};

const deleteObject = async () => {
  throw new Error('R2 provider not implemented yet. Set STORAGE_PROVIDER=supabase or implement storage.r2.js.');
};

const objectExists = async () => {
  throw new Error('R2 provider not implemented yet. Set STORAGE_PROVIDER=supabase or implement storage.r2.js.');
};

const keepAlive = async () => {
  // Not needed for R2
};

module.exports = {
  isConfigured,
  uploadObject,
  downloadObject,
  deleteObject,
  objectExists,
  keepAlive
};
