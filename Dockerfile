FROM node:22-slim

WORKDIR /src

# Set memory limit for build
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --ignore-scripts

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3001

CMD ["npm", "start"]
