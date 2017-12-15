const express = require('express');
const http = require('http');
const mysql = require('mysql2/promise');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'sidakaton'
};

let pool;
const DB_NAME = 'pos-time';

// Initialize database connection
async function initDatabase() {
  try {
    pool = mysql.createPool(dbConfig);

    // Create database and tables if not exist
    const connection = await pool.getConnection();

    // Create database (use backticks for hyphen)
    await connection.query('CREATE DATABASE IF NOT EXISTS `pos-time`');
    await connection.query('USE `pos-time`');

    // Create production_logs table
    await connection.query(
      'CREATE TABLE IF NOT EXISTS `production_logs` (' +
      'id INT AUTO_INCREMENT PRIMARY KEY,' +
      'pos_id INT NOT NULL,' +
      "action ENUM('START', 'STOP') NOT NULL," +
      'timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
      'INDEX idx_pos_id (pos_id),' +
      'INDEX idx_timestamp (timestamp))'
    );

    // Create sessions table
    await connection.query(
      'CREATE TABLE IF NOT EXISTS `sessions` (' +
      'id INT AUTO_INCREMENT PRIMARY KEY,' +
      'pos_id INT NOT NULL,' +
      'start_time DATETIME NOT NULL,' +
      'end_time DATETIME DEFAULT NULL,' +
      'duration_seconds INT DEFAULT NULL,' +
      "status ENUM('ACTIVE', 'COMPLETED') DEFAULT 'ACTIVE'," +
      'INDEX idx_pos_id (pos_id))'
    );

    // If the old unique constraint still exists, drop it so each POS can have multiple historic sessions.
    try {
      await connection.query('ALTER TABLE `sessions` DROP INDEX `pos_id`');
    } catch (e) {
      // ignore if index doesn't exist
    }
    try {
      await connection.query('ALTER TABLE `sessions` DROP INDEX `idx_pos_id`');
    } catch (e) {
      // ignore if index doesn't exist or already dropped
    }
    try {
      await connection.query('ALTER TABLE `sessions` ADD INDEX idx_pos_id (pos_id)');
    } catch (e) {
      // ignore if index already exists
    }

    connection.release();
    console.log('✓ Database initialized successfully');
    console.log('  Database: ' + DB_NAME);
    console.log('  Tables: production_logs, sessions');
  } catch (error) {
    console.error('Database initialization error:', error.message);
    console.log('Make sure MySQL is running with root/sidakaton@localhost:3306');
  }
}

// Helper: get connection with USE db
async function getConnection() {
  const conn = await pool.getConnection();
  await conn.query('USE `pos-time`');
  return conn;
}

// API: Record button press
app.post('/api/log', async (req, res) => {
  const { pos_id, action } = req.body;

  if (!pos_id || !action || !['START', 'STOP'].includes(action)) {
    return res.status(400).json({ error: 'Invalid pos_id or action' });
  }

  try {
    const connection = await getConnection();

    // Insert into production_logs
    await connection.query(
      'INSERT INTO `production_logs` (pos_id, action) VALUES (?, ?)',
      [pos_id, action]
    );

    // Handle session logic
    if (action === 'START') {
      // End any existing active session for this POS
      await connection.query(
        'UPDATE `sessions` SET status = \'COMPLETED\', end_time = NOW() WHERE pos_id = ? AND status = \'ACTIVE\'',
        [pos_id]
      );

      // Create new active session
      await connection.query(
        'INSERT INTO `sessions` (pos_id, start_time, status) VALUES (?, NOW(), \'ACTIVE\')',
        [pos_id]
      );
    } else if (action === 'STOP') {
      // Calculate duration and complete the session
      await connection.query(
        'UPDATE `sessions` SET status = \'COMPLETED\', end_time = NOW(), duration_seconds = TIMESTAMPDIFF(SECOND, start_time, NOW()) WHERE pos_id = ? AND status = \'ACTIVE\'',
        [pos_id]
      );
    }

    connection.release();

    // Broadcast to all connected clients
    io.emit('update', { pos_id, action, timestamp: new Date() });

    res.json({ success: true, pos_id, action });
  } catch (error) {
    console.error('Error recording log:', error.message || error);
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

// API: Get current sessions status
app.get('/api/sessions', async (req, res) => {
  try {
    const connection = await getConnection();

    const [activeSessions] = await connection.query(
      'SELECT pos_id, start_time, TIMESTAMPDIFF(SECOND, start_time, NOW()) as elapsed_seconds FROM `sessions` WHERE status = \'ACTIVE\''
    );

    const [completedToday] = await connection.query(
      'SELECT pos_id, COUNT(*) as sessions_count, SUM(duration_seconds) as total_seconds FROM `sessions` WHERE status = \'COMPLETED\' AND DATE(start_time) = CURDATE() GROUP BY pos_id'
    );

    connection.release();

    // Build response
    const status = {};
    for (let i = 1; i <= 5; i++) {
      const active = activeSessions.find(s => s.pos_id === i);
      const completed = completedToday.find(s => s.pos_id === i);

      const totalSeconds = (completed ? Number(completed.total_seconds || 0) : 0) + (active ? Number(active.elapsed_seconds || 0) : 0);

      status[i] = {
        active: !!active,
        start_time: active ? active.start_time : null,
        elapsed_seconds: active ? Number(active.elapsed_seconds || 0) : 0,
        sessions_today: completed ? Number(completed.sessions_count || 0) : 0,
        total_seconds_today: totalSeconds
      };
    }

    res.json(status);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// API: Get production history
app.get('/api/history', async (req, res) => {
  try {
    const connection = await getConnection();

    const [logs] = await connection.query(
      'SELECT * FROM `production_logs` ORDER BY timestamp DESC LIMIT 100'
    );

    connection.release();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// API: Clear all data
app.post('/api/clear', async (_req, res) => {
  try {
    const connection = await getConnection();

    // Delete all sessions
    await connection.query('DELETE FROM `sessions`');

    // Delete all logs
    await connection.query('DELETE FROM `production_logs`');

    connection.release();

    // Broadcast to all clients
    io.emit('cleared');

    res.json({ success: true, message: 'All data cleared' });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;

async function start() {
  await initDatabase();

  server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   POS Time Server Running Successfully!   ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log('║   Dashboard: http://localhost:' + PORT + '         ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
    console.log('Waiting for ESP32 button presses...');
  });
}

start();