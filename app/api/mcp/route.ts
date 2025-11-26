import { getMCPManager, MCP_SERVERS_CONFIG } from "@/lib/mcp";
import { NextResponse } from "next/server";

/**
 * GET /api/mcp
 * Returns the status of all configured MCP servers and their available tools
 */
export async function GET() {
  try {
    const mcpManager = getMCPManager();

    // Try to connect to all configured servers if not already connected
    const connectionPromises = Object.entries(MCP_SERVERS_CONFIG).map(
      async ([serverName, config]) => {
        try {
          if (!mcpManager.isConnected(serverName)) {
            await mcpManager.connect(serverName, config);
          }
          return { serverName, success: true };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return { serverName, success: false, error: errorMessage };
        }
      }
    );

    const connectionResults = await Promise.all(connectionPromises);

    // Get status of all servers
    const status = mcpManager.getStatus();

    // Add error information for failed connections
    const statusWithErrors = status.map((serverStatus) => {
      const connectionResult = connectionResults.find(
        (r) => r.serverName === serverStatus.name
      );
      if (connectionResult && !connectionResult.success) {
        return {
          ...serverStatus,
          connected: false,
          error: connectionResult.error,
        };
      }
      return serverStatus;
    });

    // Add servers that failed to connect but aren't in status yet
    for (const result of connectionResults) {
      if (
        !result.success &&
        !statusWithErrors.find((s) => s.name === result.serverName)
      ) {
        statusWithErrors.push({
          name: result.serverName,
          connected: false,
          tools: [],
          error: result.error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      servers: statusWithErrors,
      totalTools: statusWithErrors.reduce(
        (sum, server) => sum + server.tools.length,
        0
      ),
    });
  } catch (error) {
    console.error("Error getting MCP status:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        servers: [],
        totalTools: 0,
      },
      { status: 500 }
    );
  }
}
