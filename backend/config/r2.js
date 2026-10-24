const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand
} = require('@aws-sdk/client-s3');
const path = require('path');

const isR2Configured = () => {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  );
};

let s3ClientInstance = null;

const getR2Client = () => {
  if (!s3ClientInstance) {
    if (!isR2Configured()) {
      throw new Error('Cloudflare R2 is not fully configured in environment variables.');
    }
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      }
    });
  }
  return s3ClientInstance;
};

const getBucketName = () => {
  return process.env.R2_BUCKET || 'aids-portal-files';
};

/**
 * Upload an object buffer to Cloudflare R2
 */
const uploadObject = async ({ key, body, contentType }) => {
  const safeKey = path.basename(key);
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: safeKey,
    Body: body,
    ContentType: contentType || 'application/octet-stream'
  });
  return await client.send(command);
};

/**
 * Retrieve a readable stream for a file in Cloudflare R2
 */
const getObjectStream = async (key) => {
  const safeKey = path.basename(key);
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: safeKey
  });
  const response = await client.send(command);
  return {
    stream: response.Body,
    contentType: response.ContentType,
    contentLength: response.ContentLength
  };
};

/**
 * Download an object buffer from Cloudflare R2
 * Returns { buffer, contentType } or null if not found
 */
const downloadObject = async (key) => {
  try {
    if (!isR2Configured() || !key) return null;
    const safeKey = path.basename(key);
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: getBucketName(),
      Key: safeKey
    });
    const response = await client.send(command);
    if (!response.Body) return null;
    const byteArray = await response.Body.transformToByteArray();
    const buffer = Buffer.from(byteArray);
    const contentType = response.ContentType || 'application/octet-stream';
    return { buffer, contentType };
  } catch (err) {
    if (err.name === 'NoSuchKey' || err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    console.warn(`[R2 Download Warning] Error downloading "${key}":`, err.message);
    return null;
  }
};

/**
 * Delete an object from Cloudflare R2.
 * Never throws if key is missing or delete fails (logs warning and continues).
 */
const deleteObject = async (key) => {
  try {
    if (!isR2Configured() || !key) return;
    const safeKey = path.basename(key);
    const client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: safeKey
    });
    await client.send(command);
  } catch (err) {
    console.warn(`[R2 Warning] Could not delete object "${key}":`, err.message);
  }
};

/**
 * Delete many objects from Cloudflare R2
 * Never throws. Returns { deleted: number, failed: string[] }.
 */
const deleteObjects = async (keys = []) => {
  const result = { deleted: 0, failed: [] };
  const safeKeys = [...new Set((Array.isArray(keys) ? keys : [keys]).filter(Boolean).map((k) => path.basename(k)))];
  if (safeKeys.length === 0) return result;
  if (!isR2Configured()) {
    result.failed = safeKeys;
    return result;
  }
  for (const k of safeKeys) {
    try {
      await deleteObject(k);
      result.deleted += 1;
    } catch (e) {
      result.failed.push(k);
    }
  }
  return result;
};

/**
 * Check if an object exists in Cloudflare R2
 */
const objectExists = async (key) => {
  try {
    if (!isR2Configured() || !key) return false;
    const safeKey = path.basename(key);
    const client = getR2Client();
    const command = new HeadObjectCommand({
      Bucket: getBucketName(),
      Key: safeKey
    });
    await client.send(command);
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    return false;
  }
};

/**
 * Keep-alive ping for Cloudflare R2
 */
const keepAlive = async () => {
  try {
    if (!isR2Configured()) return;
    const client = getR2Client();
    const command = new HeadBucketCommand({
      Bucket: getBucketName()
    });
    await client.send(command);
    console.log('[R2 Keep-Alive] Ping succeeded (activity refreshed).');
  } catch (err) {
    console.warn('[R2 Keep-Alive Warning] Ping failed:', err.message);
  }
};

module.exports = {
  isConfigured: isR2Configured,
  isR2Configured,
  getR2Client,
  uploadObject,
  getObjectStream,
  downloadObject,
  deleteObject,
  deleteObjects,
  objectExists,
  keepAlive,
  getBucketName
};
