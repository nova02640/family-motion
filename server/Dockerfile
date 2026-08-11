FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY shared ./shared
COPY server ./server
RUN npm install --workspace=shared --workspace=server
RUN npm -w shared run build
RUN npm -w server run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/package.json ./package.json
EXPOSE 2567
CMD ["node", "server/dist/index.js"]
