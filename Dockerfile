FROM node:22-slim

WORKDIR /src

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (skip scripts to avoid npm update issues)
RUN npm install --ignore-scripts

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3001

# Start the app
CMD ["npm", "start"]
