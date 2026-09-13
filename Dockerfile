# Multi-stage Dockerfile for mcp-relight-harmonize (Glama & Container deployments)
# Stage 1: Build TypeScript source
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source and compile
COPY src/ ./src/
RUN npm run build

# Stage 2: Minimal production runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV OUTPUT_CACHE_DIR=/app/Layers

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist

# Create output cache directory and drop root privileges
RUN mkdir -p /app/Layers && chown -R node:node /app

USER node

ENTRYPOINT ["node", "dist/index.js"]
