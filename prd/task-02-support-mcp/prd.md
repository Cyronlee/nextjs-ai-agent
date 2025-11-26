Add MCP tools support to the agent

## initial MCP servers

```json
{
  "mcpServers": {
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git"]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/siyuan.li/Workspace/cyronlee/nextjs-ai-agent"
      ]
    }
  }
}
```

## get MCP tools status

- add a new API endpoint GET `/api/mcp` to verify the MCP tools status
- render the status to the UI, list servers and their tools

## invoke MCP tools

- pass the MCP tools to the agent
- the agent should be able to invoke MCP tools when needed

## others

- maintain mcp codes in independent files, do not mix with the agent code
- do not use `experimental_createMCPClient`
