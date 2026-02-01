# Backend - Vercel Serverless Functions

This backend has been converted from Fastify to Vercel Serverless Functions.

## Structure

```
apps/backend/
├── api/                    # Serverless function endpoints
│   ├── _utils.ts          # Shared utilities (CORS, auth)
│   ├── dev.ts             # Local development server (Bun)
│   ├── auth/
│   │   └── [...auth].ts   # Better Auth catch-all route
│   ├── user/
│   │   └── robinhood-token.ts
│   ├── holdings.ts
│   └── debug/
│       └── config.ts
└── src/                   # Shared code
    ├── auth.ts           # Better Auth configuration
    ├── robinhood.ts      # Robinhood API client
    └── db/               # Database setup and schema
```

## API Endpoints

All endpoints are prefixed with `/api`:

- `POST /api/auth/*` - Authentication endpoints (sign-up, sign-in, etc.)
- `PUT /api/user/robinhood-token` - Update Robinhood token (protected)
- `GET /api/holdings` - Get user holdings (protected)
- `GET /api/debug/config` - Debug configuration

## Development

### Local Dev Server

```bash
# From monorepo root (RECOMMENDED)
bunx turbo dev

# Or from backend directory
bun run dev
```

The dev server runs on `http://localhost:3000` and uses **local SQLite** (`sqlite.db`).

## Deployment to Vercel

### Prerequisites

1. **Turso Database** (required for production):
   - Sign up at https://turso.tech
   - Create a new database
   - Get your `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`

2. **Set Environment Variables in Vercel**:
   - `TURSO_DATABASE_URL` - Your Turso database URL
   - `TURSO_AUTH_TOKEN` - Your Turso auth token
   - `FRONTEND_URL` - Your deployed frontend URL
   - `BACKEND_URL` - Your deployed backend URL
   - `BETTER_AUTH_SECRET` - Secret for Better Auth (generate a secure random string)
   - `NODE_ENV=production`

### Deploy

```bash
# From monorepo root
bunx turbo deploy --filter=stonkses-backend

# Or from backend directory
bun run deploy
```

### Vercel Project Settings

In your Vercel project dashboard (https://vercel.com):

- **Framework Preset**: `Other`
- **Build Command**: Leave empty (auto-detected)
- **Output Directory**: Leave empty
- **Install Command**: `bun install`
- **Root Directory**: `apps/backend` (if deploying from monorepo)

## Database

### Local Development
- Uses **Bun SQLite** with local file (`sqlite.db`)
- Automatically detected when `NODE_ENV !== "production"`

### Production (Vercel)
- Uses **Turso** (LibSQL cloud database)
- Automatically used when `NODE_ENV === "production"`
- Requires `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` environment variables

### Database Migrations

```bash
# Push schema changes to database
bun run db:push

# Open Drizzle Studio (local SQLite only)
bun run db:studio
```

For Turso in production, set the environment variables locally and run:

```bash
NODE_ENV=production bun run db:push
```

## Environment Variables

### Required for Production (Vercel)

- `NODE_ENV=production`
- `TURSO_DATABASE_URL` - Your Turso database URL
- `TURSO_AUTH_TOKEN` - Your Turso auth token
- `FRONTEND_URL` - Your frontend URL for CORS
- `BACKEND_URL` - Your backend URL for auth callbacks
- `BETTER_AUTH_SECRET` - Secret for Better Auth

### Optional for Development

- `PORT` - Local dev server port (default: 3000)
- `FRONTEND_URL` - Frontend URL (default: http://localhost:5173)
- `BACKEND_URL` - Backend URL (default: http://localhost:3000)

## Troubleshooting

### CORS Errors
Make sure `FRONTEND_URL` and `BACKEND_URL` are set correctly in Vercel environment variables.

### Database Connection Errors
- **Local**: Make sure you have a `sqlite.db` file or run `bun run db:push` to create it
- **Production**: Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set in Vercel

### Runtime Errors
Check the Vercel function logs in the dashboard for detailed error messages.
