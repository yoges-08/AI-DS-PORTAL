require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('../config/db');

(async () => {
  const [username, name, email, password] = process.argv.slice(2);
  if (!username || !password || password.length < 12) {
    console.error('Usage: node scripts/create-admin.js <username> "<Full Name>" <email> <password (12+ chars)>');
    process.exit(1);
  }

  await testConnection();

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO admins (username, password, name, email, department, created_at)
     VALUES (?, ?, ?, ?, 'Artificial Intelligence & Data Science', NOW())`,
    [username.toLowerCase().trim(), hash, name || 'Department Admin', email || null]
  );
  console.log(`Admin "${username.toLowerCase().trim()}" created successfully.`);
  process.exit(0);
})().catch(e => {
  console.error('[create-admin Error]:', e.message);
  process.exit(1);
});
