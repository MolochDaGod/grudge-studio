-- ============================================================================
-- GRUDGE STUDIO - COMPLETE DATABASE SCHEMA FOR BATTLE ARENA
-- MySQL Database Setup
-- ============================================================================

USE grudge_game;

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL COMMENT 'bcrypt hashed password',
  email VARCHAR(255) UNIQUE,
  display_name VARCHAR(100),
  is_premium BOOLEAN DEFAULT FALSE,
  is_guest BOOLEAN DEFAULT FALSE,
  
  -- OAuth/External Auth
  wallet_address VARCHAR(100) UNIQUE,
  puter_id VARCHAR(100) UNIQUE,
  
  -- Metadata
  created_at BIGINT NOT NULL,
  last_login_at BIGINT,
  email_verified BOOLEAN DEFAULT FALSE,
  
  INDEX idx_users_username (username),
  INDEX idx_users_email (email),
  INDEX idx_users_wallet (wallet_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User authentication and profile data';

-- ============================================================================
-- 2. ACCOUNTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS accounts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  
  -- Currencies
  gold BIGINT DEFAULT 0,
  premium_currency BIGINT DEFAULT 0,
  gbux_balance BIGINT DEFAULT 0,
  
  -- Progression
  account_xp BIGINT DEFAULT 0,
  account_level INT DEFAULT 1,
  total_playtime_minutes INT DEFAULT 0,
  
  -- Faction
  faction VARCHAR(20) COMMENT 'order, chaos, neutral',
  faction_reputation INT DEFAULT 0,
  
  -- Crossmint Integration
  crossmint_email VARCHAR(255),
  crossmint_wallet_id VARCHAR(100),
  wallet_type VARCHAR(20) COMMENT 'crossmint, phantom, etc',
  
  -- Metadata
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  last_played_at BIGINT,
  home_island BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_accounts_user_id (user_id),
  INDEX idx_accounts_faction (faction)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Game accounts with currencies and progression';

-- ============================================================================
-- 3. AUTH_TOKENS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS auth_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  token_type VARCHAR(20) NOT NULL COMMENT 'standard, guest, wallet, puter',
  
  -- Expiration
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL,
  last_used_at BIGINT,
  
  -- Device/Client Info
  device_info JSON,
  ip_address VARCHAR(45),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tokens_user_id (user_id),
  INDEX idx_tokens_token (token),
  INDEX idx_tokens_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Active authentication tokens for API access';

-- ============================================================================
-- 4. BATTLE_ARENA_STATS TABLE
-- ============================================================================
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

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables were created
SELECT 
  TABLE_NAME, 
  TABLE_ROWS, 
  CREATE_TIME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'grudge_game' 
  AND TABLE_NAME IN ('users', 'accounts', 'auth_tokens', 'battle_arena_stats')
ORDER BY TABLE_NAME;

-- Show table structures
SHOW CREATE TABLE users;
SHOW CREATE TABLE accounts;
SHOW CREATE TABLE auth_tokens;
SHOW CREATE TABLE battle_arena_stats;

SELECT 'Database schema setup complete!' as status;
