FROM node:20-slim

WORKDIR /app

# Install dependencies (dev deps included — needed for the build step)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build frontend + server bundle
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
