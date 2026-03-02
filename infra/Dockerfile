FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/infra/entrypoint.sh ./
COPY --from=builder /app/lib/generated/prisma ./lib/generated/prisma
COPY --from=builder /app/lib/prisma.ts ./lib/
COPY --from=builder /app/config ./config
RUN chmod +x entrypoint.sh
EXPOSE 3000
ENTRYPOINT [ "/bin/sh", "entrypoint.sh" ]
CMD ["node_modules/.bin/next", "start", "-p", "3000"]