# Multi-stage Dockerfile for Grudge Studio

# Stage 1: Dependencies
FROM node:20-alpine as dependencies
WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine as builder
WORKDIR /app

RUN npm install -g pnpm

COPY . .
COPY --from=dependencies /app/node_modules ./node_modules

RUN pnpm build

# Stage 3: Runtime
FROM node:20-alpine as runtime
WORKDIR /app

RUN npm install -g pnpm

ENV NODE_ENV=production
ENV PORT=5000

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/google-sheets-sync/dist ./packages/google-sheets-sync/dist
COPY --from=builder /app/packages/puter-sync/dist ./packages/puter-sync/dist
COPY --from=builder /app/packages/ui-components/dist ./packages/ui-components/dist
COPY --from=builder /app/apps/warlord-crafting-suite/dist ./apps/warlord-crafting-suite/dist
COPY --from=builder /app/apps/warlord-crafting-suite/public ./apps/warlord-crafting-suite/public

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "apps/warlord-crafting-suite/dist/index.cjs"]
