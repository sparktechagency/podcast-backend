# FROM node:20-alpine AS builder

# WORKDIR /app

# COPY package*.json ./
# RUN npm ci

# COPY tsconfig.json ./
# COPY src ./src

# RUN npm run build

# FROM node:20-alpine

# WORKDIR /app

# COPY --from=builder /app/package*.json ./
# RUN npm ci --production

# COPY --from=builder /app/dist ./dist

# ENV NODE_ENV=production
# EXPOSE 5090

# CMD ["node", "dist/server.js"]


# Dockerfile (for production)

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --production

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 5090

CMD ["node", "dist/server.js"]
