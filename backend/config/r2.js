const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} = require('@aws-sdk/client-s3');

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
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: body,
    ContentType: contentType
  });
  return await client.send(command);
};

/**
 * Retrieve a readable stream for a file in Cloudflare R2
 */
const getObjectStream = async (key) => {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key
  });
  const response = await client.send(command);
  return {
    stream: response.Body,
    contentType: response.ContentType,
    contentLength: response.ContentLength
  };
};

/**
 * Delete an object from Cloudflare R2.
 * Never throws if key is missing or delete fails (logs warning and continues).
 */
const deleteObject = async (key) => {
  try {
    if (!isR2Configured() || !key) return;
    const client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key
    });
    await client.send(command);
  } catch (err) {
    console.warn(`[R2 Warning] Could not delete object "${key}":`, err.message);
  }
};

/**
 * Check if an object exists in Cloudflare R2
 */
const objectExists = async (key) => {
  try {
    if (!isR2Configured() || !key) return false;
    const client = getR2Client();
    const command = new HeadObjectCommand({
      Bucket: getBucketName(),
      Key: key
    });
    await client.send(command);
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
};

module.exports = {
  isR2Configured,
  getR2Client,
  uploadObject,
  getObjectStream,
  deleteObject,
  objectExists,
  getBucketName
};
