# Session Service

Microservice for managing Etherpad API sessions.

## Features

- Create, read, delete API sessions
- List sessions by group or author
- RESTful API with Express.js
- PostgreSQL database integration
- TypeScript with strict mode
- Docker support

## Prerequisites

- Node.js >= 20
- PostgreSQL >= 15
- pnpm >= 11.0.0 (for development)

## Installation

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm run build
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=etherpad
DB_PASSWORD=etherpad
DB_NAME=etherpad
PORT=3002
NODE_ENV=development
```

## Running Locally

```bash
# Development mode with hot reload
pnpm run dev

# Production mode
pnpm run build
pnpm run start
```

## API Endpoints

### Create a session

```bash
POST /api/sessions
Content-Type: application/json

{
  "groupID": "g.abc123",
  "authorID": "a.xyz789",
  "validUntil": 1735689600
}
```

**Response (201):**
```json
{
  "sessionID": "s.1a2b3c4d5e6f7g8h"
}
```

### Get session info

```bash
GET /api/sessions/:sessionID
```

**Response (200):**
```json
{
  "sessionID": "s.1a2b3c4d5e6f7g8h",
  "groupID": "g.abc123",
  "authorID": "a.xyz789",
  "validUntil": 1735689600
}
```

### Delete a session

```bash
DELETE /api/sessions/:sessionID
```

**Response (204)**

### List sessions by group

```bash
GET /api/sessions/group/:groupID
```

**Response (200):**
```json
{
  "sessions": [...]
}
```

### List sessions by author

```bash
GET /api/sessions/author/:authorID
```

**Response (200):**
```json
{
  "sessions": [...]
}
```

## Docker

```bash
# Build and run with docker-compose
docker-compose up session-service

# Build only
docker-compose build session-service
```

## Architecture

- **Controllers:** Handle HTTP requests/responses
- **Services:** Business logic and validations
- **Repositories:** Database access (PostgreSQL via pg)
- **BaseRepository:** Shared database operations

## Database Schema

Uses the existing Etherpad `store` table:
- `key` (TEXT) - e.g., `session:{sessionID}`, `group2sessions:{groupID}`, `author2sessions:{authorID}`
- `value` (JSONB) - Session data

## Validations

- Group must exist
- Author must exist
- `validUntil` must be:
  - A number
  - Not negative
  - An integer (not float)
  - In the future

## Error Handling

- 400 Bad Request - Validation errors
- 404 Not Found - Session, group, or author not found
- 500 Internal Server Error - Database or unexpected errors
