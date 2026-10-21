/**
 * Unified Storage Adapter Module
 * Exposes a single consistent interface for object storage operations.
 * Provider is selected via process.env.STORAGE_PROVIDER ('supabase' or 'r2').
 * Defaults to 'supabase'.
 */

const supabaseProvider = require('./storage.supabase');
const r2Provider = require('./storage.r2');

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
  objectExists,
  keepAlive,
  getStorageProvider
};
