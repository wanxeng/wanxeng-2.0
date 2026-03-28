FROM node:22-alpine

WORKDIR /app

# Install dependencies first (faster caching)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3001

# Start
CMD ["npm", "run", "start"]
