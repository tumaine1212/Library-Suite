FROM node:18-slim

# Prisma needs OpenSSL, which the slim image does not include
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
# Install the Prisma CLI, which is a development dependency
RUN npm install

COPY . .

# Generate the Prisma client for this image
RUN npx prisma generate

# Apply database migrations before starting the API
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
