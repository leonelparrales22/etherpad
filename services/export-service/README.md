# Export Service

Microservice for exporting Etherpad pads to various formats (HTML, TXT, PDF, DOCX, Etherpad).

## Features

- Export pads to multiple formats: HTML, TXT, PDF, DOCX, Etherpad (JSON)
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
PORT=3001
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

### Export a pad

```bash
# Export without revision
GET /api/export/:padId/:type

# Export with specific revision
GET /api/export/:padId/:type/:rev
```

**Parameters:**
- `padId` - The pad ID
- `type` - Export type: `html`, `txt`, `etherpad`, `pdf`, `docx`
- `rev` (optional) - Revision number

**Example:**
```bash
curl http://localhost:3001/api/export/mypad/html
curl http://localhost:3001/api/export/mypad/pdf/5
```

## Docker

```bash
# Build and run with docker-compose
docker-compose up export-service

# Build only
docker-compose build export-service
```

## Architecture

- **Controllers:** Handle HTTP requests/responses
- **Services:** Business logic
- **Repositories:** Database access (PostgreSQL via pg)
- **Generators:** Format-specific export logic (Strategy pattern)

## Database Schema

Uses the existing Etherpad `store` table:
- `key` (TEXT) - e.g., `pad:{padId}`, `pad:{padId}:revs:{revNum}`
- `value` (JSONB) - Pad content

## Error Handling

- 400 Bad Request - Invalid parameters or validation errors
- 404 Not Found - Pad or revision not found
- 500 Internal Server Error - Database or unexpected errors
