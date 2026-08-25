import "dotenv/config";

import {
    Agent,
    run,
    MCPServerStdio,
    mcpToFunctionTool,
    MaxTurnsExceededError,
    ModelTimeoutError,
    ModelBehaviorError,
    ToolCallError,
    ToolTimeoutError,
} from "@openai/agents";

import {
    createGroqModel,
} from "./groqmodel";

import {
    ApprovalHandler,
} from "../approval/ApprovalHandler";

import {
    CliApprovalHandler,
} from "../approval/CliApprovalHandler";

import {
    AgentLogger,
} from "../logger/AgentLogger";

import {
    config,
} from "../config";

import {
    validateMcpTools,
} from "../security/ToolSecurityPolicy";


function createRunSignal(): AbortSignal {

    return AbortSignal.timeout(
        config.agent.runTimeoutMs
    );
}


async function runAgent(
    agent: Agent,
    input: string | any,
    logger: AgentLogger
) {

    const startTime =
        Date.now();

    logger.info(
        "Agent run started"
    );

    try {

        const result =
            await run(
                agent,
                input,
                {
                    maxTurns:
                        config.agent.maxTurns,

                    signal:
                        createRunSignal(),
                }
            );

        logger.info(
            "Agent run segment completed",
            {
                durationMs:
                    Date.now() - startTime,
            }
        );

        return result;

    } catch (error) {

        logger.error(
            "Agent run segment failed",
            {
                durationMs:
                    Date.now() - startTime,

                error:
                    error instanceof Error
                        ? error.message
                        : String(error),
            }
        );

        throw error;
    }
}


async function main() {

    const logger =
        new AgentLogger();

    const approvalHandler:
        ApprovalHandler =
        new CliApprovalHandler();

    let mcpServer:
        MCPServerStdio | undefined;

    logger.info(
        "Agent application starting"
    );

    try {

        /*
         * Create model.
         */
        logger.info(
            "Creating LLM model",
            {
                model:
                    config.groq.model,
            }
        );

        const groqModel =
            await createGroqModel();

        logger.info(
            "LLM model created"
        );

        /*
         * Create MCP server.
         */
        mcpServer =
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
            });

        logger.info(
            "MCP server configured",
            {
                name:
                    config.mcp.name,

                command:
                    config.mcp.command,

                serverPath:
                    config.mcp.serverPath,

                timeoutMs:
                    config.mcp.timeoutMs,
            }
        );

        /*
         * Connect to MCP server.
         */
        try {

            logger.info(
                "Connecting to MCP server"
            );

            await mcpServer.connect();

            logger.info(
                "Connected to MCP server"
            );

            console.log(
                "Connected to MCP server."
            );

        } catch (error) {

            logger.error(
                "Failed to connect to MCP server",
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : String(error),
                }
            );

            console.error(
                "\n[ERROR] Failed to connect to MCP server."
            );

            console.error(
                error instanceof Error
                    ? error.message
                    : error
            );

            return;
        }

        /*
         * Discover MCP tools.
         */
        let mcpTools;

        try {

            logger.info(
                "Discovering MCP tools"
            );

            mcpTools =
                await mcpServer.listTools();

            const discoveredToolNames =
                mcpTools.map(
                    tool => tool.name
                );

            validateMcpTools(
                discoveredToolNames
            );

            logger.info(
                "MCP tools discovered",
                {
                    tools:
                        mcpTools.map(
                            tool => tool.name
                        ),
                }
            );

        } catch (error) {

            logger.error(
                "Failed to discover MCP tools",
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : String(error),
                }
            );

            console.error(
                "\n[ERROR] Failed to discover MCP tools."
            );

            console.error(
                error instanceof Error
                    ? error.message
                    : error
            );

            return;
        }

        console.log(
            "\nMCP tools discovered:"
        );

        console.log(
            mcpTools.map(
                tool => tool.name
            )
        );

        /*
         * Convert MCP tools into
         * Agents SDK FunctionTools.
         */
        const tools =
            mcpTools.map(
                mcpTool =>
                    mcpToFunctionTool(
                        mcpTool,
                        mcpServer!,
                        false
                    )
            );

        /*
         * Find place_order.
         */
        const placeOrderTool =
            tools.find(
                tool =>
                    tool.name === "place_order"
            );

        if (!placeOrderTool) {

            logger.error(
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

        /*
         * Every place_order call requires
         * human approval.
         */
        placeOrderTool.needsApproval =
            async () => true;

        logger.info(
            "Approval policy configured",
            {
                toolName:
                    "place_order",

                requiresApproval:
                    true,
            }
        );

        /*
         * Create agent.
         */
        const agent =
            new Agent({

                name:
                    "Order Assistant",

                instructions:
                    "You are an order assistant. " +

                    "Follow these rules strictly. " +

                    "For an order request, first retrieve " +
                    "the customer using get_customer. " +

                    "After the customer is successfully found, " +
                    "check the requested product using " +
                    "get_inventory. " +

                    "Only after both customer validation and " +
                    "inventory validation succeed may you call " +
                    "place_order. " +

                    "Never call place_order if the customer " +
                    "cannot be found. " +

                    "Never call place_order if the product " +
                    "cannot be found. " +

                    "Never call place_order if the requested " +
                    "quantity is greater than the available " +
                    "inventory quantity. " +

                    "Never call place_order for a quantity " +
                    "that is zero or negative. " +

                    "Never skip customer or inventory validation " +
                    "just because the user directly asks to " +
                    "place an order. " +

                    "Never assume that an order was successful. " +
                    "An order is successful only when the " +
                    "place_order tool returns a successful result. " +

                    "If a tool reports a validation failure, " +
                    "do not continue to place the order. " +
                    "Explain the actual failure to the user. " +

                    "Do not invent customer information, " +
                    "inventory information, order IDs, or " +
                    "order status. " +

                    "For information-only requests, use only " +
                    "the tools required to answer the user's " +
                    "question and do not call place_order.",

                model:
                    groqModel,

                tools,
            });

        logger.info(
            "Agent created",
            {
                agentName:
                    "Order Assistant",
            }
        );

        /*
         * Initial agent run.
         */
        let result;

        try {

            result =
                await runAgent(
                    agent,

                    "Find customer ABC, check inventory for product XYZ, " +
                    "and place an order for 1 unit of product XYZ.",

                    logger
                );

        } catch (error) {

            handleRunError(
                error,
                logger
            );

            return;
        }

        /*
         * Human approval / resume loop.
         */
        while (
            result.interruptions &&
            result.interruptions.length > 0
        ) {

            logger.info(
                "Agent execution interrupted for approval",
                {
                    interruptionCount:
                        result.interruptions.length,
                }
            );

            for (
                const interruption
                of result.interruptions
            ) {

                const toolName =
                    interruption.name ??
                    "unknown_tool";

                const argumentsJson =
                    interruption.arguments ??
                    "{}";

                logger.info(
                    "Approval requested",
                    {
                        toolName,
                        arguments:
                            argumentsJson,
                    }
                );

                const approved =
                    await approvalHandler
                        .requestApproval({
                            toolName,
                            argumentsJson,
                        });

                if (approved) {

                    logger.info(
                        "Tool approval granted",
                        {
                            toolName,
                        }
                    );

                    console.log(
                        `[Approval] ${toolName}: APPROVED`
                    );

                    result.state.approve(
                        interruption
                    );

                } else {

                    logger.warn(
                        "Tool approval rejected",
                        {
                            toolName,
                        }
                    );

                    console.log(
                        `[Approval] ${toolName}: REJECTED`
                    );

                    result.state.reject(
                        interruption,
                        {
                            message:
                                "The user rejected this action.",
                        }
                    );
                }
            }

            /*
             * Resume the existing run.
             */
            try {

                result =
                    await runAgent(
                        agent,
                        result.state,
                        logger
                    );

            } catch (error) {

                handleRunError(
                    error,
                    logger
                );

                return;
            }
        }

        logger.info(
            "Agent run completed successfully"
        );

        console.log(
            "\nAgent response:\n"
        );

        console.log(
            result.finalOutput
        );

    } catch (error) {

        logger.error(
            "Unhandled agent application error",
            {
                error:
                    error instanceof Error
                        ? error.message
                        : String(error),
            }
        );

        console.error(
            "\n[ERROR] Agent execution failed."
        );

        console.error(
            error instanceof Error
                ? error.message
                : error
        );

    } finally {

        if (mcpServer) {

            try {

                await mcpServer.close();

                logger.info(
                    "MCP server closed"
                );

                console.log(
                    "\nMCP server closed."
                );

            } catch (error) {

                logger.error(
                    "Failed to close MCP server",
                    {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    }
                );

                console.error(
                    "[ERROR] Failed to close MCP server."
                );

                console.error(
                    error instanceof Error
                        ? error.message
                        : error
                );
            }
        }

        logger.info(
            "Agent application stopped"
        );
    }
}


function handleRunError(
    error: unknown,
    logger: AgentLogger
): void {

    if (
        error instanceof MaxTurnsExceededError
    ) {

        logger.error(
            "Agent reached maximum number of turns",
            {
                maxTurns:
                    config.agent.maxTurns,
            }
        );

        console.error(
            "\n[ERROR] Agent reached the maximum number of turns."
        );

        console.error(
            `Maximum allowed turns: ${config.agent.maxTurns}`
        );

        return;
    }

    if (
        error instanceof ModelTimeoutError
    ) {

        logger.error(
            "Model request timed out",
            {
                timeoutMs:
                    config.agent.runTimeoutMs,
            }
        );

        console.error(
            "\n[ERROR] Model request timed out."
        );

        console.error(
            `Run timeout: ${config.agent.runTimeoutMs}ms`
        );

        return;
    }

    if (
        error instanceof ToolTimeoutError
    ) {

        logger.error(
            "Tool execution timed out"
        );

        console.error(
            "\n[ERROR] Tool execution timed out."
        );

        return;
    }

    if (
        error instanceof ToolCallError
    ) {

        logger.error(
            "MCP tool execution failed",
            {
                error:
                    error.message,
            }
        );

        console.error(
            "\n[ERROR] MCP tool execution failed."
        );

        console.error(
            error.message
        );

        return;
    }

    if (
        error instanceof ModelBehaviorError
    ) {

        logger.error(
            "Model produced invalid agent behavior",
            {
                error:
                    error.message,
            }
        );

        console.error(
            "\n[ERROR] Model produced invalid agent behavior."
        );

        console.error(
            error.message
        );

        return;
    }

    if (
        error instanceof Error
    ) {

        logger.error(
            "Agent execution failed",
            {
                error:
                    error.message,
            }
        );

        console.error(
            "\n[ERROR] Agent execution failed."
        );

        console.error(
            error.message
        );

        return;
    }

    logger.error(
        "Unknown agent execution failure",
        {
            error:
                String(error),
        }
    );

    console.error(
        "\n[ERROR] Unknown agent execution failure."
    );

    console.error(
        error
    );
}


main();