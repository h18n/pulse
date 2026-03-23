# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Run as non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts from builder
COPY --from=builder --chown=nodeuser:nodejs /app/dist ./dist

USER nodeuser

EXPOSE 3001

CMD ["npm", "run", "start"]
