# MCP Integration

This directory contains the Model Context Protocol (MCP) integration for the AI agent.

## Overview

The MCP integration allows the AI agent to access external tools through MCP servers using the stdio transport. The implementation is kept separate from the main agent code as per the architecture requirements.

## Architecture

- **types.ts**: TypeScript type definitions for MCP
- **config.ts**: Configuration for MCP servers
- **client.ts**: MCP client manager that handles server connections
- **tools-adapter.ts**: Converts MCP tools to AI SDK tool format
- **index.ts**: Main export file

## Configured Servers

### Git Server
- **Command**: `uvx mcp-server-git`
- **Purpose**: Git operations (status, diff, log, etc.)

### Filesystem Server
- **Command**: `npx @modelcontextprotocol/server-filesystem`
- **Purpose**: File system operations (read, write, list files)
- **Scope**: Limited to project directory

## Usage

### In API Routes

```typescript
import { getMCPManager, getAllMCPTools, MCP_SERVERS_CONFIG } from "@/lib/mcp";

// Get the singleton manager
const mcpManager = getMCPManager();

// Connect to servers
for (const [serverName, config] of Object.entries(MCP_SERVERS_CONFIG)) {
  await mcpManager.connect(serverName, config);
}

// Get all tools in AI SDK format
const mcpTools = getAllMCPTools(mcpManager);

// Use with streamText
const result = streamText({
  model,
  tools: { ...localTools, ...mcpTools },
  // ...
});
```

### Tool Naming Convention

MCP tools are prefixed with their server name:
- `git_status` - Git status command
- `git_log` - Git log command
- `filesystem_read_file` - Read file
- `filesystem_write_file` - Write file

## API Endpoints

### GET /api/mcp

Returns the status of all configured MCP servers and their available tools.

**Response:**
```json
{
  "success": true,
  "servers": [
    {
      "name": "git",
      "connected": true,
      "tools": [
        {
          "name": "status",
          "description": "Get git status",
          "inputSchema": { ... }
        }
      ]
    }
  ],
  "totalTools": 10
}
```

## Notes

- This implementation does NOT use `experimental_createMCPClient` from `@ai-sdk/mcp`
- Instead, it uses the official `@modelcontextprotocol/sdk` directly
- The MCP client manager is a singleton to maintain persistent connections
- Connections are lazy-loaded on first chat request

