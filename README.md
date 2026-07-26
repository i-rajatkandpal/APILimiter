# API Rate Limiter

A full-stack API gateway with built-in rate limiting, API key management, and JWT authentication. Built with Spring Boot and React.

## What It Does

This project acts as a **reverse proxy gateway** — you register an external API (like `jsonplaceholder.typicode.com`), get an API key, and all requests through the gateway are automatically rate-limited based on your plan.

**Core Flow:**
```
Client → Gateway (validate key → check rate limit → proxy request) → Target API
```

## Features

- **3 Rate Limiting Algorithms** — Fixed Window, Sliding Window Counter, Token Bucket (powered by Redis)
- **API Key Management** — Generate, list, rotate, enable/disable, and delete keys
- **JWT Authentication** — Secure user registration and login
- **Gateway Proxy** — Forwards any HTTP method to the registered target URL
- **Plan-Based Limits** — FREE, BASIC, and PRO tiers with different rate limits
- **Rate Limit Headers** — Every response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`
- **React Dashboard** — Frontend UI for managing keys and testing the gateway

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Java 21, Spring Boot 4              |
| Database  | PostgreSQL 15                       |
| Cache     | Redis 7                             |
| Auth      | Spring Security + JWT (jjwt)        |
| Frontend  | React 19, Vite 8                    |
| Infra     | Docker Compose                      |

## Project Structure

```
├── src/main/java/com/rajat/limiter/
│   ├── config/              # Security config, data initializer
│   ├── Entity/              # JPA entities (User, ApiKey, Plan)
│   ├── Repositories/        # Spring Data JPA repositories
│   ├── Security/            # JWT filter, JWT service, auth controller
│   ├── gateway/
│   │   ├── controller/      # Gateway proxy + API key endpoints
│   │   ├── model/           # Request DTOs
│   │   └── service/         # API key validation, plan config
│   ├── ratelimit/
│   │   ├── algorithm/       # Fixed Window, Sliding Window, Token Bucket
│   │   ├── model/           # Rate limit request/response DTOs
│   │   └── service/         # Rate limiter orchestrator
│   └── common/              # Global exception handler, error responses
├── frontend/                # React + Vite dashboard
└── docker-compose.yml       # PostgreSQL + Redis
```

## Getting Started

### Prerequisites

- Java 21+
- Docker & Docker Compose
- Node.js 18+ (for frontend)

### 1. Start the databases

```bash
docker compose up -d
```

This starts PostgreSQL (port `5432`) and Redis (port `6379`).

### 2. Run the backend

```bash
./mvnw spring-boot:run
```

The API server starts on `http://localhost:8080`.

### 3. Run the frontend (optional)

```bash
cd frontend
npm install
npm run dev
```

The dashboard opens on `http://localhost:5173`.

## API Endpoints

### Auth
| Method | Endpoint            | Description         |
|--------|---------------------|---------------------|
| POST   | `/auth/register`    | Register a new user |
| POST   | `/auth/login`       | Login, get JWT      |

### API Keys (requires JWT)
| Method | Endpoint                 | Description           |
|--------|--------------------------|-----------------------|
| POST   | `/api/keys/generate`     | Create a new API key  |
| GET    | `/api/keys/list`         | List your keys        |
| DELETE | `/api/keys/{id}`         | Delete a key          |
| PATCH  | `/api/keys/{id}/disable` | Disable a key         |
| PATCH  | `/api/keys/{id}/enable`  | Re-enable a key       |
| POST   | `/api/keys/{id}/rotate`  | Rotate (regenerate)   |

### Gateway
| Method | Endpoint       | Description                              |
|--------|----------------|------------------------------------------|
| ANY    | `/gateway/**`  | Proxy to target API (requires `X-API-Key` header) |

## Usage Example

**1. Register & Login**
```bash
# Register
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}'

# Login (returns JWT)
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}'
```

**2. Generate an API Key**
```bash
curl -X POST http://localhost:8080/api/keys/generate \
  -H "Authorization: Bearer <your-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"targetUrl": "https://jsonplaceholder.typicode.com", "planName": "FREE"}'
```

**3. Make requests through the gateway**
```bash
curl http://localhost:8080/gateway/posts/1 \
  -H "X-API-Key: <your-api-key>"
```

The response includes rate limit headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1706000000
```

## Rate Limiting Plans

| Plan  | Requests | Window  | Algorithm             |
|-------|----------|---------|-----------------------|
| FREE  | 10       | 60s     | Fixed Window          |
| BASIC | 50       | 60s     | Sliding Window Counter|
| PRO   | 200      | 60s     | Token Bucket          |

## License

MIT
