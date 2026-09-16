# Multi-stage Dockerfile for GhostVault Backend
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npx prisma generate

# Copy source code
COPY src ./src

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "src/index.js"]
