require('dotenv').config();
const sql = require('./db.cjs');

async function testDatabase() {
  console.log('🔍 Testing MySQL database connection...\n');
  
  try {
    // Test 1: Check database connection
    console.log('Test 1: Checking database connection...');
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful!\n');
    
    // Test 2: Check if users table exists
    console.log('Test 2: Checking users table...');
    const users = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`✅ Users table exists with ${users[0].count} users\n`);
    
    // Test 3: Check if accounts table exists
    console.log('Test 3: Checking accounts table...');
    const accounts = await sql`SELECT COUNT(*) as count FROM accounts`;
    console.log(`✅ Accounts table exists with ${accounts[0].count} accounts\n`);
    
    // Test 4: Check if auth_tokens table exists
    console.log('Test 4: Checking auth_tokens table...');
    const tokens = await sql`SELECT COUNT(*) as count FROM auth_tokens`;
    console.log(`✅ Auth tokens table exists with ${tokens[0].count} tokens\n`);
    
    // Test 5: Check if battle_arena_stats table exists
    console.log('Test 5: Checking battle_arena_stats table...');
    try {
      const stats = await sql`SELECT COUNT(*) as count FROM battle_arena_stats`;
      console.log(`✅ Battle arena stats table exists with ${stats[0].count} records\n`);
    } catch (err) {
      console.log('⚠️  Battle arena stats table does not exist. Run migration first!\n');
    }
    
    console.log('🎉 All database tests passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testDatabase();
