# Use the official Node.js 24 image
FROM node:24

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3000

# Create base workspace
WORKDIR /workspace

# Copy all files (including nestjs-app/)
COPY . .

# Ensure we're in the right place for installing dependencies
WORKDIR /workspace/nestjs-app

# Install NestJS CLI globally
RUN npm install -g @nestjs/cli

# Set permissions — only needed if changing ownership
RUN chown -R node:node /workspace/nestjs-app

# Switch to non-root user
USER node

# Install dependencies using legacy peer deps
RUN npm install --legacy-peer-deps

# Default command to keep container alive
CMD ["sleep", "infinity"]