const { createClient } = require('@supabase/supabase-js');
const path = require('path');

let supabaseClient = null;
let bucketVerified = false;

const isConfigured = () => {
  return Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

const getBucketName = () => {
  return process.env.SUPABASE_BUCKET || 'aids-portal-files';
};

const getClient = () => {
  if (!supabaseClient) {
    if (!isConfigured()) {
      throw new Error('Supabase Storage is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    }
    supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
  }
  return supabaseClient;
};

/**
 * Ensure the private storage bucket exists, creating it automatically if missing.
 */
const ensureBucketExists = async () => {
  if (bucketVerified || !isConfigured()) return;
  try {
    const client = getClient();
    const bucket = getBucketName();
    const { data, error } = await client.storage.getBucket(bucket);
    if (error || !data) {
      console.log(`[Supabase Storage] Bucket "${bucket}" not found. Auto-creating private bucket...`);
      const { error: createError } = await client.storage.createBucket(bucket, {
        public: false
      });
      if (createError && !createError.message?.toLowerCase().includes('already exists')) {
        console.warn(`[Supabase Storage Warning] Could not auto-create bucket "${bucket}":`, createError.message);
      } else {
        console.log(`[Supabase Storage] Successfully auto-created private bucket "${bucket}"!`);
      }
    }
    bucketVerified = true;
  } catch (err) {
    console.warn('[Supabase Storage Warning] ensureBucketExists error:', err.message);
  }
};

/**
 * Upload an object buffer to Supabase Storage (private bucket)
 */
const uploadObject = async ({ key, body, contentType }) => {
  const safeKey = path.basename(key);
  const client = getClient();
  const bucket = getBucketName();

  let { data, error } = await client.storage
    .from(bucket)
    .upload(safeKey, body, {
      contentType: contentType || 'application/octet-stream',
      upsert: false
    });

  // If bucket does not exist, automatically create it and retry upload once
  if (error && error.message?.toLowerCase().includes('bucket not found')) {
    console.log(`[Supabase Storage] Bucket "${bucket}" not found. Auto-creating private bucket and retrying...`);
    bucketVerified = false;
    await ensureBucketExists();
    const retry = await client.storage
      .from(bucket)
      .upload(safeKey, body, {
        contentType: contentType || 'application/octet-stream',
        upsert: false
      });
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(`Supabase Storage upload error: ${error.message}`);
  }

  return data;
};

/**
 * Download an object buffer from Supabase Storage
 * Returns { buffer, contentType } or null if not found
 */
const downloadObject = async (key) => {
  const safeKey = path.basename(key);
  const client = getClient();
  const bucket = getBucketName();

  const { data, error } = await client.storage
    .from(bucket)
    .download(safeKey);

  if (error) {
    // Treat "not found" / 404 / 400 as null
    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode;
    if (msg.includes('not found') || msg.includes('does not exist') || status === 404 || status === '404') {
      return null;
    }
    console.warn(`[Supabase Storage] Download error for "${safeKey}":`, error.message);
    return null;
  }

  if (!data) return null;

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = data.type || null;

  return { buffer, contentType };
};

/**
 * Delete an object from Supabase Storage
 * Must NEVER throw if key is missing (log and continue)
 */
const deleteObject = async (key) => {
  try {
    if (!isConfigured() || !key) return;
    const safeKey = path.basename(key);
    const client = getClient();
    const bucket = getBucketName();

    const { error } = await client.storage
      .from(bucket)
      .remove([safeKey]);

    if (error) {
      console.warn(`[Supabase Storage Warning] Could not remove "${safeKey}":`, error.message);
    }
  } catch (err) {
    console.warn(`[Supabase Storage Warning] Error in deleteObject for "${key}":`, err.message);
  }
};

/**
 * Delete many objects from Supabase Storage in batches.
 * Never throws. Returns { deleted: number, failed: string[] }.
 */
const deleteObjects = async (keys = []) => {
  const result = { deleted: 0, failed: [] };
  const safeKeys = [...new Set(
    (Array.isArray(keys) ? keys : [keys]).filter(Boolean).map((k) => path.basename(k))
  )];

  if (safeKeys.length === 0) return result;

  if (!isConfigured()) {
    result.failed = safeKeys;
    return result;
  }

  const client = getClient();
  const bucket = getBucketName();
  const BATCH = 100;

  for (let i = 0; i < safeKeys.length; i += BATCH) {
    const batch = safeKeys.slice(i, i + BATCH);
    try {
      const { data, error } = await client.storage.from(bucket).remove(batch);
      if (error) {
        console.warn('[Supabase Storage Warning] Batch remove failed:', error.message);
        result.failed.push(...batch);
      } else {
        result.deleted += Array.isArray(data) ? data.length : batch.length;
      }
    } catch (err) {
      console.warn('[Supabase Storage Warning] Batch remove error:', err.message);
      result.failed.push(...batch);
    }
  }
  return result;
};

/**
 * Check if an object exists in Supabase Storage
 */
const objectExists = async (key) => {
  try {
    if (!isConfigured() || !key) return false;
    const safeKey = path.basename(key);
    const client = getClient();
    const bucket = getBucketName();

    // Use built-in exists method
    if (typeof client.storage.from(bucket).exists === 'function') {
      const { data, error } = await client.storage.from(bucket).exists(safeKey);
      if (!error && typeof data === 'boolean') {
        return data;
      }
    }

    // Fallback via list search
    const { data: listData, error: listError } = await client.storage
      .from(bucket)
      .list('', { search: safeKey, limit: 1 });

    if (!listError && Array.isArray(listData)) {
      return listData.some((item) => item.name === safeKey);
    }

    return false;
  } catch (err) {
    console.warn(`[Supabase Storage Warning] Error checking existence for "${key}":`, err.message);
    return false;
  }
};

/**
 * Keep-alive ping for Supabase free-tier project
 * Runs a cheap bucket query and ensures private bucket exists
 */
const keepAlive = async () => {
  try {
    if (!isConfigured()) return;
    await ensureBucketExists();
    const client = getClient();
    const bucket = getBucketName();
    await client.storage.from(bucket).list('', { limit: 1 });
    console.log('[Supabase Keep-Alive] Ping succeeded (activity refreshed).');
  } catch (err) {
    console.warn('[Supabase Keep-Alive Warning] Ping failed:', err.message);
  }
};

module.exports = {
  isConfigured,
  uploadObject,
  downloadObject,
  deleteObject,
  deleteObjects,
  objectExists,
  keepAlive
};
