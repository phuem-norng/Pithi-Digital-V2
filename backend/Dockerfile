FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install ALL deps including devDependencies
RUN npm install

# Generate Prisma client using local binary
RUN ./node_modules/.bin/prisma generate

COPY . .

# Build NestJS
RUN npm run build

EXPOSE 3001

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main"]
