import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import sql from '../db.cjs';
import { generateGrudgeId, updateLastLogin } from '../auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    // Check if username exists
    const existing = await sql`
      SELECT id FROM users WHERE username = ${username} LIMIT 1
    `;

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const users = await sql`
      INSERT INTO users (
        id,
        username,
        password,
        email,
        display_name,
        created_at,
        last_login_at
      )
      VALUES (
        ${crypto.randomUUID()},
        ${username},
        ${passwordHash},
        ${email || null},
        ${username},
        ${Date.now()},
        ${Date.now()}
      )
      RETURNING id, username, display_name
    `;

    const user = users[0];
    const grudgeId = generateGrudgeId(user.id);
    const crossmintEmail = email || `${username}@grudgewarlords.com`;

    // Create default account
    const accounts = await sql`
      INSERT INTO accounts (
        id,
        user_id,
        display_name,
        gold,
        premium_currency,
        gbux_balance,
        account_xp,
        crossmint_email,
        created_at,
        updated_at
      )
      VALUES (
        ${crypto.randomUUID()},
        ${user.id},
        ${username + "'s Account"},
        ${1000},
        ${0},
        ${0},
        ${0},
        ${crossmintEmail},
        ${Date.now()},
        ${Date.now()}
      )
      RETURNING id
    `;

    const accountId = accounts[0].id;

    // Create Crossmint wallet if API key is configured
    let walletAddress = null;
    let crossmintWalletId = null;
    
    if (process.env.CROSSMINT_API_KEY) {
      try {
        const crossmintResponse = await fetch('https://api.crossmint.com/v1/wallets', {
          method: 'POST',
          headers: {
            'X-API-KEY': process.env.CROSSMINT_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'solana-mpc-wallet',
            linkedUser: crossmintEmail
          })
        });

        if (crossmintResponse.ok) {
          const walletData = await crossmintResponse.json();
          walletAddress = walletData.address;
          crossmintWalletId = walletData.id;

          // Update account with wallet info
          await sql`
            UPDATE accounts
            SET 
              crossmint_wallet_id = ${walletData.id},
              wallet_address = ${walletData.address},
              wallet_type = ${'crossmint'},
              updated_at = ${Date.now()}
            WHERE id = ${accountId}
          `;
        }
      } catch (walletError) {
        console.error('Crossmint wallet creation failed:', walletError);
        // Continue registration without wallet
      }
    }

    // Generate auth token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

    await sql`
      INSERT INTO auth_tokens (
        id,
        user_id,
        token,
        token_type,
        expires_at,
        created_at
      )
      VALUES (
        ${crypto.randomUUID()},
        ${user.id},
        ${token},
        ${'standard'},
        ${expiresAt},
        ${Date.now()}
      )
    `;

    return res.status(201).json({
      success: true,
      token,
      userId: user.id,
      accountId,
      grudgeId,
      username: user.username,
      displayName: user.display_name,
      crossmintEmail,
      walletAddress,
      crossmintWalletId,
      expiresAt
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const users = await sql`
      SELECT id, username, password, display_name, is_premium
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate auth token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO auth_tokens (
        id,
        user_id,
        token,
        token_type,
        expires_at,
        created_at
      )
      VALUES (
        ${crypto.randomUUID()},
        ${user.id},
        ${token},
        ${'standard'},
        ${expiresAt},
        ${Date.now()}
      )
    `;

    // Update last login
    await updateLastLogin(user.id);

    // Get account info
    const accounts = await sql`
      SELECT id, crossmint_email, crossmint_wallet_id, wallet_address
      FROM accounts
      WHERE user_id = ${user.id}
      LIMIT 1
    `;

    const account = accounts.length > 0 ? accounts[0] : null;
    const grudgeId = generateGrudgeId(user.id);

    return res.status(200).json({
      success: true,
      token,
      userId: user.id,
      accountId: account?.id,
      grudgeId,
      username: user.username,
      displayName: user.display_name,
      isPremium: user.is_premium,
      crossmintEmail: account?.crossmint_email,
      crossmintWalletId: account?.crossmint_wallet_id,
      walletAddress: account?.wallet_address,
      expiresAt
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Guest login
router.post('/guest', async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID required' });
    }

    const guestUsername = `guest_${deviceId}`;

    // Check if guest already exists
    let user;
    const existing = await sql`
      SELECT id, username, display_name FROM users
      WHERE username = ${guestUsername}
      LIMIT 1
    `;

    if (existing.length > 0) {
      user = existing[0];
    } else {
      // Create new guest user
      const users = await sql`
        INSERT INTO users (
          id,
          username,
          password,
          display_name,
          is_guest,
          created_at,
          last_login_at
        )
        VALUES (
          ${crypto.randomUUID()},
          ${guestUsername},
          ${'guest'},
          ${'Guest ' + deviceId.substring(0, 8)},
          ${true},
          ${Date.now()},
          ${Date.now()}
        )
        RETURNING id, username, display_name
      `;

      user = users[0];

      // Create guest account
      await sql`
        INSERT INTO accounts (
          id,
          user_id,
          display_name,
          gold,
          premium_currency,
          gbux_balance,
          account_xp,
          created_at,
          updated_at
        )
        VALUES (
          ${crypto.randomUUID()},
          ${user.id},
          ${'Guest Account'},
          ${500},
          ${0},
          ${0},
          ${0},
          ${Date.now()},
          ${Date.now()}
        )
      `;
    }

    // Generate guest token (30 day expiry)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO auth_tokens (
        id,
        user_id,
        token,
        token_type,
        expires_at,
        created_at
      )
      VALUES (
        ${crypto.randomUUID()},
        ${user.id},
        ${token},
        ${'guest'},
        ${expiresAt},
        ${Date.now()}
      )
    `;

    await updateLastLogin(user.id);

    const grudgeId = generateGrudgeId(user.id);

    return res.status(200).json({
      success: true,
      token,
      userId: user.id,
      grudgeId,
      username: user.username,
      displayName: user.display_name,
      isGuest: true,
      expiresAt
    });

  } catch (error) {
    console.error('Guest login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token
router.post('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.substring(7);
    const { verifyAuthToken } = require('../auth.js');
    const userData = await verifyAuthToken(token);

    if (!userData) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    return res.status(200).json({
      valid: true,
      ...userData
    });

  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
