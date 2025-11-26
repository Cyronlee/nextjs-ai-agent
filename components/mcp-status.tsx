"use client";

import type { MCPServerStatus } from "@/lib/mcp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  XCircle,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MCPStatusProps {
  className?: string;
}

interface MCPStatusResponse {
  success: boolean;
  servers: MCPServerStatus[];
  totalTools: number;
  error?: string;
}

export function MCPStatus({ className }: MCPStatusProps) {
  const [status, setStatus] = useState<MCPStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/mcp");
      const data = await response.json();
      setStatus(data);

      if (!data.success) {
        toast.error("Failed to fetch MCP status", {
          description: data.error,
        });
      }
    } catch (error) {
      toast.error("Failed to fetch MCP status", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !status) {
      fetchStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleToolExpanded = (serverName: string, toolName: string) => {
    const key = `${serverName}-${toolName}`;
    const newExpanded = new Set(expandedTools);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedTools(newExpanded);
  };

  const connectedServers =
    status?.servers.filter((s) => s.connected).length || 0;
  const totalServers = status?.servers.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn(className)}>
          <Wrench className="mr-2 h-4 w-4" />
          MCP Tools
          {status && (
            <Badge variant="secondary" className="ml-2">
              {status.totalTools}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-2xl max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>MCP Server Status</DialogTitle>
          <DialogDescription>
            Model Context Protocol servers and their available tools
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          {status && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Connected Servers</p>
                <p className="text-2xl font-bold">
                  {connectedServers}/{totalServers}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Tools</p>
                <p className="text-2xl font-bold">{status.totalTools}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          )}

          {/* Server List */}
          {status && !isLoading && (
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-4">
                {status.servers.map((server) => (
                  <div
                    key={server.name}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    {/* Server Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{server.name}</h3>
                        {server.connected ? (
                          <Badge
                            variant="default"
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Disconnected
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {server.tools.length} tools
                      </Badge>
                    </div>

                    {/* Error Message */}
                    {server.error && (
                      <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {server.error}
                      </div>
                    )}

                    {/* Tools List */}
                    {server.tools.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Available Tools:
                        </p>
                        <div className="space-y-2">
                          {server.tools.map((tool) => {
                            const toolKey = `${server.name}-${tool.name}`;
                            const isExpanded = expandedTools.has(toolKey);
                            const properties =
                              tool.inputSchema?.properties || {};
                            const required = tool.inputSchema?.required || [];
                            const hasParams =
                              Object.keys(properties).length > 0;

                            return (
                              <div
                                key={tool.name}
                                className="rounded-md border bg-muted/50"
                              >
                                {/* Tool Header */}
                                <div
                                  className="flex cursor-pointer items-center justify-between p-3 hover:bg-muted/70"
                                  onClick={() =>
                                    toggleToolExpanded(server.name, tool.name)
                                  }
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-mono text-sm font-medium">
                                        {tool.name}
                                      </p>
                                      {hasParams && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px]"
                                        >
                                          {Object.keys(properties).length}{" "}
                                          params
                                        </Badge>
                                      )}
                                    </div>
                                    {tool.description && (
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        {tool.description}
                                      </p>
                                    )}
                                  </div>
                                  {hasParams &&
                                    (isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    ))}
                                </div>

                                {/* Tool Parameters (Expandable) */}
                                {isExpanded && hasParams && (
                                  <div className="border-t bg-background p-3">
                                    <p className="mb-2 text-xs font-semibold text-muted-foreground">
                                      Parameters:
                                    </p>
                                    <div className="space-y-2">
                                      {Object.entries(properties).map(
                                        ([paramName, paramDef]) => {
                                          const def = paramDef as {
                                            type?: string;
                                            description?: string;
                                            enum?: string[];
                                            default?: unknown;
                                          };
                                          const isRequired =
                                            required.includes(paramName);

                                          return (
                                            <div
                                              key={paramName}
                                              className="rounded border bg-muted/30 p-2"
                                            >
                                              <div className="flex items-center gap-2">
                                                <code className="text-xs font-semibold text-primary">
                                                  {paramName}
                                                </code>
                                                {def.type && (
                                                  <Badge
                                                    variant="secondary"
                                                    className="text-[10px]"
                                                  >
                                                    {def.type}
                                                  </Badge>
                                                )}
                                                {isRequired && (
                                                  <Badge
                                                    variant="destructive"
                                                    className="text-[10px]"
                                                  >
                                                    required
                                                  </Badge>
                                                )}
                                              </div>
                                              {def.description && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                  {def.description}
                                                </p>
                                              )}
                                              {def.enum && (
                                                <div className="mt-1">
                                                  <p className="text-[10px] text-muted-foreground">
                                                    Options:{" "}
                                                    {def.enum.join(", ")}
                                                  </p>
                                                </div>
                                              )}
                                              {def.default !== undefined && (
                                                <div className="mt-1">
                                                  <p className="text-[10px] text-muted-foreground">
                                                    Default:{" "}
                                                    {String(def.default)}
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Refresh Button */}
          {status && (
            <Button
              variant="outline"
              className="w-full"
              onClick={fetchStatus}
              disabled={isLoading}
            >
              Refresh Status
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
