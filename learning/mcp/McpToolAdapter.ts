import { Client } from "@modelcontextprotocol/client";
import { ToolRegistry } from "../registry/ToolRegistry";
import { McpTool } from "./McpTool";
import { ToolDefinition } from "../types/ToolDefinition";

export async function registerMcpTools(
    client: Client,
    registry: ToolRegistry
): Promise<void> {

    const response =
        await client.listTools();

    for (const tool of response.tools) {

        const definition: ToolDefinition = {
            name: tool.name,
            description:
                tool.description ?? "",
            inputSchema:
                tool.inputSchema as ToolDefinition["inputSchema"],
        };

        const mcpTool =
            new McpTool(
                definition,
                client
            );

        registry.register(
            mcpTool
        );
    }
}