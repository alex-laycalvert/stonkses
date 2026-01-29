# Agent Guidelines for Stonkses

This document provides coding standards and commands for AI agents working in this repository.

## Project Overview

**Stonkses** is a TypeScript Turborepo monorepo using **Bun** as the package manager.

- **Frontend**: React Router v7 (SSR) with React 19, TailwindCSS v4, Vite
- **Backend**: Fastify API with Drizzle ORM (SQLite), better-auth
- **Package Manager**: Bun v1.2.11
- **Build System**: Turborepo v2.8.1
- **Linter/Formatter**: Biome v2.3.8 (no ESLint/Prettier)
- **Testing**: Vitest v4.0.18 (frontend only)

## Monorepo Structure

```
apps/
  ├── backend/           # Fastify API server (Bun runtime)
  └── frontend/          # React Router SSR app
packages/
  ├── biome-config/      # Shared Biome linter/formatter config
  ├── robinhood/         # TypeScript type definitions package
  └── typescript-config/ # Shared TypeScript configs
```

## Build/Lint/Test Commands

### Root Level (Turborepo)
```bash
bun run build           # Build all workspaces
bun run dev             # Run dev servers for all workspaces
bun run lint            # Lint all workspaces with Biome
bun run format          # Format all files with Biome
bun run check-types     # Type check all workspaces
```

### Backend (`apps/backend`)
```bash
cd apps/backend
bun run dev             # Start dev server with --watch
bun run start           # Start production server
bun run lint            # Lint with Biome
bun run check-types     # TypeScript type checking
bun run db:push         # Push Drizzle schema to SQLite
bun run db:studio       # Open Drizzle Studio
```

### Frontend (`apps/frontend`)
```bash
cd apps/frontend
bun run dev             # Start dev server (Vite + React Router)
bun run build           # Build for production
bun run start           # Start production server
bun run lint            # Lint with Biome
bun run typecheck       # Type check (react-router typegen + tsc)
bun run test            # Run Vitest tests
bun run test <file>     # Run single test file (e.g., bun run test allocations.test.ts)
```

### Running Single Tests
```bash
# From frontend directory
bun run test app/features/portfolio/utils/allocations.test.ts
# Or with vitest directly
bunx vitest app/features/portfolio/utils/allocations.test.ts
```

## Code Style Guidelines

### General Formatting
- **Formatter**: Biome (configured in `packages/biome-config/base.json`)
- **Line width**: 120 characters
- **Indentation**: 4 spaces (NOT tabs)
- **Quotes**: Double quotes for JavaScript/TypeScript
- **Semicolons**: Required (automatically formatted by Biome)
- **Auto-organize imports**: Enabled via Biome

### Imports
- Use ES modules (`import/export`), NOT CommonJS (`require/module.exports`)
- Organize imports automatically via Biome (`bun run format`)
- Group imports: external packages → internal modules → relative imports
- Use type imports with `type` keyword when importing only types:
  ```typescript
  import type { FastifyReply, FastifyRequest } from "fastify";
  import type { ReactNode } from "react";
  ```

### TypeScript
- **Strict mode**: Enabled (see `packages/typescript-config/`)
- **NO `any` types**: Explicitly forbidden by Biome (`noExplicitAny: error`)
- **NO `var`**: Use `const` or `let` only
- **Prefer `const`**: Use `const` by default, `let` only when reassignment needed
- **Type annotations**: Required for function parameters and return types
- **Use type assertions carefully**: Avoid non-null assertions when possible

### Naming Conventions
- **Files**: kebab-case (e.g., `auth-context.tsx`, `portfolio-page.tsx`)
- **Components**: PascalCase (e.g., `AuthProvider`, `SortablePlannerCategoryRow`)
- **Functions/Variables**: camelCase (e.g., `generateRequiredAllocations`, `currentPlannerTotal`)
- **Constants**: camelCase or SCREAMING_SNAKE_CASE for true constants
- **Interfaces/Types**: PascalCase (e.g., `AuthContextValue`, `PlannerCategory`)
- **Database tables**: camelCase with Drizzle (e.g., `user`, `session`)

### React Conventions
- **Function components**: Use arrow functions with explicit typing
  ```typescript
  export function AuthProvider({ children }: { children: ReactNode }) {
      // ...
  }
  ```
- **Hooks**: Follow React hooks rules; custom hooks start with `use`
- **Context**: Create typed contexts; throw error if used outside provider
  ```typescript
  export function useAuth(): AuthContextValue {
      const context = useContext(AuthContext);
      if (context === undefined) {
          throw new Error("useAuth must be used within an AuthProvider");
      }
      return context;
  }
  ```
- **Props typing**: Inline for simple cases, separate interface for complex
- **Event handlers**: Prefix with `on` (e.g., `onUpdateCategory`, `onRemoveCategory`)

### Error Handling
- **Backend**: Use Fastify reply.status() with structured error objects:
  ```typescript
  return reply.status(400).send({
      error: "Token is required",
      code: "INVALID_INPUT",
  });
  ```
- **Frontend**: Handle errors from async operations; display user-friendly messages
- **Logging**: Use `fastify.log` methods in backend (info, error, warn)
- **Type-safe errors**: Catch errors with proper typing; avoid `any`

### Testing (Vitest)
- **Test files**: `*.test.ts` (NOT `*.spec.ts`)
- **Structure**: Use `describe` / `it` / `expect` pattern
- **Location**: Co-locate tests with source files (e.g., `allocations.ts` → `allocations.test.ts`)
- **Coverage**: Write comprehensive tests for utility functions and business logic
- **Mocking**: Use Vitest's built-in mocking capabilities when needed

### Database (Drizzle ORM)
- **Schema**: Define in `apps/backend/db/schema.ts`
- **Naming**: Use snake_case for column names, camelCase for TypeScript properties
- **Timestamps**: Use `mode: "timestamp_ms"` with SQLite integer columns
- **Indexes**: Define indexes for foreign keys and frequently queried columns
- **Migrations**: Use `bun run db:push` for development; consider migrations for production

### Feature-Based Architecture (Frontend)
- Organize by feature under `app/features/`
- Each feature has: `components/`, `contexts/`, `pages/`, `services/`, `utils/`, `layouts/`
- Export public API from feature (e.g., contexts, types) in dedicated `public/` folder
- Keep feature-specific code internal; avoid cross-feature dependencies when possible

### API Conventions (Backend)
- **Routes**: RESTful conventions (e.g., `/api/positions`, `/api/user/robinhood-token`)
- **Methods**: Use appropriate HTTP verbs (GET, POST, PUT, DELETE)
- **Authentication**: Use `preHandler: requireAuth` for protected routes
- **CORS**: Configured for localhost development (ports 3000, 5173)
- **Response format**: Consistent JSON structures with `{ success, data, error, code }`

## Critical Rules
1. **Never use `var`** - Biome will error; use `const` or `let`
2. **Never use `any` type** - Biome will error; provide proper typing
3. **No CommonJS** - Use ES modules only (`import`/`export`)
4. **Run `bun run format`** before committing to auto-fix formatting issues
5. **Run `bun run check-types`** to catch TypeScript errors before committing
6. **Use Bun commands** - NOT npm/yarn/pnpm (this project uses Bun exclusively)
7. **Test pattern is `*.test.ts`** - NOT `*.spec.ts`

## Workflow Tips
- Before making changes, run `bun run dev` to ensure everything works
- Use `bun run lint` frequently to catch issues early
- Biome auto-fixes most issues; run `bun run format` to apply fixes
- For type errors, check both the specific app AND shared `packages/typescript-config`
- Backend runs on port 3000, frontend on port 5173 (dev mode)
- Database is SQLite (`apps/backend/sqlite.db`); use Drizzle Studio to inspect

## Common Patterns

### Adding a Protected Route (Backend)
```typescript
fastify.get("/api/resource", { preHandler: requireAuth }, async (request, reply) => {
    const session = (request as typeof request & { session: SessionType }).session;
    // Use session.user.id for user-specific operations
});
```

### Creating a Context (Frontend)
```typescript
const MyContext = createContext<MyContextValue | undefined>(undefined);

export function MyProvider({ children }: { children: ReactNode }) {
    const value: MyContextValue = { /* ... */ };
    return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}

export function useMyContext(): MyContextValue {
    const context = useContext(MyContext);
    if (context === undefined) {
        throw new Error("useMyContext must be used within MyProvider");
    }
    return context;
}
```

### Writing Tests (Vitest)
```typescript
import { describe, expect, it } from "vitest";
import { myFunction } from "./my-module";

describe("myFunction", () => {
    it("should handle basic case", () => {
        const result = myFunction(input);
        expect(result).toEqual(expectedOutput);
    });
});
```
