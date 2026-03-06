-- Battle Arena Stats Table
-- Run this migration on your MySQL database

CREATE TABLE IF NOT EXISTS battle_arena_stats (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  account_id CHAR(36) NOT NULL,
  total_kills BIGINT DEFAULT 0,
  total_deaths BIGINT DEFAULT 0,
  total_matches BIGINT DEFAULT 0,
  total_playtime_minutes INT DEFAULT 0,
  highest_killstreak INT DEFAULT 0,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_battle_arena_stats_account (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks player statistics for the Battle Arena game mode';
