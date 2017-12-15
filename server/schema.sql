-- Database: pos-time
-- Table: production_logs

CREATE DATABASE IF NOT EXISTS `pos-time`;
USE `pos-time`;

-- Table for storing production time logs
CREATE TABLE IF NOT EXISTS production_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pos_id INT NOT NULL COMMENT 'POS number (1-5)',
    action ENUM('START', 'STOP') NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pos_id (pos_id),
    INDEX idx_timestamp (timestamp)
);

-- Table for tracking current active sessions
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pos_id INT NOT NULL UNIQUE,
    start_time DATETIME NOT NULL,
    end_time DATETIME DEFAULT NULL,
    duration_seconds INT DEFAULT NULL,
    status ENUM('ACTIVE', 'COMPLETED') DEFAULT 'ACTIVE',
    INDEX idx_pos_id (pos_id)
);