# Backend

Go API for the Education Portal demo. The code uses a clean architecture/DDD mix:

- `cmd/api`: composition root and HTTP server lifecycle
- `internal/course/domain`: entities, value rules, repository port
- `internal/course/application`: service/use-case layer
- `internal/course/adapters/http`: HTTP handlers
- `internal/course/adapters/postgres`: PostgreSQL repository
- `migrations`: golang-migrate SQL files

## Run Locally

```sh
cp .env.example .env
go run ./cmd/api
```

The backend reads `.env` automatically for local development.

## API

- `GET /healthz`
- `GET /api/v1/courses`
- `POST /api/v1/courses`
- `GET /api/v1/courses/{id}`
- `POST /api/v1/courses/{id}/enrollments`
