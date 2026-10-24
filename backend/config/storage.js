/**
 * Unified Storage Adapter Module
 * Exposes a single consistent interface for object storage operations.
 * Provider is selected via process.env.STORAGE_PROVIDER ('supabase' or 'r2').
 * Defaults to 'supabase'.
 */

const supabaseProvider = require('./storage.supabase');
const r2Provider = require('./r2');

const getProvider = () => {
  const provider = (process.env.STORAGE_PROVIDER || 'supabase').toLowerCase().trim();
  if (provider === 'r2') {
    return r2Provider;
  }
  return supabaseProvider;
};

const isStorageConfigured = () => {
  return getProvider().isConfigured();
};

const uploadObject = async (params = {}) => {
  return await getProvider().uploadObject(params);
};

const downloadObject = async (key) => {
  return await getProvider().downloadObject(key);
};

const deleteObject = async (key) => {
  return await getProvider().deleteObject(key);
};

const deleteObjects = async (keys = []) => {
  const provider = getProvider();
  if (typeof provider.deleteObjects === 'function') {
    return await provider.deleteObjects(keys);
  }
  // Fallback for providers without batch delete implementation
  const result = { deleted: 0, failed: [] };
  const safeKeys = [...new Set((Array.isArray(keys) ? keys : [keys]).filter(Boolean))];
  for (const key of safeKeys) {
    try {
      await provider.deleteObject(key);
      result.deleted += 1;
    } catch (e) {
      result.failed.push(key);
    }
  }
  return result;
};

const objectExists = async (key) => {
  return await getProvider().objectExists(key);
};

const keepAlive = async () => {
  return await getProvider().keepAlive();
};

const getStorageProvider = () => {
  return (process.env.STORAGE_PROVIDER || 'supabase').toLowerCase().trim();
};

module.exports = {
  isStorageConfigured,
  uploadObject,
  downloadObject,
  deleteObject,
  deleteObjects,
  objectExists,
  keepAlive,
  getStorageProvider
};
