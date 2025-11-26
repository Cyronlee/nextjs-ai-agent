import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type {
  MCPCallToolParams,
  MCPServerConfig,
  MCPServerStatus,
  MCPToolDefinition,
  MCPToolResult,
} from "./types";

/**
 * MCP Client Manager
 * Manages connections to MCP servers and provides tool execution
 */
export class MCPClientManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();
  private toolsCache: Map<string, MCPToolDefinition[]> = new Map();

  /**
   * Connect to an MCP server
   */
  async connect(serverName: string, config: MCPServerConfig): Promise<void> {
    try {
      // Create transport
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
      });

      // Create client
      const client = new Client(
        {
          name: "nextjs-ai-agent",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      // Connect
      await client.connect(transport);

      // Store references
      this.clients.set(serverName, client);
      this.transports.set(serverName, transport);

      // Fetch and cache tools
      const toolsResponse = await client.listTools();
      this.toolsCache.set(serverName, toolsResponse.tools);
    } catch (error) {
      console.error(`Failed to connect to MCP server ${serverName}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    const transport = this.transports.get(serverName);

    if (client) {
      await client.close();
      this.clients.delete(serverName);
    }

    if (transport) {
      await transport.close();
      this.transports.delete(serverName);
    }

    this.toolsCache.delete(serverName);
  }

  /**
   * Disconnect all servers
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.keys()).map((name) =>
      this.disconnect(name)
    );
    await Promise.all(disconnectPromises);
  }

  /**
   * Get all tools from a specific server
   */
  getServerTools(serverName: string): MCPToolDefinition[] {
    return this.toolsCache.get(serverName) || [];
  }

  /**
   * Get all tools from all connected servers
   */
  getAllTools(): Record<string, MCPToolDefinition[]> {
    const allTools: Record<string, MCPToolDefinition[]> = {};
    for (const [serverName, tools] of this.toolsCache.entries()) {
      allTools[serverName] = tools;
    }
    return allTools;
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(params: MCPCallToolParams): Promise<MCPToolResult> {
    const { serverName, toolName, arguments: args } = params;

    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server ${serverName} is not connected`);
    }

    try {
      const result = await client.callTool({
        name: toolName,
        arguments: args || {},
      });

      return {
        content: result.content as MCPToolResult["content"],
        isError: result.isError as boolean | undefined,
      };
    } catch (error) {
      console.error(`Error calling tool ${toolName} on ${serverName}:`, error);
      throw error;
    }
  }

  /**
   * Get status of all connected servers
   */
  getStatus(): MCPServerStatus[] {
    const status: MCPServerStatus[] = [];

    for (const [serverName, tools] of this.toolsCache.entries()) {
      status.push({
        name: serverName,
        connected: this.clients.has(serverName),
        tools,
      });
    }

    return status;
  }

  /**
   * Check if a server is connected
   */
  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }
}

// Singleton instance
let mcpManager: MCPClientManager | null = null;

/**
 * Get or create the MCP client manager singleton
 */
export function getMCPManager(): MCPClientManager {
  if (!mcpManager) {
    mcpManager = new MCPClientManager();
  }
  return mcpManager;
}

