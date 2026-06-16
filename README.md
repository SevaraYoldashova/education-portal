# Education Portal

A starter education platform with a Go backend, PostgreSQL database, migrations, Docker, and a React + Tailwind frontend.

## What Is Inside

- `backend`: Go API
- `frontend`: React + Tailwind app
- `docker-compose.yml`: Postgres, migrations, backend, and frontend

## Backend Pattern

- `handler -> service -> repository` flow
- Clean architecture with a small DDD-style `course` bounded context
- PostgreSQL through `pgxpool`
- SQL migrations through `golang-migrate`

## Run With Docker

```sh
docker compose up --build
```

Then open:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8080/healthz`

## Run Frontend Only

```sh
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Run Backend Only

```sh
cd backend
cp .env.example .env
go run ./cmd/api
```

## Environment Files

- `backend/.env`: backend address, database URL, and allowed frontend origin
- `frontend/.env`: Vite API URL used by `frontend/src/api.ts`

## Project Shape

```text
frontend/
  src/App.tsx
  src/api.ts
  src/main.tsx

backend/internal/course/
  domain/        pure course and enrollment rules
  application/   service/use-case layer
  adapters/http  HTTP handlers
  adapters/postgres PostgreSQL repository
```

The frontend calls the backend API from `frontend/src/api.ts`.
