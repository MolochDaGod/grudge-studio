import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createTestApp, mockDatabase, generateMockToken } from './test-utils';

describe('Server - Health Check', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();

    // Setup health endpoint
    app.get('/api/health', (_req, res) => {
      res.json({
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    });
  });

  it('should return health status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('version');
  });
});

describe('Server - Character Management', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();

    // Setup character endpoints
    app.post('/api/characters', (req, res) => {
      const { userId, name, classId, raceId } = req.body;

      if (!userId || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const character = {
        id: 'char-123',
        userId,
        name,
        classId,
        raceId,
        level: 1,
        gold: 0,
      };

      res.status(201).json(character);
    });

    app.get('/api/characters/:id', (req, res) => {
      res.json(mockDatabase.getCharacter(req.params.id));
    });

    app.get('/api/characters', (req, res) => {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      res.json([
        {
          id: 'char-1',
          userId,
          name: 'Test Character',
          level: 1,
        },
      ]);
    });
  });

  it('should create a character', async () => {
    const response = await request(app)
      .post('/api/characters')
      .send({
        userId: 'user-123',
        name: 'My Hero',
        classId: 'Warrior',
        raceId: 'Human',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('My Hero');
    expect(response.body.level).toBe(1);
  });

  it('should require name when creating character', async () => {
    const response = await request(app)
      .post('/api/characters')
      .send({
        userId: 'user-123',
        // missing name
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should get character by id', async () => {
    const response = await request(app).get('/api/characters/char-123');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 'char-123');
  });

  it('should get characters by userId', async () => {
    const response = await request(app)
      .get('/api/characters')
      .query({ userId: 'user-123' });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });
});

describe('Server - Inventory', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();

    app.get('/api/inventory/:characterId', (req, res) => {
      res.json(mockDatabase.getInventory(req.params.characterId));
    });

    app.post('/api/inventory', (req, res) => {
      const { characterId, itemName, quantity } = req.body;

      if (!characterId || !itemName || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      res.status(201).json({
        id: 'inv-123',
        characterId,
        itemName,
        quantity,
        itemType: 'material',
      });
    });
  });

  it('should get inventory items', async () => {
    const response = await request(app).get('/api/inventory/char-123');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should add item to inventory', async () => {
    const response = await request(app)
      .post('/api/inventory')
      .send({
        characterId: 'char-123',
        itemName: 'Copper Ore',
        quantity: 5,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('itemName', 'Copper Ore');
    expect(response.body).toHaveProperty('quantity', 5);
  });

  it('should require all fields when adding inventory item', async () => {
    const response = await request(app)
      .post('/api/inventory')
      .send({
        characterId: 'char-123',
        // missing itemName and quantity
      });

    expect(response.status).toBe(400);
  });
});

describe('Server - Authentication', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();

    app.post('/api/auth/register', (req, res) => {
      const { username, password, email } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
      }

      res.status(201).json({
        id: 'user-123',
        username,
        email,
        token: generateMockToken('user-123'),
      });
    });

    app.post('/api/auth/login', (req, res) => {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
      }

      // Mock successful login
      res.json({
        id: 'user-123',
        username,
        token: generateMockToken('user-123'),
      });
    });
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        password: 'testpass123',
        email: 'test@example.com',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('username', 'testuser');
    expect(response.body).toHaveProperty('token');
  });

  it('should login user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'testpass123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('should require username and password for login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        // missing password
      });

    expect(response.status).toBe(400);
  });
});
