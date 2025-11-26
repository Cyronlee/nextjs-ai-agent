import { tool } from "ai";
import { z, type ZodType } from "zod";
import type { MCPClientManager } from "./client";
import type { MCPToolDefinition } from "./types";

/**
 * Type for AI SDK tool (loosely typed to accommodate dynamic schemas)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AISDKTool = ReturnType<typeof tool<any>>;

/**
 * Convert JSON Schema to Zod schema (simplified version)
 */
function jsonSchemaToZod(
  jsonSchema: MCPToolDefinition["inputSchema"]
): ZodType {
  if (jsonSchema.type !== "object") {
    return z.object({});
  }

  const properties = jsonSchema.properties || {};
  const required = jsonSchema.required || [];

  const zodShape: Record<string, ZodType> = {};

  for (const [key, value] of Object.entries(properties)) {
    const prop = value as {
      type?: string;
      description?: string;
      enum?: string[];
    };

    let zodField: ZodType;

    if (prop.enum) {
      zodField = z.enum(prop.enum as [string, ...string[]]);
    } else {
      switch (prop.type) {
        case "string":
          zodField = z.string();
          break;
        case "number":
          zodField = z.number();
          break;
        case "boolean":
          zodField = z.boolean();
          break;
        case "array":
          zodField = z.array(z.any());
          break;
        case "object":
          zodField = z.record(z.string(), z.any());
          break;
        default:
          zodField = z.any();
      }
    }

    if (prop.description) {
      zodField = zodField.describe(prop.description);
    }

    if (!required.includes(key)) {
      zodField = zodField.optional();
    }

    zodShape[key] = zodField;
  }

  return z.object(zodShape);
}

/**
 * Convert MCP tools to AI SDK tools
 */
export function convertMCPToolsToAISDK(
  mcpManager: MCPClientManager,
  serverName: string
) {
  const tools = mcpManager.getServerTools(serverName);
  const aiTools: Record<string, AISDKTool> = {};

  for (const mcpTool of tools) {
    const toolName = `${serverName}_${mcpTool.name}`;
    const inputSchema = jsonSchemaToZod(mcpTool.inputSchema);

    // Type assertion needed due to dynamic schema generation
    aiTools[toolName] = tool({
      description: mcpTool.description || `Tool from ${serverName}`,
      inputSchema,
      execute: async (args) => {
        try {
          const result = await mcpManager.callTool({
            serverName,
            toolName: mcpTool.name,
            arguments: args as Record<string, unknown>,
          });

          // Extract text content from result
          const textContent = result.content
            .filter((c) => c.type === "text")
            .map((c) => c.text)
            .join("\n");

          if (result.isError) {
            return `Error: ${textContent}`;
          }

          return textContent;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return `Error executing tool: ${errorMessage}`;
        }
      },
    }) as AISDKTool;
  }

  return aiTools;
}

/**
 * Get all MCP tools as AI SDK tools from all connected servers
 */
export function getAllMCPTools(mcpManager: MCPClientManager) {
  const allTools = mcpManager.getAllTools();
  let aiTools: Record<string, AISDKTool> = {};

  for (const serverName of Object.keys(allTools)) {
    const serverTools = convertMCPToolsToAISDK(mcpManager, serverName);
    aiTools = { ...aiTools, ...serverTools };
  }

  return aiTools;
}

