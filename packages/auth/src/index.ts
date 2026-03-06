import { db } from '@grudge/database';
import { users, authTokens } from '@grudge/database';
import { eq, and, gt } from 'drizzle-orm';

export interface UserData {
  userId: string;
  username: string;
  displayName: string;
  isPremium: boolean;
  isGuest: boolean;
  grudgeId: string;
  walletAddress?: string;
  crossmintWalletId?: string;
  crossmintEmail?: string;
}

/**
 * Verify auth token and return user data
 */
export async function verifyAuthToken(token: string): Promise<UserData | null> {
  if (!token) {
    return null;
  }

  try {
    // Find valid token
    const tokenData = await db
      .select({ userId: authTokens.userId })
      .from(authTokens)
      .where(
        and(
          eq(authTokens.token, token),
          gt(authTokens.expiresAt, Date.now())
        )
      )
      .limit(1);

    if (tokenData.length === 0) {
      return null;
    }

    const userId = tokenData[0].userId;

    // Get user data
    const userData = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        isPremium: users.isPremium,
        isGuest: users.isGuest,
        walletAddress: users.walletAddress,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return null;
    }

    const user = userData[0];
    const grudgeId = generateGrudgeId(user.id);

    return {
      userId: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      isPremium: user.isPremium || false,
      isGuest: user.isGuest || false,
      grudgeId,
      walletAddress: user.walletAddress || undefined,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Generate Grudge ID from user UUID
 */
export function generateGrudgeId(userId: string): string {
  return `GRUDGE_${userId.replace(/-/g, '').substring(0, 12).toUpperCase()}`;
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error('Update last login error:', error);
  }
}

/**
 * Update last token used timestamp
 */
export async function updateTokenUsage(token: string): Promise<void> {
  try {
    await db
      .update(authTokens)
      .set({ lastUsedAt: Date.now() })
      .where(eq(authTokens.token, token));
  } catch (error) {
    console.error('Update token usage error:', error);
  }
}

/**
 * Create a new auth token for a user
 */
export async function createAuthToken(
  userId: string,
  tokenType: 'standard' | 'guest' | 'wallet' | 'puter',
  expiryDays: number = 7
): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, '');
  const expiresAt = Date.now() + expiryDays * 24 * 60 * 60 * 1000;

  await db.insert(authTokens).values({
    userId,
    token,
    tokenType,
    expiresAt,
    createdAt: Date.now(),
  });

  return token;
}

/**
 * Revoke an auth token
 */
export async function revokeAuthToken(token: string): Promise<boolean> {
  try {
    const result = await db
      .delete(authTokens)
      .where(eq(authTokens.token, token));
    
    return true;
  } catch (error) {
    console.error('Token revocation error:', error);
    return false;
  }
}

/**
 * Revoke all tokens for a user (logout from all devices)
 */
export async function revokeAllUserTokens(userId: string): Promise<boolean> {
  try {
    await db
      .delete(authTokens)
      .where(eq(authTokens.userId, userId));
    
    return true;
  } catch (error) {
    console.error('Revoke all tokens error:', error);
    return false;
  }
}

/**
 * Clean up expired tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await db
      .delete(authTokens)
      .where(gt(Date.now(), authTokens.expiresAt));
    
    return 0; // MySQL doesn't return affected rows easily in Drizzle
  } catch (error) {
    console.error('Cleanup expired tokens error:', error);
    return 0;
  }
}
