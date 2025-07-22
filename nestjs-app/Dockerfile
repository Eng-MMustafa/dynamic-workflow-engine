# Build stage
FROM node:24 AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to resolve conflicts
RUN npm config set legacy-peer-deps true && \
    npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:24

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm config set legacy-peer-deps true && \
    npm install --only=production --legacy-peer-deps

# Copy built application from builder
COPY --from=builder /usr/src/app/dist ./dist

# Set proper permissions for the node user
RUN chown -R node:node /usr/src/app

# Switch to non-root user
USER node

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]