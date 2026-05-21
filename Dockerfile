# Use Node.js as the base image
FROM node:20-alpine
# Set the working directory
WORKDIR /app
ENV CI=true
RUN apk update && npm install -g pnpm 

# Copy package files and install dependencies
COPY . . 

RUN pnpm install --no-frozen-lockfile

# Build the Next.js app for production
RUN pnpm next build
# Expose the application port
EXPOSE 3000

# Health check to ensure the application is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1
    
# Start the application
CMD ["pnpm", "next", "start"]