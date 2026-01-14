require('dotenv').config();
const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');

async function seedAdmin() {
  try {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
    const fullName = process.env.SEED_ADMIN_NAME || 'System Admin';

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await userRepository.createAdminIfNotExists({
      fullName,
      email,
      passwordHash,
    });

    console.log('Admin user ensured:', {
      id: admin.UserID,
      fullName: admin.FullName,
      email: admin.Email,
      role: admin.Nationality,
    });

    console.log('You can login with:');
    console.log(`  email: ${email}`);
    console.log(`  password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
}

seedAdmin();












