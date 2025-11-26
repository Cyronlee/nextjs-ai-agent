/**
 * MCP (Model Context Protocol) Integration
 * 
 * This module provides integration with MCP servers, allowing the AI agent
 * to access external tools through the Model Context Protocol.
 */

export { MCPClientManager, getMCPManager } from "./client";
export { MCP_SERVERS_CONFIG } from "./config";
export { convertMCPToolsToAISDK, getAllMCPTools } from "./tools-adapter";
export type {
  MCPCallToolParams,
  MCPServerConfig,
  MCPServerStatus,
  MCPServersConfig,
  MCPToolDefinition,
  MCPToolResult,
} from "./types";

