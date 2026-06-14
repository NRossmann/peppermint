FROM node:20 AS builder

# Set the working directory inside the container
WORKDIR /app

ARG NEXT_PUBLIC_CLIENT_VERSION
ENV NEXT_PUBLIC_CLIENT_VERSION=$NEXT_PUBLIC_CLIENT_VERSION

RUN apt-get update && \
    apt-get install -y build-essential python3 make g++ pkg-config libssl-dev

RUN corepack enable && corepack prepare yarn@4.2.2 --activate

# Copy the full workspace before install so workspace postinstall scripts
# (notably Prisma generate in apps/api) have access to their source files.
COPY package.json yarn.lock turbo.json .yarnrc.yml ./
COPY apps ./apps
COPY packages ./packages
COPY ./ecosystem.config.js ./ecosystem.config.js

RUN yarn install --immutable

RUN yarn workspace api build
RUN yarn workspace client build

FROM node:20 AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/ ./apps/api/
COPY --from=builder /app/apps/client/.next/standalone ./
COPY --from=builder /app/apps/client/.next/static ./apps/client/.next/static
COPY --from=builder /app/apps/client/public ./apps/client/public
COPY --from=builder /app/ecosystem.config.js ./ecosystem.config.js

# Expose the ports for both apps
EXPOSE 3000 5003

# Install PM2 globally
RUN npm install -g pm2

# Start both apps using PM2
CMD ["pm2-runtime", "ecosystem.config.js"]
