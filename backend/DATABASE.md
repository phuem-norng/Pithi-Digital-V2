# Database Setup - Prisma & PostgreSQL

This document outlines the database configuration and setup for Pithi Digital using Prisma ORM and PostgreSQL.

## 📋 Quick Summary

- **ORM:** Prisma v7.5.0
- **Database:** PostgreSQL 16
- **Schema Location:** `prisma/schema.prisma`
- **Migrations:** `prisma/migrations/`
- **Generated Client:** `node_modules/.prisma/client/`

## 🏗️ Database Schema

### Models

#### 1. **User**
```
- id (UUID/CUID)
- email (unique)
- name
- password (hashed)
- role (USER | ADMIN)
- createdAt, updatedAt
- Relations: 1-to-many Events
```

#### 2. **Event**
```
- id (UUID/CUID)
- title
- type (WEDDING | BIRTHDAY | CEREMONY | HOUSEWARMING | OTHER)
- date
- location
- description (optional)
- coverImage (optional)
- userId (FK → User)
- createdAt, updatedAt
- Relations: many-to-one User, 1-to-many Guests/Invitations/Templates
```

#### 3. **Guest**
```
- id (UUID/CUID)
- name
- email (optional)
- phone (optional)
- status (PENDING | ACCEPTED | DECLINED)
- eventId (FK → Event)
- createdAt, updatedAt
- Relations: many-to-one Event, 1-to-one Invitation
```

#### 4. **Invitation**
```
- id (UUID/CUID)
- uniqueLink (unique URL per guest)
- qrCode (optional)
- eventId (FK → Event)
- guestId (FK → Guest, unique)
- createdAt, updatedAt
- Relations: many-to-one Event/Guest
```

#### 5. **Template**
```
- id (UUID/CUID)
- name
- design (JSON - storing template design config)
- eventId (FK → Event)
- createdAt, updatedAt
- Relations: many-to-one Event
```

## 🔑 Database Features

✅ **Cascade Deletes:** Deleting a user/event automatically deletes related data
✅ **Indexes:** Optimized queries on frequently searched fields
✅ **Constraints:** Unique constraints on email, uniqueLink, etc.
✅ **Enums:** Type-safe status and role fields
✅ **Timestamps:** Automatic createdAt/updatedAt tracking

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure `.env`

```bash
# Copy template
cp .env.example .env

# Edit .env with your PostgreSQL connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pithi_digital_1_1"
NODE_ENV="development"
PORT=3001
JWT_SECRET="your-secret-key"
```

### 3. Run Migration

```bash
# Create and apply migrations
npm run db:migrate

# Or push schema without creating migration (development only)
npm run db:push
```

### 4. Seed Database (Optional)

```bash
npm run db:seed
```

This creates sample data:
- 1 admin user
- 1 wedding event
- 2 test guests
- 2 invitations
- 1 template

## 📚 Common Commands

```bash
# View/Edit database visually in browser
npm run db:studio

# Create a new migration
npm run db:migrate --name feature_name

# Push schema changes without migration (dev only)
npm run db:push

# Reset database (warning: deletes all data)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Validate schema
npx prisma validate
```

## 💻 Using Prisma in NestJS

### 1. Import PrismaModule

```typescript
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  // ...
})
export class AppModule {}
```

### 2. Inject PrismaService

```typescript
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: CreateUserDto) {
    return this.prisma.user.create({
      data,
    });
  }

  async getUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { events: true }, // Eager load relations
    });
  }

  async listEvents(userId: string) {
    return this.prisma.event.findMany({
      where: { userId },
      include: {
        guests: true,
        invitations: true,
      },
    });
  }
}
```

## 🔐 Security Best Practices

1. **Password Hashing:** Always hash passwords before storing
2. **Environment Variables:** Never commit `.env` files
3. **Validation:** Use NestJS `ValidationPipe` with DTOs
4. **Connections:** PrismaService manages 1 connection pool
5. **Migrations:** Version control all migration files

## 🐛 Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
brew services list | grep postgres

# Start PostgreSQL
brew services start postgresql@16

# Test connection
psql -h localhost -U postgres -d pithi_digital_1_1
```

### "Prisma Client not found"
```bash
# Regenerate client
npx prisma generate
```

### "Migration conflicts"
```bash
# Reset database (careful: deletes all data!)
npx prisma migrate reset
```

## 📖 Useful Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma PostgreSQL Setup](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [Database Migration Guide](https://www.prisma.io/docs/orm/prisma-migrate)
- [Prisma Studio](https://www.prisma.io/docs/orm/tools/prisma-studio)

---

**Next Phase:** PHASE 3: Backend Core (NestJS APIs)

Last Updated: March 25, 2026
