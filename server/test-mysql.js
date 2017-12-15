/**
 * Test MySQL Connection
 */
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'sidakaton'
};

async function testConnection() {
  console.log('Testing MySQL Connection...');
  console.log('Config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: '***'
  });
  console.log('');

  let connection;
  try {
    // Try to connect
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to MySQL server!');

    // Get version
    const [version] = await connection.query('SELECT VERSION() as version');
    console.log(`  MySQL Version: ${version[0].version}`);

    // List databases
    const [databases] = await connection.query('SHOW DATABASES');
    console.log('  Databases:', databases.map(d => d.Database).join(', '));

    // Check if pos_time database exists
    const dbExists = databases.some(d => d.Database === 'pos_time');

    if (dbExists) {
      console.log('✓ Database "pos_time" exists');

      // Switch to pos_time and check tables
      await connection.query('USE pos_time');
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`  Tables: ${tables.map(t => Object.values(t)[0]).join(', ')}`);
    } else {
      console.log('⚠ Database "pos_time" not found - will be created on server start');
    }

    console.log('');
    console.log('✓ MySQL connection is working!');
    return true;

  } catch (error) {
    console.error('✗ Connection failed!');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.log('Troubleshooting:');
    console.log('1. Pastikan MySQL service sedang berjalan');
    console.log('2. Cek username/password (root/sidakaton)');
    console.log('3. Cek port MySQL (3306)');
    console.log('');
    console.log('Di Windows, cek service: services.msc');
    return false;

  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();