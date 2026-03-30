# ---- Builder -------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx nx build api

# ---- Runtime -------------------------------------------------
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/api ./dist
COPY package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["node","dist/main.js"]
