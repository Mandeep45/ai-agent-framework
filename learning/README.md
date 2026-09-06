# Learning

Experiments and tutorials for building AI agents. This folder is **not** part of the production build or Render deployment.

## What's here

| Folder | Description |
|--------|-------------|
| `agent/` | Custom agent loop built from scratch |
| `langgraph/` | LangGraph order-assistant demos |
| `mcp/` | MCP client + scratch-agent integration |
| `agents-sdk/` | OpenAI Agents SDK CLI demos (stub tools) |
| `llm/` | Custom LLM provider implementations |
| `registry/`, `application/`, `validation/`, `tools/` | Tool registry and execution stack |
| `approval/` | CLI approval flow (learning only) |
| `tests/` | Unit tests for the scratch agent |

Learning code may import from `../src/` (domain services, logger, production agent runtime) but production code never imports from here.

## Run demos

```bash
yarn dev              # Scratch agent + CustomerTool
yarn langgraph        # LangGraph customer/order flow
yarn langgraph:approval
yarn mcp              # Raw MCP tool call
yarn mcp:agent        # Scratch agent over MCP
yarn agents-sdk       # Agents SDK with stub tools
yarn agents-sdk:mcp   # Agents SDK + real MCP (production path, CLI)
yarn test:unit        # Scratch agent unit tests
```
