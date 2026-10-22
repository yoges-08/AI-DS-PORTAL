/**
 * Orphaned Storage File Cleanup Tool
 * 
 * Scans Supabase Storage against the active database records, identifies files
 * left behind by past deletions or orphaned uploads, and safely cleans them up.
 * 
 * Usage:
 *   node scripts/cleanup-orphaned-files.js            # Safe dry-run report only
 *   node scripts/cleanup-orphaned-files.js --delete   # Permanently delete orphans
 */

const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { pool, testConnection } = require('../config/db');

const BUCKET = process.env.SUPABASE_BUCKET || 'aids-portal-files';
const DO_DELETE = process.argv.includes('--delete');

// Safety buffer: files created less than 1 hour ago are skipped to protect in-flight uploads
const MIN_AGE_MS = 60 * 60 * 1000;

async function runCleanup() {
  console.log('====================================================');
  console.log('AI-SA-PORTAL: Storage Orphan File Detection & Cleanup');
  console.log(`Mode: ${DO_DELETE ? 'LIVE DELETION (--delete)' : 'DRY-RUN / REPORT ONLY (Safe)'}`);
  console.log('====================================================');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env');
    process.exit(1);
  }

  // 1. Initialize database connection
  await testConnection();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // 2. Fetch all valid referenced filenames from database
  const referencedKeys = new Set();

  try {
    const [docs] = await pool.query('SELECT file_path FROM student_documents WHERE file_path IS NOT NULL');
    docs.forEach((d) => {
      if (d.file_path) referencedKeys.add(path.basename(d.file_path));
    });

    const [students] = await pool.query('SELECT photo_path FROM students WHERE photo_path IS NOT NULL');
    students.forEach((s) => {
      if (s.photo_path) referencedKeys.add(path.basename(s.photo_path));
    });
  } catch (dbErr) {
    console.error('Failed to query database for referenced files:', dbErr.message);
    process.exit(1);
  }

  console.log(`[DB] Found ${referencedKeys.size} distinct file reference(s) in active student records.`);

  // 3. Paginate through all files stored in Supabase bucket
  console.log(`[Storage] Scanning Supabase bucket "${BUCKET}"...`);
  const bucketFiles = [];
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', {
        limit: PAGE_SIZE,
        offset,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`Failed to list files from Supabase bucket: ${error.message}`);
      process.exit(1);
    }

    if (!data || data.length === 0) break;

    // Filter out folder placeholders or non-files
    const files = data.filter((item) => item.id || (item.metadata && item.metadata.size !== undefined));
    bucketFiles.push(...files);

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  console.log(`[Storage] Found ${bucketFiles.length} total object(s) in bucket.`);

  // 4. Identify orphans: files present in bucket but absent from database references
  const now = Date.now();
  const orphans = bucketFiles.filter((file) => {
    if (referencedKeys.has(file.name)) {
      return false; // Valid referenced file
    }
    const createdAt = new Date(file.created_at || file.updated_at || 0).getTime();
    return (now - createdAt) > MIN_AGE_MS;
  });

  const totalOrphanBytes = orphans.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
  const totalOrphanMB = (totalOrphanBytes / (1024 * 1024)).toFixed(2);

  console.log('----------------------------------------------------');
  console.log(`Total Objects in Bucket:       ${bucketFiles.length}`);
  console.log(`Active Database References:    ${referencedKeys.size}`);
  console.log(`Orphaned Files Detected:      ${orphans.length} (${totalOrphanMB} MB)`);
  console.log('----------------------------------------------------');

  if (orphans.length === 0) {
    console.log('Bucket is 100% clean. No orphaned files found!');
    process.exit(0);
  }

  console.log('Sample orphaned files (up to 30):');
  orphans.slice(0, 30).forEach((f, idx) => {
    const sz = f.metadata?.size ? `(${Math.round(f.metadata.size / 1024)} KB)` : '';
    console.log(`  ${idx + 1}. ${f.name} ${sz}`);
  });
  if (orphans.length > 30) {
    console.log(`  ... and ${orphans.length - 30} more.`);
  }

  if (!DO_DELETE) {
    console.log('\n[DRY RUN] No files were deleted.');
    console.log('To permanently remove these orphaned files, re-run with:');
    console.log('  node scripts/cleanup-orphaned-files.js --delete\n');
    process.exit(0);
  }

  // 5. Live removal in batches of 100
  console.log(`\n[CLEANUP] Deleting ${orphans.length} orphaned files in batches of 100...`);
  let removedCount = 0;
  let failedCount = 0;
  const BATCH_SIZE = 100;

  for (let i = 0; i < orphans.length; i += BATCH_SIZE) {
    const batch = orphans.slice(i, i + BATCH_SIZE).map((f) => f.name);
    try {
      const { data, error } = await supabase.storage.from(BUCKET).remove(batch);
      if (error) {
        console.warn(`  Warning: Batch ${Math.floor(i / BATCH_SIZE) + 1} remove error: ${error.message}`);
        failedCount += batch.length;
      } else {
        removedCount += Array.isArray(data) ? data.length : batch.length;
      }
    } catch (batchErr) {
      console.warn(`  Warning: Batch exception: ${batchErr.message}`);
      failedCount += batch.length;
    }
  }

  console.log(`\nCleanup Complete! Successfully removed ${removedCount} orphaned file(s) (${totalOrphanMB} MB reclaimed).`);
  if (failedCount > 0) {
    console.warn(`Note: ${failedCount} file(s) could not be removed.`);
  }
  process.exit(0);
}

runCleanup().catch((err) => {
  console.error('Fatal cleanup error:', err);
  process.exit(1);
});
