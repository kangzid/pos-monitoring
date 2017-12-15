const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'sidakaton'
  });

  const conn = await pool.getConnection();
  await conn.query('USE `pos-time`');

  console.log('=== SESSIONS ===');
  const [sessions] = await conn.query('SELECT * FROM `sessions` ORDER BY id DESC LIMIT 20');
  console.log(JSON.stringify(sessions, null, 2));

  console.log('\n=== SUMMARY ===');
  const [summary] = await conn.query(
    'SELECT pos_id, COUNT(*) as count, SUM(duration_seconds) as total FROM `sessions` GROUP BY pos_id'
  );
  console.log(JSON.stringify(summary, null, 2));

  console.log('\n=== ACTIVE SESSIONS ===');
  const [active] = await conn.query('SELECT * FROM `sessions` WHERE status = \'ACTIVE\'');
  console.log(JSON.stringify(active, null, 2));

  await conn.end();
})();