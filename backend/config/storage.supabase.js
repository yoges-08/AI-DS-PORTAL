const { createClient } = require('@supabase/supabase-js');
const path = require('path');

let supabaseClient = null;

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
 * Upload an object buffer to Supabase Storage (private bucket)
 */
const uploadObject = async ({ key, body, contentType }) => {
  const safeKey = path.basename(key);
  const client = getClient();
  const bucket = getBucketName();

  const { data, error } = await client.storage
    .from(bucket)
    .upload(safeKey, body, {
      contentType: contentType || 'application/octet-stream',
      upsert: false
    });

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
 * Runs a cheap bucket list query to prevent auto-pause
 */
const keepAlive = async () => {
  try {
    if (!isConfigured()) return;
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
  objectExists,
  keepAlive
};
