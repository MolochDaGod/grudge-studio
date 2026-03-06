import express from 'express';
import sql from '../db.cjs';

const router = express.Router();

// Create Crossmint wallet for authenticated user
router.post('/create', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.substring(7);

    // Get user from token
    const tokenData = await sql`
      SELECT user_id FROM auth_tokens 
      WHERE token = ${token} 
      AND expires_at > ${Date.now()}
      LIMIT 1
    `;

    if (tokenData.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const userId = tokenData[0].user_id;

    // Get account info
    const accounts = await sql`
      SELECT id, crossmint_email, crossmint_wallet_id, wallet_address
      FROM accounts
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = accounts[0];

    // Check if wallet already exists
    if (account.crossmint_wallet_id) {
      return res.status(200).json({
        success: true,
        walletId: account.crossmint_wallet_id,
        walletAddress: account.wallet_address,
        email: account.crossmint_email,
        message: 'Wallet already exists'
      });
    }

    // Create Crossmint wallet via API
    const crossmintApiKey = process.env.CROSSMINT_API_KEY;

    if (!crossmintApiKey) {
      return res.status(500).json({ error: 'Crossmint not configured' });
    }

    // Call Crossmint API to create server-side wallet
    const crossmintResponse = await fetch('https://api.crossmint.com/v1/wallets', {
      method: 'POST',
      headers: {
        'X-API-KEY': crossmintApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'solana-mpc-wallet',
        linkedUser: account.crossmint_email || `user_${userId}`
      })
    });

    if (!crossmintResponse.ok) {
      const error = await crossmintResponse.text();
      console.error('Crossmint API error:', error);
      return res.status(500).json({ error: 'Failed to create wallet' });
    }

    const walletData = await crossmintResponse.json();

    // Update account with Crossmint wallet info
    await sql`
      UPDATE accounts
      SET 
        crossmint_wallet_id = ${walletData.id},
        wallet_address = ${walletData.address},
        wallet_type = ${'crossmint'},
        updated_at = ${Date.now()}
      WHERE id = ${account.id}
    `;

    return res.status(201).json({
      success: true,
      walletId: walletData.id,
      walletAddress: walletData.address,
      email: account.crossmint_email,
      message: 'Crossmint wallet created successfully'
    });

  } catch (error) {
    console.error('Create Crossmint wallet error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
