import {
    MCPServerStdio,
    mcpToFunctionTool,
} from "@openai/agents";

import {
    AgentLogger,
} from "../logger/AgentLogger";

import {
    config,
} from "../config";

import {
    getMcpServerEnv,
} from "../config/mcpDefaults";

import {
    validateMcpTools,
} from "../security/ToolSecurityPolicy";


export class MCPAgentTools {

    private readonly mcpServer:
        MCPServerStdio;

    constructor(
        private readonly logger: AgentLogger
    ) {

        this.mcpServer =
            new MCPServerStdio({

                name:
                    config.mcp.name,

                command:
                    config.mcp.command,

                args: [
                    config.mcp.serverPath,
                ],

                timeout:
                    config.mcp.timeoutMs,

                env:
                    getMcpServerEnv(),
            });
    }


    async connect(): Promise<void> {

        this.logger.info(
            "Connecting to MCP server"
        );

        try {

            await this.mcpServer.connect();

            this.logger.info(
                "Connected to MCP server"
            );

            console.log(
                "Connected to MCP server."
            );

        } catch (error) {

            this.logger.error(
                "Failed to connect to MCP server",
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : String(error),
                }
            );

            throw error;
        }
    }


    async getTools() {

        this.logger.info(
            "Discovering MCP tools"
        );

        const mcpTools =
            await this.mcpServer.listTools();

        const discoveredToolNames =
            mcpTools.map(
                tool => tool.name
            );

        validateMcpTools(
            discoveredToolNames
        );

        this.logger.info(
            "MCP tools discovered",
            {
                tools:
                    discoveredToolNames,
            }
        );

        console.log(
            "\nMCP tools discovered:"
        );

        console.log(
            discoveredToolNames
        );

        const tools =
            mcpTools.map(
                mcpTool =>
                    mcpToFunctionTool(
                        mcpTool,
                        this.mcpServer,
                        false
                    )
            );

        const approvalRequiredTools =
            new Set([
                "place_order",
                "cancel_order",
            ]);

        for (const tool of tools) {

            if (
                approvalRequiredTools.has(
                    tool.name
                )
            ) {
                tool.needsApproval =
                    async () => true;
            }
        }

        const placeOrderTool =
            tools.find(
                tool =>
                    tool.name === "place_order"
            );

        if (!placeOrderTool) {

            this.logger.error(
                "Required MCP tool was not found",
                {
                    toolName:
                        "place_order",
                }
            );

            throw new Error(
                "place_order MCP tool was not found."
            );
        }

        this.logger.info(
            "Approval policy configured",
            {
                tools: [
                    ...approvalRequiredTools,
                ],
                requiresApproval:
                    true,
            }
        );

        return tools;
    }


    async close(): Promise<void> {

        try {

            await this.mcpServer.close();

            this.logger.info(
                "MCP server closed"
            );

            console.log(
                "\nMCP server closed."
            );

        } catch (error) {

            this.logger.error(
                "Failed to close MCP server",
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : String(error),
                }
            );

            throw error;
        }
    }
}