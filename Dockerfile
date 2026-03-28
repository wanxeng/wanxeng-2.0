FROM node:22-slim

WORKDIR /app

# Install deps first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY . .

# Build
RUN npm run build && npm prune --production

EXPOSE 3001
ENV NODE_ENV=production PORT=3001

CMD ["npm", "start"]
