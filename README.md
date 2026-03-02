# Back Office Management System

A full-stack back-office application for registering and managing users, built with Next.js 15, TypeScript, PostgreSQL, and Redis. The application provides a secure admin dashboard with user management, session tracking, theme customization, and automated end-to-end testing.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Environment Setup](#2-environment-setup)
  - [3. Start Infrastructure](#3-start-infrastructure)
  - [4. Database Setup](#4-database-setup)
  - [5. Run the Application](#5-run-the-application)
- [Running with Docker (Production)](#running-with-docker-production)
- [Default Admin Credentials](#default-admin-credentials)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Sessions](#sessions)
  - [Dashboard](#dashboard)
- [Testing](#testing)
  - [Running E2E Tests](#running-e2e-tests)
  - [CI/CD](#cicd)
- [Domain Rules & Validations](#domain-rules--validations)
- [Environment Variables](#environment-variables)
- [Known Limitations & Future Improvements](#known-limitations--future-improvements)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL 16 (via Prisma 7 ORM) |
| Cache / Token Store | Redis 7 (via ioredis) |
| Auth | JWT (access + refresh tokens via `jose`) |
| UI Components | HeroUI v3 (React) |
| Styling | Tailwind CSS v4 |
| State Management | Redux Toolkit + RTK Query |
| Rich Text Editor | React Quill |
| API Docs | Swagger UI (via `next-swagger-doc`) |
| Testing | Playwright 1.58 |
| Containerization | Docker + Docker Compose |

---

## Features

- **Authentication** - Sign up and sign in with JWT-based sessions (access token: 5 min, refresh token: 24 h). Automatic token refresh via Redis token store.
- **Route Protection** - Middleware (`proxy.ts`) redirects unauthenticated users to `/auth/signin` and authenticated users away from auth pages.
- **User Management Dashboard** - List all users (6 per page with pagination), create, update, and delete users. The current admin is excluded from their own user list.
- **Session Management** - View all user sessions with status indicators; terminate active sessions.
- **Role-Based Access Control** - `admin` role has full access to user management and content editing. `user` role has read-only dashboard access.
- **Content Editor** - Admins can edit homepage rich-text content via a WYSIWYG editor; regular users see the published result.
- **Theme Customization** - Light / dark mode toggle persisted to the user's browser across sessions.
- **Swagger API Docs** - Interactive API documentation available at `/api-doc`.
- **Automated E2E Tests** - Playwright test suite covering UI flows and API contract tests.

---

## Architecture Overview

```
Browser
  │
Next.js App Router (port 3000)
  |── /app/api/**          <- REST API routes (server-side, no separate backend)
  |── /app/(dashboard)     <- Protected root redirect page
  |── /app/auth/**         <- Sign-in / Sign-up pages
  |── /app/dashboard/**    <- Admin UI pages
  |── /app/api-doc         <- Swagger UI
         │
         |── Prisma ORM -> PostgreSQL  (users, sessions, homepage content)
         |── ioredis    -> Redis       (JWT token allowlist / refresh token store)
```

All API logic lives inside Next.js Route Handlers - there is no separate Node.js backend process. The app is a monorepo.

---

## Project Structure

```
.
|── app/
│   |── (dashboard)/          # Root redirect page (-> /dashboard)
│   |── api/
│   │   |── auth/             # signin, signup, signout, me, refresh
│   │   |── users/            # list, create, update, remove, sessions
│   │   |── dashboard/        # homepage content CRUD
│   |── auth/                 # Sign-in and Sign-up UI pages
│   |── components/           # Shared React components
│   │   |── Dashboard/        # Main dashboard component
│   │   |── providers/        # Auth, Theme, and Redux providers
│   |── dashboard/
│       |── users/            # User list, create, update, sessions pages
|── config/
│   |── index.ts              # Zod-validated environment config
|── infra/
│   |── docker-compose.yaml       # Production stack
│   |── docker-compose.dev.yaml   # Development (DB + Redis only)
│   |── docker-compose.test.yaml  # Test environment (DB + Redis only)
|── lib/
│   |── authMiddleware.ts     # JWT verification middleware
│   |── jwt.ts                # Token sign/verify helpers
│   |── prisma.ts             # Prisma client singleton
│   |── redis.ts              # Redis client
│   |── tokenStore.ts         # Refresh token allow-list (Redis)
│   |── validators/           # Zod schemas for request validation
|── prisma/
│   |── schema.prisma         # Database schema
│   |── migrations/           # Prisma migration history
│   |── seed/                 # Admin user + sample data seeding
|── store/
│   |── index.ts              # Redux store
│   |── api/                  # RTK Query API slices
|── tests/
│   |── auth.setup.ts         # Playwright auth setup (saves session)
│   |── users-list.spec.ts    # UI tests for user management
│   |── api/
│       |── users.spec.ts     # API contract tests
|── .env.example              # Example environment variables
|── .env.test.example         # Example test environment variables
|── Dockerfile                # Multi-stage production Docker build
|── playwright.config.ts      # Playwright configuration
|── proxy.ts                  # Next.js middleware (route protection)
```

---

## Prerequisites

- **Node.js** 22+
- **npm** 10+
- **Docker** and **Docker Compose** (for local infrastructure)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/elshadaghazade/backofficemanagement.git
cd backofficemanagement
```

### 2. Environment Setup

Copy the example environment file and fill in the values:

```bash
cp .env.example .env.development
```

Edit `.env.development`:

```env
POSTGRES_DB=backofficemanagement
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/backofficemanagement"

REDIS_PORT=6379
REDIS_URL="redis://localhost:6379"

# Generate strong secrets for production - any random string works for local dev
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
AUTH_SECRET=your_auth_secret_here

NEXTAUTH_URL=http://localhost:3000
```

### 3. Start Infrastructure

Start PostgreSQL and Redis in the background:

```bash
npm run docker
```

This uses `infra/docker-compose.dev.yaml` and starts:
- **PostgreSQL 16** on port `5432`
- **Redis 7** on port `6379`
- **RedisInsight** (Redis GUI) on port `5540` -> http://localhost:5540

### 4. Database Setup

Install dependencies, generate the Prisma client, run migrations, and seed the database:

```bash
npm install
npm run generate       # generates Prisma client
npm run migrate:dev    # runs migrations
npm run seed           # creates admin user + sample data
```

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running with Docker (Production)

To run the entire stack (app + PostgreSQL + Redis) with a single command:

```bash
docker compose -f infra/docker-compose.yaml up -d --build
```

The application will be available at [http://localhost:3000](http://localhost:3000).

This will automatically:
- Build the Next.js app using the multi-stage `Dockerfile`
- Start PostgreSQL and Redis with health checks
- Run `prisma migrate deploy` on startup

> **Note:** The production compose file contains hardcoded secrets for convenience. Replace them before any real deployment.

---

## Default Admin Credentials

The database seed creates a default admin account:

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `admin` |
| Role | `admin` |

---

## API Reference

Interactive Swagger documentation is available at:

```
http://localhost:3000/api-doc
```

### Authentication

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user | No |
| `POST` | `/api/auth/signin` | Sign in, receive access + refresh tokens | No |
| `POST` | `/api/auth/signout` | Terminate the current session | Yes |
| `GET` | `/api/auth/me` | Get the current authenticated user | Yes |
| `POST` | `/api/auth/refresh` | Exchange a refresh token for a new access token | No (uses httpOnly cookie) |

All protected endpoints expect a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Users

> All user endpoints require `admin` role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users?page=0` | List users (6 per page, excludes current admin) |
| `GET` | `/api/users/[userId]` | Get a single user by ID |
| `POST` | `/api/users/create` | Create a new user |
| `PUT` | `/api/users/update/[userId]` | Update a user's information |
| `DELETE` | `/api/users/remove/[userId]` | Delete a user |

### Sessions

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users/sessions?page=0` | List all sessions (admin only) | Yes (admin) |
| `POST` | `/api/users/sessions/create/[userId]` | Create a session for a user | Yes |
| `POST` | `/api/users/sessions/terminate/[sessionId]` | Terminate a session | Yes (admin) |

### Dashboard

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/dashboard` | Get homepage content | Yes |
| `PUT` | `/api/dashboard` | Update homepage content | Yes (admin only) |

---

## Testing

### Running E2E Tests

The full E2E suite spins up dedicated Docker containers (PostgreSQL + Redis), applies migrations, seeds data, starts the Next.js dev server, runs all Playwright tests, and then tears everything down:

```bash
# Copy the test environment file first
cp .env.test.example .env.test

# Run the full suite
npm run e2e
```

To run tests against an already-running dev server:

```bash
npx playwright test
```

To open the interactive Playwright UI:

```bash
npx playwright test --ui
```

To view the HTML report after a run:

```bash
npx playwright show-report
```

### Test Structure

```
tests/
|── auth.setup.ts          # Logs in as admin once and saves auth state to disk
│                          # All subsequent tests reuse this saved session
|── users-list.spec.ts     # UI tests: table rendering, navigation, delete confirmation
|── api/
    |── users.spec.ts      # API contract tests:
                           #   - Role-based access (admin vs user)
                           #   - Pagination shape and field validation
                           #   - Admin is excluded from user list
                           #   - Dashboard content RBAC
                           #   - Password validation (422 response)
```

### CI/CD

A GitHub Actions workflow (`.github/workflows/playwright.yml`) runs the full E2E suite automatically on every push and pull request to `main`/`master`. Playwright reports are uploaded as artifacts and retained for 30 days.

---

## Domain Rules & Validations

These rules are enforced at the API layer:

- **Creation time** (`createdAt`) is immutable - it cannot be updated via the API.
- **Last update time** (`updatedAt`) is automatically set on every update via Prisma.
- **Inactive users** cannot have their `firstName` or `lastName` updated.
- **Inactive users** cannot create new sessions.
- **Passwords** must meet strength requirements (validated via Zod - min length, complexity).
- **Sign-up** requires matching password confirmation, verified on the frontend before the API call.
- **JWT access tokens** expire in **5 minutes**; **refresh tokens** expire in **24 hours**.
- Refresh tokens are stored in Redis and invalidated on sign-out, preventing reuse after logout.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `POSTGRES_DB` | PostgreSQL database name | `backofficemanagement` |
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `DATABASE_URL` | Full Prisma connection string | `postgresql://user:pass@localhost:5432/db` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `ACCESS_TOKEN_SECRET` | Secret for signing JWT access tokens | any random string |
| `REFRESH_TOKEN_SECRET` | Secret for signing JWT refresh tokens | any random string |
| `AUTH_SECRET` | NextAuth / session secret | any random string |
| `NEXTAUTH_URL` | Base URL of the application | `http://localhost:3000` |

---

## Known Limitations & Future Improvements

- **No avatar upload** - User avatar management was intentionally excluded per the project requirements.
- **Pagination is 0-indexed at the API level** - The API uses `page=0` as the first page. The UI normalizes this with a `page - 1` offset.
- **No email verification** - Users are activated immediately on signup without email confirmation.
- **Single admin seeded** - The seed creates one hardcoded admin. A proper admin management flow could be added.
- **Access token refresh is client-driven** - The RTK Query base query retries with a refresh token when it receives a 401. A more robust approach could use a Next.js middleware interceptor.
- **No rate limiting** - API routes do not currently enforce rate limits. Adding Redis-based rate limiting on auth endpoints is a recommended next step.
- **RedisInsight exposed in dev** - The Redis GUI is available on port `5540` in development for convenience. This should be disabled or protected in any shared environment.