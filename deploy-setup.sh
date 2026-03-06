#!/bin/bash
# Grudge Studio Deployment Setup Script
# This script prepares the monorepo for deployment

set -e

echo "🚀 Grudge Studio Deployment Setup"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check Node and pnpm
echo "${YELLOW}Step 1: Checking Node.js and pnpm...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "${RED}Error: Node.js 20+ required. Current: $(node -v)${NC}"
    exit 1
fi
echo "${GREEN}✓ Node.js $(node -v)${NC}"
echo "${GREEN}✓ pnpm $(pnpm -v)${NC}"
echo ""

# Step 2: Install dependencies
echo "${YELLOW}Step 2: Installing dependencies (this may take 5 minutes)...${NC}"
pnpm install --frozen-lockfile
echo "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Create .env.local if needed
echo "${YELLOW}Step 3: Setting up environment...${NC}"
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "${GREEN}✓ Created .env.local from template${NC}"
    echo "${YELLOW}  Please edit .env.local with your DATABASE_URL${NC}"
else
    echo "${GREEN}✓ .env.local already exists${NC}"
fi
echo ""

# Step 4: Type checking
echo "${YELLOW}Step 4: Running TypeScript type check...${NC}"
pnpm type-check
echo "${GREEN}✓ Type checking passed${NC}"
echo ""

# Step 5: Build
echo "${YELLOW}Step 5: Building production artifacts...${NC}"
pnpm build
echo "${GREEN}✓ Build completed successfully${NC}"
echo ""

# Step 6: Summary
echo "${GREEN}=================================="
echo "✓ Deployment preparation complete!"
echo "==================================${NC}"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your DATABASE_URL"
echo "2. Ensure PostgreSQL is running"
echo "3. Run: pnpm db:push (to apply schema)"
echo "4. Choose your deployment platform:"
echo "   - Vercel:  vercel --prod"
echo "   - Railway: railway up"
echo "   - Fly.io:  fly deploy"
echo "   - Docker:  docker-compose up -d"
echo ""
