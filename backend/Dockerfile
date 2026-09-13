# Delifast backend — production image
FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

ENV NODE_ENV=production
EXPOSE 4000

# Applies pending migrations, then starts the API. Safe to run on every
# deploy — Prisma no-ops if there's nothing new to migrate.
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
