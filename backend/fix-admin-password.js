import db from './src/config/database.js';
import bcryptjs from 'bcryptjs';

async function fixAdminPassword() {
  try {
    console.log('Fixing admin user password...');

    // Generate proper bcrypt hash for "admin123"
    const hashedPassword = await bcryptjs.hash('admin123', 10);
    console.log('Generated hash:', hashedPassword);

    // Update admin user with correct password hash
    await db('users')
      .where({ email: 'admin@workzen.com' })
      .update({ 
        password: hashedPassword,
        full_name: 'Admin User'
      });

    console.log('✓ Admin password updated successfully');

    // Verify
    const user = await db('users')
      .where({ email: 'admin@workzen.com' })
      .select('email', 'full_name', 'password', 'role', 'is_active')
      .first();

    console.log('✓ Updated admin user:', {
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      password: '***[hashed]***'
    });

    // Test the password
    const testPassword = await bcryptjs.compare('admin123', user.password);
    console.log('✓ Password verification test:', testPassword ? 'PASS' : 'FAIL');

    if (testPassword) {
      console.log('\n✅ All tests passed! You can now login with:');
      console.log('   Email: admin@workzen.com');
      console.log('   Password: admin123');
    }

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

fixAdminPassword();
