/**
 * Migration Script: Migrate files from MySQL LONGBLOB / local disk to Cloudflare R2
 * 
 * Usage:
 *   node scripts/migrate-to-r2.js
 * 
 * To also null database BLOB columns for confirmed R2 objects:
 *   node scripts/migrate-to-r2.js --null-blobs
 * 
 * This script is 100% idempotent and safe to re-run multiple times.
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env before application modules
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { pool, testConnection } = require('../config/db');
const {
  uploadObject,
  objectExists,
  isR2Configured,
  getBucketName
} = require('../config/r2');

const shouldNullBlobs = process.argv.includes('--null-blobs');

async function migrate() {
  console.log('====================================================');
  console.log('AI-SA-PORTAL: Cloudflare R2 Storage Migration Tool');
  console.log('====================================================');

  if (!isR2Configured()) {
    console.error('ERROR: Cloudflare R2 is not fully configured.');
    console.error('Please verify the following in backend/.env:');
    console.error('  - R2_ACCOUNT_ID');
    console.error('  - R2_ACCESS_KEY_ID');
    console.error('  - R2_SECRET_ACCESS_KEY');
    console.error('  - R2_BUCKET');
    process.exit(1);
  }

  console.log(`Target Bucket: "${getBucketName()}"`);
  console.log(`Null Blobs Mode: ${shouldNullBlobs ? 'ENABLED (--null-blobs)' : 'DISABLED (safe copy only)'}\n`);

  await testConnection();

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const stats = {
    documents: { total: 0, uploaded: 0, skipped: 0, missing: 0, failed: 0, nulled: 0 },
    photos: { total: 0, uploaded: 0, skipped: 0, missing: 0, failed: 0, nulled: 0 }
  };

  // 1. Migrate student_documents
  console.log('--- Phase 1: Migrating Student Documents ---');
  try {
    const [documents] = await pool.query(
      'SELECT id, student_id, file_name, file_path, mime_type, file_data FROM student_documents WHERE file_path IS NOT NULL'
    );
    stats.documents.total = documents.length;
    console.log(`Found ${documents.length} document records in database.`);

    for (const doc of documents) {
      const key = path.basename(doc.file_path);
      try {
        const exists = await objectExists(key);
        if (exists) {
          stats.documents.skipped++;
          console.log(`[SKIPPED] Document #${doc.id} already exists in R2: ${key}`);
          if (shouldNullBlobs && doc.file_data) {
            await pool.query('UPDATE student_documents SET file_data = NULL WHERE id = ?', [doc.id]);
            stats.documents.nulled++;
          }
          continue;
        }

        let buffer = null;
        if (doc.file_data && Buffer.isBuffer(doc.file_data) && doc.file_data.length > 0) {
          buffer = doc.file_data;
        } else {
          const diskPath = path.join(uploadsDir, key);
          if (fs.existsSync(diskPath)) {
            buffer = fs.readFileSync(diskPath);
          }
        }

        if (!buffer) {
          stats.documents.missing++;
          console.warn(`[MISSING] Document #${doc.id} (${key}) not found in DB file_data or disk.`);
          continue;
        }

        await uploadObject({
          key,
          body: buffer,
          contentType: doc.mime_type || 'application/octet-stream'
        });

        stats.documents.uploaded++;
        console.log(`[UPLOADED] Document #${doc.id} -> R2: ${key} (${buffer.length} bytes)`);

        if (shouldNullBlobs) {
          await pool.query('UPDATE student_documents SET file_data = NULL WHERE id = ?', [doc.id]);
          stats.documents.nulled++;
        }
      } catch (err) {
        stats.documents.failed++;
        console.error(`[FAILED] Document #${doc.id} (${key}):`, err.message);
      }
    }
  } catch (err) {
    console.error('Error fetching student_documents:', err.message);
  }

  // 2. Migrate student photos
  console.log('\n--- Phase 2: Migrating Student Passport Photos ---');
  try {
    const [students] = await pool.query(
      'SELECT id, register_no, name, photo_path, photo_data FROM students WHERE photo_path IS NOT NULL'
    );
    stats.photos.total = students.length;
    console.log(`Found ${students.length} student photos in database.`);

    for (const student of students) {
      const key = path.basename(student.photo_path);
      try {
        const exists = await objectExists(key);
        if (exists) {
          stats.photos.skipped++;
          console.log(`[SKIPPED] Student photo #${student.id} (${student.register_no}) already in R2: ${key}`);
          if (shouldNullBlobs && student.photo_data) {
            await pool.query('UPDATE students SET photo_data = NULL WHERE id = ?', [student.id]);
            stats.photos.nulled++;
          }
          continue;
        }

        let buffer = null;
        if (student.photo_data && Buffer.isBuffer(student.photo_data) && student.photo_data.length > 0) {
          buffer = student.photo_data;
        } else {
          const diskPath = path.join(uploadsDir, key);
          if (fs.existsSync(diskPath)) {
            buffer = fs.readFileSync(diskPath);
          }
        }

        if (!buffer) {
          stats.photos.missing++;
          console.warn(`[MISSING] Student photo #${student.id} (${key}) not found in DB or disk.`);
          continue;
        }

        await uploadObject({
          key,
          body: buffer,
          contentType: 'image/jpeg'
        });

        stats.photos.uploaded++;
        console.log(`[UPLOADED] Student photo #${student.id} (${student.register_no}) -> R2: ${key}`);

        if (shouldNullBlobs) {
          await pool.query('UPDATE students SET photo_data = NULL WHERE id = ?', [student.id]);
          stats.photos.nulled++;
        }
      } catch (err) {
        stats.photos.failed++;
        console.error(`[FAILED] Student photo #${student.id} (${key}):`, err.message);
      }
    }
  } catch (err) {
    console.error('Error fetching student photos:', err.message);
  }

  // 3. Summary
  console.log('\n====================================================');
  console.log('MIGRATION SUMMARY REPORT:');
  console.log('====================================================');
  console.log('Documents:');
  console.log(`  Total:     ${stats.documents.total}`);
  console.log(`  Uploaded:  ${stats.documents.uploaded}`);
  console.log(`  Skipped:   ${stats.documents.skipped}`);
  console.log(`  Missing:   ${stats.documents.missing}`);
  console.log(`  Failed:    ${stats.documents.failed}`);
  if (shouldNullBlobs) console.log(`  Nulled:    ${stats.documents.nulled}`);

  console.log('\nPhotos:');
  console.log(`  Total:     ${stats.photos.total}`);
  console.log(`  Uploaded:  ${stats.photos.uploaded}`);
  console.log(`  Skipped:   ${stats.photos.skipped}`);
  console.log(`  Missing:   ${stats.photos.missing}`);
  console.log(`  Failed:    ${stats.photos.failed}`);
  if (shouldNullBlobs) console.log(`  Nulled:    ${stats.photos.nulled}`);

  console.log('====================================================');
  if (stats.documents.failed > 0 || stats.photos.failed > 0) {
    console.warn('Migration completed with some failures. See logs above.');
    process.exit(1);
  } else {
    console.log('Migration completed successfully!');
    process.exit(0);
  }
}

migrate().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
