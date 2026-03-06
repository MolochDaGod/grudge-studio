#!/bin/bash
# Quick setup script for Grudge Studio

set -e

echo "🚀 Grudge Studio - Quick Setup"
echo "========================================"

# Check Node version
echo "📦 Checking Node.js version..."
node_version=$(node -v)
echo "   Node version: $node_version"

# Install pnpm if needed
if ! command -v pnpm &> /dev/null; then
    echo "📥 Installing pnpm..."
    npm install -g pnpm
fi

pnpm_version=$(pnpm -v)
echo "   pnpm version: $pnpm_version"

# Install dependencies
echo ""
echo "📚 Installing dependencies (this may take 2-3 minutes)..."
pnpm install

# Check if .env.local exists
echo ""
if [ ! -f .env.local ]; then
    echo "⚙️  Creating .env.local from template..."
    cp .env.example .env.local
    echo "   ✅ Created .env.local"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local with your DATABASE_URL before running pnpm db:push"
    echo "   Example: DATABASE_URL=postgresql://user:password@localhost:5432/grudge_studio"
else
    echo "✅ .env.local already exists"
fi

# Type check
echo ""
echo "🔍 Running TypeScript type check..."
pnpm type-check

echo ""
echo "✨ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "   1. Edit .env.local with your DATABASE_URL"
echo "   2. Run: pnpm db:push"
echo "   3. Run: pnpm dev"
echo ""
echo "🌐 Development server will run on http://localhost:5000"
echo ""
echo "📚 Documentation:"
echo "   - Getting started: cat QUICKSTART.md"
echo "   - Deployment: cat docs/DEPLOYMENT.md"
echo "   - Architecture: cat docs/ARCHITECTURE.md"
echo ""
