# HubSpot Bi-Directional Data Sync Platform

> Enterprise-grade bi-directional data synchronization between HubSpot CRM, Google Sheets, and PostgreSQL database.

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0--beta-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0.0-black.svg)

## 🚀 Quick Start

```bash
# 1. Start Docker services
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Run database migrations
npx prisma db push

# 4. Start development server
npm run dev

# 5. Open application
http://localhost:3000
```

## 📚 Documentation

### Core Documentation

| Document | Description | Status |
|----------|-------------|--------|
| **[Authentication](./CLAUDE-AUTHENTICATION.md)** | User authentication, login, registration, password management | ✅ Complete |
| **[Authorization](./CLAUDE-AUTHORIZATION.md)** | Role-based access control, permissions, security | ✅ Complete |
| **[Setup OAuth](./SETUP-OAUTH.md)** | OAuth configuration for HubSpot & Google | ✅ Complete |

### Features

- ✅ **Email/Password Authentication** - Secure user registration and login
- ✅ **JWT Session Management** - 30-day session expiry
- ✅ **Route Protection** - Middleware-based authorization
- ✅ **Password Hashing** - Bcrypt with 10 salt rounds
- ✅ **Role-Based Access Control** - USER and ADMIN roles
- 🚧 **Profile Management** - Avatar upload, profile editing (In Progress)
- 🚧 **HubSpot Integration** - OAuth and sync engine (In Progress)
- 🚧 **Google Sheets Sync** - Bi-directional sheet sync (In Progress)

## 🛠️ Technology Stack

- **Framework**: Next.js 16.0.0 (App Router, Turbopack)
- **Language**: TypeScript 5.0+
- **Database**: PostgreSQL 15+ (Docker)
- **ORM**: Prisma 5.0+
- **Authentication**: NextAuth.js 4.x
- **Styling**: TailwindCSS 3.4+
- **UI Components**: Radix UI
- **Queue**: BullMQ + Redis
- **API Integration**: @hubspot/api-client, googleapis

## 📦 Services & Ports

| Service | Port | URL | Status |
|---------|------|-----|--------|
| Next.js App | 3000 | http://localhost:3000 | 🟢 Running |
| PostgreSQL | 5432 | localhost:5432 | 🟢 Running |
| Redis | 6379 | localhost:6379 | 🟢 Running |
| Prisma Studio | 5556 | http://localhost:5556 | 🟢 Running |

## 🗄️ Database

**Connection:**
```env
DATABASE_URL="postgresql://hubspot_user:hubspot_password@localhost:5432/hubspot_sync"
```

**Tables:**
- `User` - User accounts and credentials
- `Session` - JWT session tokens
- `Account` - OAuth connections (HubSpot, Google)
- `SyncConfig` - Sync configuration settings
- `FieldMapping` - Field mapping rules
- `SyncJob` - Sync job history
- `SyncLog` - Detailed sync logs
- `Conflict` - Conflict resolution tracking
- And more... (17 models total)

**View Database:**
```bash
npx prisma studio
# Opens at http://localhost:5556
```

## 🔐 Authentication

### Registration

Navigate to http://localhost:3000/register

**Requirements:**
- Valid email address
- Strong password (8+ characters, uppercase, lowercase, number)
- Name (optional)

### Login

Navigate to http://localhost:3000/login

**Features:**
- Email/password authentication
- Remember me (30-day session)
- Password show/hide toggle

**Detailed Documentation**: [CLAUDE-AUTHENTICATION.md](./CLAUDE-AUTHENTICATION.md)

## 🛡️ Authorization

### User Roles

- **USER** (Default) - Manage own resources
- **ADMIN** - Full system access

### Protected Routes

All routes require authentication except `/login` and `/register`.

**Detailed Documentation**: [CLAUDE-AUTHORIZATION.md](./CLAUDE-AUTHORIZATION.md)

## 🔧 Development

### Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://hubspot_user:hubspot_password@localhost:5432/hubspot_sync"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# HubSpot OAuth
HUBSPOT_CLIENT_ID="your_client_id"
HUBSPOT_CLIENT_SECRET="your_client_secret"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma studio        # Open database GUI
npx prisma db push       # Push schema changes
npx prisma migrate dev   # Create migration
npx prisma generate      # Generate Prisma Client

# Docker
docker-compose up -d     # Start services
docker-compose down      # Stop services
docker ps                # Check running containers
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── auth/          # Authentication endpoints
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── profile/           # User profile (planned)
│   ├── sync-configs/      # Sync configuration pages
│   ├── field-mappings/    # Field mapping pages
│   ├── jobs/              # Sync jobs monitoring
│   ├── conflicts/         # Conflict resolution
│   ├── connections/       # OAuth connections
│   └── settings/          # User settings
│
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   ├── ui/               # UI primitives (Radix)
│   └── loading/          # Loading components
│
├── lib/                   # Core libraries
│   ├── auth.ts           # Server-side auth (bcrypt)
│   ├── validation.ts     # Client-side validation
│   ├── prisma.ts         # Prisma client
│   └── redis.ts          # Redis client
│
├── prisma/                # Database
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Migration history
│
├── middleware.ts          # Route protection
└── docker-compose.yml     # Docker services

```

## 🧪 Testing

### Manual Testing

**1. Register a new user:**
```bash
# Visit: http://localhost:3000/register
Email: test@example.com
Password: Test1234!
```

**2. Login:**
```bash
# Visit: http://localhost:3000/login
Email: test@example.com
Password: Test1234!
```

**3. Verify database:**
```bash
npx prisma studio
# Check User table for new entry
```

### Automated Testing (Planned)

```bash
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e          # End-to-end tests
```

## 🚢 Deployment

### Production Checklist

- [ ] Set up cloud database (Railway, Heroku, Supabase)
- [ ] Configure production environment variables
- [ ] Generate secure NEXTAUTH_SECRET
- [ ] Run database migrations
- [ ] Set up Redis for production
- [ ] Configure domain and SSL
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

## 📊 Features Roadmap

### ✅ Completed
- User authentication (email/password)
- JWT session management
- Route protection middleware
- Password strength validation
- User profile dropdown
- Responsive mobile layout
- Database schema design

### 🚧 In Progress
- Profile page with avatar upload
- HubSpot OAuth integration
- Google Sheets sync engine
- Conflict resolution UI

### 📝 Planned
- Email verification
- Password reset flow
- Two-factor authentication
- Admin dashboard
- Audit logging
- Webhook implementation
- Performance monitoring
- Rate limiting

## 🐛 Troubleshooting

### Cannot find middleware module

This is a deprecation warning in Next.js 16. The middleware still works correctly.

### Module not found: Can't resolve 'fs'

Ensure bcrypt is only imported in server-side code. Use `lib/validation.ts` for client-side validation.

### Database connection failed

```bash
# Check if Docker is running
docker ps

# Restart services
docker-compose restart postgres
```

### Session not persisting

Check that `AuthProvider` is wrapping your app in `app/layout.tsx`.

## 📝 License

Private - All Rights Reserved

## 👥 Contributors

Development Team

## 📧 Support

For issues and questions, check the documentation files or contact the development team.

---

**Last Updated**: October 23, 2025
