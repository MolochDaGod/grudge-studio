require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runMigration() {
  console.log('🚀 Running MySQL migration...\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '74.208.155.229',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'grudge_game',
    user: process.env.DB_USER || 'grudge_admin',
    password: process.env.DB_PASSWORD || 'Grudge2026!',
    multipleStatements: true
  });

  try {
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'migrations', '000_complete_schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 Executing schema from 000_complete_schema.sql...\n');
    
    // Execute the SQL
    const [results] = await connection.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify tables were created
    const [tables] = await connection.query(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'grudge_game' 
        AND TABLE_NAME IN ('users', 'accounts', 'auth_tokens', 'battle_arena_stats')
      ORDER BY TABLE_NAME
    `);
    
    console.log('📊 Created tables:');
    tables.forEach(table => {
      console.log(`   ✅ ${table.TABLE_NAME} (${table.TABLE_ROWS} rows)`);
    });
    
    console.log('\n🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
