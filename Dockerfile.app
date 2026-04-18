FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
# Install docker-cli so the Next.js app can execute "docker run" commands for formatting/running code
RUN apk add --no-cache docker-cli

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
# Copy next config files if they exist
COPY --from=builder /app/next.config.* ./ 

ENV NODE_ENV=production
ENV PORT=5050

EXPOSE 5050

CMD ["npm", "start"]
