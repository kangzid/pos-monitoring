const mysql = require('mysql2/promise');

async function debug() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'sidakaton'
  });

  const conn = await pool.getConnection();
  await conn.query('USE `pos-time`');

  console.log('=== RAW DATA ===');

  // Check active sessions
  const [active] = await conn.query(
    'SELECT * FROM `sessions` WHERE status = \'ACTIVE\''
  );
  console.log('Active sessions:', active);

  // Check completed today
  const [completed] = await conn.query(
    'SELECT pos_id, start_time, end_time, duration_seconds, status FROM `sessions` WHERE DATE(start_time) = CURDATE()'
  );
  console.log('\nSessions today:', completed);

  // Calculate what API would return
  const [active2] = await conn.query(
    'SELECT pos_id, start_time, TIMESTAMPDIFF(SECOND, start_time, NOW()) as elapsed_seconds FROM `sessions` WHERE status = \'ACTIVE\''
  );

  const [completed2] = await conn.query(
    'SELECT pos_id, COUNT(*) as sessions_count, SUM(duration_seconds) as total_seconds FROM `sessions` WHERE status = \'COMPLETED\' AND DATE(start_time) = CURDATE() GROUP BY pos_id'
  );

  console.log('\n=== API CALCULATION ===');
  for (let i = 1; i <= 5; i++) {
    const activeData = active2.find(s => s.pos_id === i);
    const completedData = completed2.find(s => s.pos_id === i);

    let totalSeconds = completedData ? (completedData.total_seconds || 0) : 0;
    if (activeData) {
      totalSeconds += activeData.elapsed_seconds;
    }

    console.log(`POS ${i}:`);
    console.log(`  active: ${!!activeData}`);
    console.log(`  elapsed_seconds: ${activeData ? activeData.elapsed_seconds : 0}`);
    console.log(`  sessions_today: ${completedData ? completedData.sessions_count : 0}`);
    console.log(`  total_seconds_today: ${totalSeconds}`);
  }

  // Calculate grand totals
  let totalSessions = 0;
  let totalTime = 0;
  for (let i = 1; i <= 5; i++) {
    const completedData = completed2.find(s => s.pos_id === i);
    const activeData = active2.find(s => s.pos_id === i);

    if (completedData) {
      totalSessions += completedData.sessions_count;
      totalTime += completedData.total_seconds || 0;
    }
    if (activeData) {
      totalTime += activeData.elapsed_seconds;
    }
  }

  console.log('\n=== GRAND TOTALS ===');
  console.log(`Total Sessions: ${totalSessions}`);
  console.log(`Total Duration: ${totalTime} seconds (${Math.floor(totalTime/3600)}h ${Math.floor((totalTime%3600)/60)}m)`);

  await conn.end();
}

debug().catch(console.error);