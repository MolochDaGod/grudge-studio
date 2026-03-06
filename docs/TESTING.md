# Testing Guide

Comprehensive guide for testing Grudge Studio across server, client, and shared packages.

## Table of Contents
- [Overview](#overview)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Server Testing](#server-testing)
- [Client Testing](#client-testing)
- [Shared Package Testing](#shared-package-testing)
- [Best Practices](#best-practices)
- [Coverage Goals](#coverage-goals)

---

## Overview

Grudge Studio uses **Vitest** for all testing:
- **Server tests**: Express endpoints with Supertest
- **Client tests**: React components with Testing Library
- **Shared tests**: Schemas and utilities with Zod validation

### Test Structure

```
grudge-studio/
├── __tests__/
│   ├── server/
│   │   ├── api.test.ts       ← Express endpoints
│   │   ├── auth.test.ts      ← Authentication
│   │   └── test-utils.ts     ← Server helpers
│   ├── client/
│   │   ├── components.test.tsx ← React components
│   │   └── test-utils.tsx      ← Client helpers
│   └── integration/           ← End-to-end flows
├── vitest.config.ts
└── vitest.setup.ts
```

---

## Setup

### 1. Install Test Dependencies

```bash
pnpm install
```

This installs:
- `vitest` - Test runner
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - DOM matchers
- `supertest` - HTTP assertions
- `@vitest/ui` - Test UI

### 2. Configure Vitest

Files already created:
- `vitest.config.ts` - Main configuration
- `vitest.setup.ts` - Global setup (mocks, cleanup)

---

## Running Tests

### All Tests
```bash
pnpm test
```

### Specific Test Suites
```bash
# Server tests only
pnpm test:server

# Client tests only
pnpm test:client

# Package tests
pnpm test --filter=@grudge/shared
```

### Watch Mode (Auto-rerun on changes)
```bash
pnpm test:watch
```

### Coverage Report
```bash
pnpm test:coverage
```

### UI Mode (Visual test runner)
```bash
pnpm test --ui
```

---

## Server Testing

### Testing Express Endpoints

Use **Supertest** to test HTTP endpoints without starting a server:

```typescript
import request from 'supertest';
import express from 'express';

describe('Server - Character API', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.post('/api/characters', (req, res) => {
      // Implementation
    });
  });

  it('should create character', async () => {
    const response = await request(app)
      .post('/api/characters')
      .send({ userId: 'user-1', name: 'Hero' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

### Test Utilities

Import from `__tests__/server/test-utils.ts`:

```typescript
import {
  createTestApp,       // Create Express app with middleware
  testEndpoint,        // Helper for testing endpoints
  mockDatabase,        // Mock database responses
  generateMockToken,   // Generate JWT for auth tests
} from './test-utils';
```

### Testing Authentication

```typescript
it('should require valid token', async () => {
  const response = await request(app)
    .get('/api/protected')
    .set('Authorization', `Bearer ${generateMockToken('user-1')}`);

  expect(response.status).toBe(200);
});

it('should reject invalid token', async () => {
  const response = await request(app)
    .get('/api/protected')
    .set('Authorization', 'Bearer invalid-token');

  expect(response.status).toBe(401);
});
```

### Testing Database Operations

```typescript
it('should handle database errors gracefully', async () => {
  // Mock database to throw error
  vi.spyOn(db, 'getCharacter').mockRejectedValueOnce(
    new Error('Database connection failed')
  );

  const response = await request(app).get('/api/characters/123');

  expect(response.status).toBe(500);
  expect(response.body).toHaveProperty('error');
});
```

---

## Client Testing

### Testing React Components

Use **Testing Library** to test components from user perspective:

```typescript
import { renderWithProviders, screen, userEvent } from './test-utils';
import { LoginForm } from '../src/LoginForm';

describe('Client - LoginForm', () => {
  it('should submit form on button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByPlaceholderText('Username'), 'testuser');
    await user.type(screen.getByPlaceholderText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Assert results
    expect(localStorage.setItem).toHaveBeenCalledWith('token', expect.any(String));
  });
});
```

### Test Utilities

Import from `__tests__/client/test-utils.tsx`:

```typescript
import {
  renderWithProviders,  // Render with context providers
  screen,              // Query DOM elements
  userEvent,           // Simulate user interactions
  waitForAsync,        // Wait for async operations
  setupMockFetch,      // Mock API calls
  clearMockFetch,      // Clear mock state
  mockApiResponses,    // Pre-made mock data
} from './test-utils';
```

### Testing User Interactions

```typescript
it('should handle form submission', async () => {
  const user = userEvent.setup();
  renderWithProviders(<MyForm onSubmit={onSubmit} />);

  // Type in input
  await user.type(screen.getByRole('textbox'), 'Some text');

  // Click button
  await user.click(screen.getByRole('button'));

  // Verify callback
  expect(onSubmit).toHaveBeenCalledWith('Some text');
});
```

### Mocking API Calls

```typescript
beforeEach(() => {
  setupMockFetch({
    '/api/characters': [{ id: '1', name: 'Hero' }],
    '/api/inventory': [{ id: '1', itemName: 'Ore', quantity: 10 }],
  });
});

it('should fetch and display data', async () => {
  renderWithProviders(<CharacterList />);

  const heading = await screen.findByText('Hero');
  expect(heading).toBeInTheDocument();
});
```

---

## Shared Package Testing

### Testing Zod Schemas

```typescript
import { insertCharacterSchema } from '@grudge/shared';

describe('Schema - Character', () => {
  it('should validate valid data', () => {
    const result = insertCharacterSchema.safeParse({
      userId: 'user-1',
      name: 'Hero',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid data', () => {
    const result = insertCharacterSchema.safeParse({
      // Missing required fields
    });

    expect(result.success).toBe(false);
  });
});
```

### Testing Utilities

```typescript
import { calculatePrice, validateTier } from '@grudge/shared';

describe('Utilities - Pricing', () => {
  it('should calculate tier multipliers', () => {
    expect(calculatePrice(100, 1)).toBe(100);
    expect(calculatePrice(100, 2)).toBe(250);
    expect(calculatePrice(100, 8)).toBe(16000);
  });

  it('should clamp tier values', () => {
    expect(validateTier(-1)).toBe(1);
    expect(validateTier(10)).toBe(8);
  });
});
```

---

## Best Practices

### 1. Test Naming

Use descriptive test names that explain what is being tested:

```typescript
// ❌ Bad
it('works', () => {});
it('test', () => {});

// ✅ Good
it('should create character with valid data', () => {});
it('should reject character creation without name', () => {});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should update inventory', () => {
  // Arrange: Setup test data
  const character = { id: 'char-1', gold: 100 };
  const item = { name: 'Ore', price: 50 };

  // Act: Perform action
  const result = purchaseItem(character, item);

  // Assert: Verify results
  expect(result.gold).toBe(50);
  expect(result.inventory).toContain(item);
});
```

### 3. Mock External Dependencies

```typescript
// ❌ Bad: Tests real API
it('should fetch character', async () => {
  const char = await api.getCharacter('123');
  expect(char).toBeDefined();
});

// ✅ Good: Mocks API
it('should fetch character', async () => {
  vi.spyOn(api, 'getCharacter').mockResolvedValueOnce({
    id: '123',
    name: 'Hero',
  });

  const char = await getCharacter('123');
  expect(char.name).toBe('Hero');
});
```

### 4. Test One Thing

```typescript
// ❌ Bad: Tests multiple behaviors
it('should create character and send email and update stats', () => {});

// ✅ Good: Single responsibility
it('should create character with default stats', () => {});
it('should send welcome email on character creation', () => {});
it('should update user stats after creation', () => {});
```

### 5. Use beforeEach for Setup

```typescript
describe('Character API', () => {
  let app: express.Express;
  let mockDb: any;

  beforeEach(() => {
    app = createTestApp();
    mockDb = { getCharacter: vi.fn() };
    vi.clearAllMocks();
  });

  it('test 1', () => {});
  it('test 2', () => {});
});
```

### 6. Test Edge Cases

```typescript
describe('Pricing', () => {
  it('should handle minimum tier', () => {
    expect(calculatePrice(100, 1)).toBe(100);
  });

  it('should handle maximum tier', () => {
    expect(calculatePrice(100, 8)).toBe(16000);
  });

  it('should handle tier overflow', () => {
    expect(calculatePrice(100, 10)).toBe(16000); // Clamped to 8
  });
});
```

---

## Coverage Goals

### Target Coverage

| Type | Target |
|------|--------|
| Statements | 80%+ |
| Branches | 75%+ |
| Functions | 80%+ |
| Lines | 80%+ |

### View Coverage Report

```bash
pnpm test:coverage
# Opens coverage/index.html in browser
```

### Critical Paths (100% coverage required)

- ✅ Authentication flows
- ✅ Payment/gold transactions
- ✅ Database schema validation
- ✅ Item pricing calculations
- ✅ Profession progression

---

## Integration Tests (End-to-End)

Test complete user flows:

```typescript
describe('Integration - Character Creation to Crafting', () => {
  it('should create character and craft item', async () => {
    // 1. Register user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ username: 'user', password: 'pass' });

    const token = registerRes.body.token;

    // 2. Create character
    const charRes = await request(app)
      .post('/api/characters')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hero' });

    const characterId = charRes.body.id;

    // 3. Get recipes
    const recipesRes = await request(app)
      .get('/api/recipes')
      .set('Authorization', `Bearer ${token}`)
      .query({ characterId });

    expect(recipesRes.body).toHaveLength(expect.any(Number));
  });
});
```

---

## Debugging Tests

### Run Single Test File
```bash
pnpm test __tests__/server/api.test.ts
```

### Run Tests Matching Pattern
```bash
pnpm test --grep "should create character"
```

### Debug in VS Code

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test", "--inspect-brk"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Verbose Output
```bash
pnpm test --reporter=verbose
```

---

## CI/CD Integration

Tests run automatically on:
- Push to `main`
- Pull requests

View results in GitHub Actions:
- GitHub > Actions > Test workflow

### Failing Tests
1. Check logs in GitHub Actions
2. Run locally: `pnpm test`
3. Fix and push again

---

## Common Issues

### Tests Timeout

```typescript
// Increase timeout for slow tests
it('should process large dataset', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Mock Not Working

```typescript
// Clear mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});
```

### Database Connection Issues

```bash
# Use test database
DATABASE_URL=postgresql://test:test@localhost:5432/test_db pnpm test
```

### Module Not Found

```bash
# Rebuild and reinstall
pnpm clean
pnpm install
```

---

## Resources

- [Vitest Docs](https://vitest.dev)
- [Testing Library Docs](https://testing-library.com)
- [Supertest Docs](https://github.com/visionmedia/supertest)
- [Jest Matchers](https://vitest.dev/api/expect.html)

---

**Happy testing! 🧪**
