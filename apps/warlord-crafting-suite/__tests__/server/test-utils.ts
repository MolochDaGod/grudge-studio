import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';

/**
 * Test fixtures and utilities for server testing
 */

export interface TestApp {
  app: Express;
  server: any;
}

/**
 * Create a test Express app with basic middleware
 */
export function createTestApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  return app;
}

/**
 * Helper to test API endpoints
 */
export async function testEndpoint(
  app: Express,
  method: 'get' | 'post' | 'patch' | 'delete',
  path: string,
  body?: any,
  headers?: Record<string, string>
) {
  let req = request(app)[method](path);

  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      req = req.set(key, value);
    }
  }

  if (body) {
    req = req.send(body);
  }

  return req;
}

/**
 * Mock database responses
 */
export const mockDatabase = {
  getCharacter: async (id: string) => ({
    id,
    name: 'Test Character',
    userId: 'test-user',
    level: 1,
    gold: 1000,
  }),

  createCharacter: async (data: any) => ({
    id: 'char-123',
    ...data,
  }),

  getInventory: async (characterId: string) => [
    {
      id: 'inv-1',
      characterId,
      itemName: 'Iron Ore',
      quantity: 10,
      itemType: 'material',
    },
  ],

  updateCharacter: async (id: string, data: any) => ({
    id,
    ...data,
  }),
};

/**
 * Create test context with common setup/teardown
 */
export function setupTestContext() {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  afterAll(() => {
    // Cleanup
  });

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  return { app };
}

/**
 * Generate mock JWT token for auth tests
 */
export function generateMockToken(userId: string = 'test-user'): string {
  // This is a simple JWT-like token for testing
  // In real tests, use actual JWT library
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
    'base64'
  );
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString('base64');
  const signature = 'test_signature';

  return `${header}.${payload}.${signature}`;
}
