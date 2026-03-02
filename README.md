# secure-auth
A learning-focused secure auth system that supports signup, login, refresh, and logout.

# How to run

## 1) Backend
From the repo root (`auth/`):

- Install deps: `npm install`
- Start API: `node backend/app.js`

The backend listens on `http://localhost:3000`.

## 2) Frontend
From `frontend/`:

- Install deps: `npm install`
- Start dev server: `npm run dev`

The frontend runs on `http://localhost:5173` by default.

## 3) Environment variables
The backend reads configuration from `backend/.env`. At minimum you need:

- Database connection: `host`, `user`, `password`, `port`, `database`
- JWT secrets: `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`
- CSRF: `CSRF_SECRET` (must be at least 32 chars; the middleware derives a 32-char key internally)

# How is the system secure?
## **Signup** - Hashing and Parameterized queries
When a user signs up using a username and password, the password is hashed using the *bcrypt* library and stored in a PostgreSQL database. Queries are parameterized to reduce the risk of SQL injection.

## Login - AccessToken, RefreshToken & httpOnly cookies
When a user logs in, the backend issues a JWT *access token* and a JWT *refresh token*.

- The *access token* is returned in JSON and used to access protected routes (sent as `Authorization: Bearer ...`).
- The *refresh token* is stored in an *httpOnly* cookie so it cannot be read by JavaScript. Furthermore, the token is hashed and store in the database.

## Refresh - JWT token rotation
On refresh, the backend issues a new access token and a new refresh token (rotation) and replaces the refresh token stored in the cookie.

## Logout - Cookie clearing
As the user logs out of the system, their cookie containing their *RefreshToken* is cleared.

## CSRF protection & Security headers
State-changing requests are protected against cross-site request forgery (CSRF) using *tiny-csrf*. And security-related HTTP response headers are set using *helmet*.

# API overview

- `GET /csrf-token` → returns `{ csrfToken }`
- `POST /signup` → creates a user
- `POST /login` → returns `{ accessToken, username }` and sets refresh cookie (`jwt`)
- `POST /refresh` → returns `{ accessToken, username }` and rotates refresh cookie (`jwt`)
- `POST /logout` → clears refresh cookie and invalidates it server-side
- `GET /me` → protected route (requires `Authorization: Bearer <accessToken>`)

# Configuration
This project uses environment variables for secrets and DB credentials (see `backend/.env`).

# Motivation behind this project
I wanted to learn backend concepts related to user authentication and web security (e.g. rate limiting, encryption, CSRF protection, and JWT-based auth). The primary focus for this project has been to explore and understand the backend and web security concepts; the frontend is intentionally minimal.

