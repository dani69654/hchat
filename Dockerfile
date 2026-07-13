# ---- Build stage ----
FROM node:22-slim AS builder

# Chromium comes from apt in the runtime stage; skip Puppeteer's own download.
ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:22-slim AS runner

# Links the GHCR package to the repository.
LABEL org.opencontainers.image.source="https://github.com/dani69654/hchat"

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    HCHAT_NO_SANDBOX=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium \
        ca-certificates \
        fonts-liberation \
        fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./

# whatsapp-web.js writes its web-version cache under the working directory.
RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["npm", "start"]
