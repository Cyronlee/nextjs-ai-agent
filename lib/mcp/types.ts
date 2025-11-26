/**
 * MCP (Model Context Protocol) Types
 */

export interface MCPServerConfig {
  command: string;
  args: string[];
}

export interface MCPServersConfig {
  [serverName: string]: MCPServerConfig;
}

export interface MCPToolDefinition {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPServerStatus {
  name: string;
  connected: boolean;
  tools: MCPToolDefinition[];
  error?: string;
}

export interface MCPCallToolParams {
  serverName: string;
  toolName: string;
  arguments?: Record<string, unknown>;
}

export interface MCPToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

