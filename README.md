# AI Agent Framework

An educational AI agent framework built from scratch with TypeScript, plus a full-stack **Order Assistant** demo (Express API + React UI + MCP tools + human approval).

## Features

- Chat with an AI order assistant
- MCP tools: customer lookup, inventory, product list, order history, get order, place order, cancel order
- Human approval for sensitive actions (`place_order`, `cancel_order`)
- Live tool-step timeline via SSE
- SQLite for local dev, PostgreSQL for production
- 40 customers and 40 real-world products in seed data

## Quick start (local)

### 1. Install dependencies

```bash
yarn install
```

### 2. Configure environment

Copy `.env.example` to `.env` and set your Groq API key:

```bash
cp .env.example .env
```

```env
GROQ_API_KEY=your-key-here
```

Optional local API auth (skip if unset):

```env
API_KEY=dev-secret-key
VITE_API_KEY=dev-secret-key
```

### 3. Reset and seed the database

```bash
yarn db:reset
```

### 4. Run the app

```bash
yarn dev:app
```

- API: http://localhost:3001
- Web UI: http://localhost:5173

### Try it

- *"Find customer ABC"*
- *"Check inventory for SAM24"*
- *"List all products"*
- *"Place an order for customer ABC — 1x IPH14"*
- *"Cancel order ORD-..."* (after placing an order)

## Scripts

| Command | Description |
|---------|-------------|
| `yarn dev:app` | Run API + web in dev mode |
| `yarn build:app` | Production build (API + web) |
| `yarn start:prod` | Start production API |
| `yarn db:reset` | Wipe DB and reload seed data |
| `yarn test` | Run all tests |
| `yarn test:unit` | Run unit tests only |
| `yarn test:integration` | Run integration tests (isolated test DB) |
| `yarn dev` | Scratch-agent CLI demo (`learning/`) |
| `yarn langgraph` | LangGraph demo |
| `yarn mcp` / `yarn mcp:agent` | MCP client demos |
| `yarn agents-sdk` / `yarn agents-sdk:mcp` | OpenAI Agents SDK demos |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq LLM API key |
| `GROQ_MODEL` | No | Default: `openai/gpt-oss-20b` |
| `API_KEY` | Prod | API auth key (required when `NODE_ENV=production`) |
| `API_PORT` | No | Default: `3001` (Render sets `PORT` automatically) |
| `WEB_ORIGIN` | Prod | Frontend URL for CORS |
| `DATABASE_PATH` | Dev | SQLite path (default: `data/app.db`) |
| `DATABASE_URL` | Prod | PostgreSQL connection string |
| `DATABASE_SSL` | Prod | Set `true` for managed Postgres |
| `VITE_API_URL` | Prod build | API base URL (e.g. `https://your-api.onrender.com`) |
| `VITE_API_KEY` | Prod build | Same value as `API_KEY` |
| `RATE_LIMIT_WINDOW_MS` | No | Chat rate limit window (default `60000`) |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max chat requests per window (default `30`) |

## API authentication

When `API_KEY` is set, all `/api/chat`, `/api/approval`, `/api/events`, `/api/orders`, and `/api/sessions` routes require authentication via:

- `x-api-key: <key>` header, or
- `Authorization: Bearer <key>` header, or
- `?apiKey=<key>` query param (used by SSE)

`/api/health` stays public.

`POST /api/chat` is rate-limited (default: 30 requests per minute per client).

In development, `API_KEY` is optional. In production, the server refuses to start without it.

## Production vs learning code

### Production (deployed Order Assistant)

| Path | Purpose |
|------|---------|
| `apps/api/` + `apps/web/` | Full-stack app (Express + React) |
| `src/agents-sdk/` | Groq agent + MCP integration |
| `src/mcp/server.ts` | MCP tool server (stdio) |
| `src/services/` + `src/repositories/` + `src/db/` | Domain layer + database |
| `src/approval/` | Web approval handler (production) |

### Learning (experiments, not in production build)

All learning code lives under `learning/`:

| Path | Purpose |
|------|---------|
| `learning/agent/` | Custom agent built from scratch |
| `learning/langgraph/` | LangGraph demos |
| `learning/mcp/` | MCP client + scratch-agent demos |
| `learning/agents-sdk/` | CLI demos with stub tools |
| `learning/llm/`, `learning/registry/`, etc. | Supporting learning modules |

Run learning demos with `yarn dev`, `yarn langgraph`, `yarn mcp`, `yarn agents-sdk`, etc.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full request flow and diagrams.

## Deploy to Render

This repo includes a [`render.yaml`](render.yaml) blueprint.

### Steps

1. Push the repo to GitHub.
2. In Render: **New → Blueprint** → connect the repo.
3. Set sync-false env vars after deploy:
   - **API service:** `GROQ_API_KEY`, `WEB_ORIGIN` (your static site URL, e.g. `https://order-assistant-web.onrender.com`)
   - **Static site:** `VITE_API_URL` (your API URL, e.g. `https://order-assistant-api.onrender.com`)
4. Redeploy the static site after setting `VITE_API_URL` (Vite bakes env vars at build time).
5. Seed PostgreSQL once (from your machine or Render shell):

```bash
DATABASE_URL=postgresql://... DATABASE_SSL=true yarn db:reset
```

### Render services

| Service | Type | Notes |
|---------|------|-------|
| `order-assistant-api` | Web (Node) | Runs `yarn start:prod` |
| `order-assistant-web` | Static | Serves `apps/web/dist` |
| `order-assistant-db` | PostgreSQL | Managed database |

`API_KEY` is auto-generated on the API service. The static site receives it as `VITE_API_KEY` via `fromService`.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for diagrams, MCP tools, API routes, and security.

```
React UI  →  Express API  →  AgentRunner + MCP subprocess
                                    ↓
                          Customer / Inventory / Order services
                                    ↓
                          SQLite (dev) or PostgreSQL (prod)
```

## Project structure

```
apps/api/       Express API server (production)
apps/web/       React + Vite frontend (production)
src/            Domain layer, agent runtime, MCP server (production)
learning/       Experiments and tutorials (excluded from prod build)
docs/           Architecture documentation
scripts/        DB reset, dev port helpers
data/           SQLite database (dev)
tests/          Integration tests
```

## License

ISC
