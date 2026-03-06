# Contributing to Grudge Studio

Thank you for your interest in contributing to Grudge Studio! This document provides guidelines for contributing to the monorepo.

## Getting Started

### Prerequisites
- Node.js 20 or higher
- pnpm 8 or higher
- PostgreSQL 13+ (for database work)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/GrudgeDaDev/grudge-studio.git
cd grudge-studio
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Set up database:
```bash
pnpm db:push
```

5. Start development:
```bash
pnpm dev
```

## Project Structure

### Adding Features

**Principle**: Changes should be consolidated, not duplicated.

#### Step 1: Update Shared Schema
If your feature requires data structures:

```typescript
// packages/shared/src/schema.ts
export const myFeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  // ...
});
```

#### Step 2: Update Database Schema
If you need persistence:

```typescript
// packages/database/src/schema.ts
export const myFeatures = pgTable('my_features', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  // ...
});
```

#### Step 3: Implement API Routes
Add endpoints to Warlord:

```typescript
// apps/warlord-crafting-suite/server/routes.ts
app.get("/api/my-feature/:id", async (req, res) => {
  // Implementation
});
```

#### Step 4: Build & Test
```bash
pnpm build
pnpm type-check
pnpm test
```

## Code Style

### TypeScript
- Use strict mode (enabled in tsconfig)
- Prefer interfaces over types for object shapes
- Use const assertions for constants
- Document complex logic with comments

### File Organization
```
packages/my-package/
├── src/
│   ├── index.ts         # Exports
│   ├── schema.ts        # Zod schemas
│   ├── types.ts         # TypeScript types
│   ├── utils.ts         # Utilities
│   └── ...
├── package.json
├── tsconfig.json
└── README.md
```

### Naming Conventions
- Files: `kebab-case` (e.g., `my-feature.ts`)
- Functions: `camelCase`
- Types: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Variables: `camelCase`

### Import Organization
```typescript
// 1. External packages
import { z } from 'zod';
import { pgTable } from 'drizzle-orm/pg-core';

// 2. Internal packages (monorepo)
import { insertCharacterSchema } from '@grudge/shared';

// 3. Local imports
import { storage } from './storage';
```

## Database Changes

### Creating a New Table

1. Define schema in `packages/database/src/schema.ts`:
```typescript
export const myTable = pgTable('my_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const myTableRelations = relations(myTable, ({ one, many }) => ({
  // Define relationships here
}));
```

2. Generate migration:
```bash
pnpm db:generate
```

3. Review the generated migration file

4. Push to database:
```bash
pnpm db:push
```

5. For local testing, use Drizzle Studio:
```bash
pnpm db:studio
```

## Testing

### Running Tests
```bash
pnpm test                 # Run all tests
pnpm test:watch          # Watch mode
pnpm test --ui           # UI mode
```

### Writing Tests
```typescript
// tests/feature.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../src/feature';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

## Commit Messages

Follow conventional commits:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (no logic change)
- `refactor` - Code refactor
- `perf` - Performance improvement
- `test` - Tests
- `chore` - Build, deps, etc.

Example:
```
feat(crafting): add tier 8 recipes

- Add new recipes for tier 8 items
- Update pricing multipliers
- Add to starter recipe set for high-level characters

Closes #42
```

## Pull Request Process

1. Create a feature branch:
```bash
git checkout -b feat/my-feature
```

2. Make changes and commit:
```bash
git add .
git commit -m "feat(scope): description"
```

3. Push to origin:
```bash
git push origin feat/my-feature
```

4. Create PR on GitHub with:
   - Clear title and description
   - Link to related issues
   - Screenshots if UI changes
   - Summary of testing done

5. Ensure:
   - All checks pass (lint, type-check, tests)
   - No conflicts with main
   - Code review completed

6. Squash and merge

## Troubleshooting

### Dependency Issues
```bash
# Clear and reinstall
pnpm clean
pnpm install
```

### Build Errors
```bash
# Check TypeScript
pnpm type-check

# Check linting
pnpm lint

# Clear cache
rm -rf .turbo
```

### Database Issues
```bash
# Reset to latest schema
pnpm db:push

# Backup and restart
# (Never lose production data!)
```

## Performance Tips

### Development
- Use `pnpm dev:warlord` if only working on main app
- Use `--filter` flag for Turbo to rebuild specific packages
- Enable watch mode for faster iteration

### Building
- Turbo caches builds by default
- Changes to schemas affect all dependent packages
- Check `.turbo/` directory for cache

## Questions?

- Check [Architecture docs](./docs/ARCHITECTURE.md)
- Review existing code for patterns
- Open an issue for discussions
- Ask in project discussions

## License

By contributing, you agree your code will be licensed under MIT.
