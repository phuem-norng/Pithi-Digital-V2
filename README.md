# 🎉 Pithi Digital - Digital Invitation Platform

A modern, production-ready digital invitation platform for Cambodian users to create and share event invitations for weddings, birthdays, Buddhist ceremonies, and housewarmings.

## 📋 Project Overview

**Website Purpose:** Beautiful, fast, SEO-friendly, and scalable event invitation system with guest management, RSVP tracking, and QR code check-in.

---

## 🏗️ Architecture

### Technology Stack

| Layer              | Technology                              |
| ------------------ | --------------------------------------- |
| **Frontend**       | Next.js 16+ (App Router, TypeScript)    |
| **Backend**        | NestJS (TypeScript, Clean Architecture) |
| **Database**       | PostgreSQL                              |
| **ORM**            | Prisma                                  |
| **Styling**        | Tailwind CSS + shadcn/ui                |
| **Authentication** | JWT                                     |
| **Storage**        | Cloudinary                              |
| **Deployment**     | Vercel (Frontend) / Render (Backend)   |

---

## 📁 Project Structure

```
Pithi Digital.1.1/
├── frontend/               # Next.js application
│   ├── app/               # App Router pages (TypeScript)
│   ├── components/        # React components + shadcn/ui
│   ├── lib/               # Utilities and helpers
│   ├── public/            # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── components.json    # shadcn/ui config
│   └── .env.example       # Environment template
│
├── backend/               # NestJS application
│   ├── src/
│   │   ├── main.ts        # Entry point
│   │   ├── app.module.ts  # Main module
│   │   ├── auth/          # Authentication module (TBD)
│   │   ├── users/         # Users module (TBD)
│   │   ├── events/        # Events module (TBD)
│   │   ├── guests/        # Guests module (TBD)
│   │   └── invitations/   # Invitations module (TBD)
│   ├── test/              # E2E tests
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example       # Environment template
│
├── .gitignore             # Git ignore rules
├── .git/                  # Version control
└── README.md              # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+ and npm
- PostgreSQL database
- Cloudinary account (for image uploads)

### Setup Instructions

#### 1. **Install Dependencies**

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

#### 2. **Configure Environment Variables**

```bash
# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your API URL

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with database and configuration
```

#### 3. **Database Setup** (Phase 2 - Coming Next)

```bash
cd backend
npx prisma migrate dev --name init
```

#### 4. **Run Development Servers**

```bash
# Terminal 1: Frontend
cd frontend
npm run dev
# Opens at http://localhost:3000

# Terminal 2: Backend
cd backend
npm run start:dev
# Runs at http://localhost:3001
```

---

## 📅 Development Roadmap

### ✅ PHASE 1: Project Initialization (COMPLETED)

- [x] Create Next.js app with TypeScript and Tailwind CSS
- [x] Setup shadcn/ui component library
- [x] Create NestJS backend project
- [x] Configure environment variables
- [x] Setup Git repository

### ⏳ PHASE 2: Database Design (NEXT)

- [ ] Design Prisma schema
- [ ] Create migrations
- [ ] Setup database constraints and indexes

### 🔄 Subsequent Phases

- PHASE 3: Backend Core (NestJS APIs)
- PHASE 4: Frontend Core (Pages & Routing)
- PHASE 5: Invitation System
- PHASE 6: QR Code System
- PHASE 7: File Upload (Cloudinary)
- PHASE 8: SEO & Performance
- PHASE 9: Admin Dashboard
- PHASE 10: Deployment

---

## 🛠️ Development Scripts

### Frontend

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

### Backend

```bash
npm run start     # Production mode
npm run start:dev # Development mode with auto-reload
npm run build     # Build for production
npm run test      # Run tests
```

---

## 📚 Key Features (Roadmap)

1. ✅ User authentication (Register/Login)
2. ✅ Event management (Create/Edit/Delete events)
3. ✅ Guest management (Add guests, RSVP tracking)
4. ✅ Digital invitation page (SEO optimized)
5. ✅ Unique invitation links per guest
6. ✅ QR code check-in system
7. ✅ Image upload (Cloudinary integration)
8. ✅ Admin dashboard (Statistics, guest list)
9. ✅ Mobile responsive UI
10. ✅ Multi-language support (Khmer + English)

---

## 🔐 Security Considerations

- JWT token-based authentication
- Password hashing with bcrypt
- CORS properly configured
- Environment variables for sensitive data
- Input validation with class-validator
- Rate limiting (to be implemented)

---

## 📝 Code Standards

- **Language:** TypeScript (strict mode enabled)
- **Architecture:** Clean Architecture (Controller → Service → Repository)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Prisma ORM with migrations
- **Validation:** class-validator + class-transformer

---

## 🤝 Contributing

Follow these guidelines:

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -m "feat: description"`
3. Push to branch: `git push origin feature/feature-name`
4. Open a pull request

---

## 📞 Support

For issues or questions, please check the documentation or create an issue in the repository.

---

## 📄 License

Private project. All rights reserved.

---

**Next Step:** Proceed to **PHASE 2: Database Design**

Last Updated: March 24, 2026
