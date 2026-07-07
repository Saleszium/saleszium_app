FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Expose port 8081 for webpack-dev-server
EXPOSE 8081

# Run both webpack watch (for generating dist/ for sz-app) and webpack serve (for port 8081)
CMD ["sh", "-c", "npm run watch & npm run dev"]
