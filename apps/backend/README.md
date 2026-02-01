# Backend - Vercel Serverless Functions

This backend has been converted from Fastify to Vercel Serverless Functions using Bun.

## Structure

```
apps/backend/
├── api/                    # Serverless function endpoints
│   ├── _utils.ts          # Shared utilities (CORS, auth)
│   ├── dev.ts             # Local development server
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

```bash
# From monorepo root
bunx turbo dev

# Or from backend directory
bun run dev
```

The dev server runs on `http://localhost:3000`.

## Deployment

```bash
# From monorepo root
bunx turbo deploy --filter=stonkses-backend

# Or from backend directory
bun run deploy
```

## Environment Variables

Required for production:

- `FRONTEND_URL` - Your frontend URL for CORS
- `BACKEND_URL` - Your backend URL for auth callbacks
- `BETTER_AUTH_SECRET` - Secret for Better Auth
- `NODE_ENV` - Set to `production` in production

Optional for development:

- `PORT` - Local dev server port (default: 3000)

## Database

Uses Bun's native SQLite support with Drizzle ORM. The database file is `sqlite.db` (local only, gitignored).

For production on Vercel, you'll need to use a remote database like Turso, or use Vercel Postgres/other hosted solutions.
