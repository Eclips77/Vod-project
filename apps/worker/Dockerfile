# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build worker

# Stage 2: Production
FROM node:18-alpine

WORKDIR /usr/src/app

# Install FFmpeg for video processing
RUN apk update && apk add --no-cache ffmpeg

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist/apps/worker ./dist/apps/worker
COPY --from=builder /usr/src/app/dist/libs ./dist/libs

# Start the application
CMD ["node", "dist/apps/worker/main"]
