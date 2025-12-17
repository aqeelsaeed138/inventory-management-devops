# Backend/Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create public directory if it doesn't exist
RUN mkdir -p /app/public

# Expose the port
EXPOSE 5000

# Start the application from src folder
CMD ["node", "src/index.js"]