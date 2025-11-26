import type { MCPServersConfig } from "./types";

/**
 * MCP Servers Configuration
 */
export const MCP_SERVERS_CONFIG: MCPServersConfig = {
  git: {
    command: "uvx",
    args: ["mcp-server-git"],
  },
  filesystem: {
    command: "npx",
    args: [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "/Users/siyuan.li/Workspace/cyronlee/nextjs-ai-agent",
    ],
  },
};

