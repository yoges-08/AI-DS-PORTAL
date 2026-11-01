require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('../config/db');

(async () => {
  const [usernameArg, newPasswordArg] = process.argv.slice(2);

  await testConnection();

  // If no args provided, list available admin usernames to help the user
  if (!usernameArg || !newPasswordArg) {
    console.log('\n--- Admin Password Reset Utility ---');
    console.log('Usage: node scripts/reset-admin-password.js <admin_username> <new_password (min 12 chars)>');
    console.log('Example: node scripts/reset-admin-password.js admin "NewAdminPass@2026"\n');
    
    try {
      const [admins] = await pool.query('SELECT id, username, name, email FROM admins');
      if (admins.length === 0) {
        console.log('No admin accounts found in the database. Use create-admin.js to create one.');
      } else {
        console.log('Existing Admin Accounts:');
        admins.forEach(a => console.log(`  - Username: "${a.username}" | Name: "${a.name}"`));
      }
    } catch (err) {
      console.error('Error fetching admin accounts:', err.message);
    }
    console.log('');
    process.exit(0);
  }

  const username = usernameArg.toLowerCase().trim();
  const newPassword = String(newPasswordArg).trim();

  if (newPassword.length < 8) {
    console.error('Error: New password must be at least 8 characters (12+ recommended for admin).');
    process.exit(1);
  }

  const [admins] = await pool.query('SELECT id, username, name FROM admins WHERE LOWER(username) = ?', [username]);
  if (admins.length === 0) {
    console.error(`Error: Admin account with username "${username}" not found.`);
    process.exit(1);
  }

  const admin = admins[0];
  const hash = await bcrypt.hash(newPassword, 12);

  await pool.query(
    'UPDATE admins SET password = ?, token_version = COALESCE(token_version, 1) + 1, updated_at = NOW() WHERE id = ?',
    [hash, admin.id]
  );

  console.log(`\nSuccess! Password for admin "${admin.username}" (${admin.name}) has been reset successfully.`);
  console.log('All previous sessions have been revoked. You can now log in with the new password.\n');
  process.exit(0);
})().catch(e => {
  console.error('[reset-admin-password Error]:', e.message);
  process.exit(1);
});
