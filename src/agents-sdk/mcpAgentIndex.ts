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


const MAX_TURNS = 10;
const RUN_TIMEOUT_MS = 60_000;


function createRunSignal(): AbortSignal {

    return AbortSignal.timeout(
        RUN_TIMEOUT_MS
    );
}


async function runAgent(
    agent: Agent,
    input: string | any
) {

    return run(
        agent,
        input,
        {
            maxTurns: MAX_TURNS,
            signal: createRunSignal(),
        }
    );
}


async function main() {

    let mcpServer:
        MCPServerStdio | undefined;

    /*
     * Approval handling is now injected.
     *
     * The Agent does not know whether approval
     * comes from CLI, backend, UI, etc.
     */
    const approvalHandler:
        ApprovalHandler =
            new CliApprovalHandler();

    try {

        /*
         * Create model.
         */
        const groqModel =
            await createGroqModel();

        /*
         * Create MCP server.
         */
        mcpServer =
            new MCPServerStdio({

                name:
                    "Order MCP Server",

                command:
                    "tsx",

                args: [
                    "src/mcp/server.ts",
                ],

                timeout:
                    15000,
            });

        /*
         * Connect to MCP server.
         */
        try {

            await mcpServer.connect();

            console.log(
                "Connected to MCP server."
            );

        } catch (error) {

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

            mcpTools =
                await mcpServer.listTools();

        } catch (error) {

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

        /*
         * Initial agent run.
         */
        let result;

        try {

            result =
                await runAgent(
                    agent,
                    "Find customer ABC, check inventory for product XYZ, " +
                    "and place an order for 1 unit of product XYZ."
                );

        } catch (error) {

            handleRunError(error);

            return;
        }

        /*
         * Human approval / resume loop.
         */
        while (
            result.interruptions &&
            result.interruptions.length > 0
        ) {

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

                /*
                 * Approval is delegated to the
                 * configured ApprovalHandler.
                 *
                 * The Agent does not care whether
                 * approval comes from CLI, API, UI,
                 * or another system.
                 */
                const approved =
                    await approvalHandler
                        .requestApproval({
                            toolName,
                            argumentsJson,
                        });

                if (approved) {

                    console.log(
                        `[Approval] ${toolName}: APPROVED`
                    );

                    result.state.approve(
                        interruption
                    );

                } else {

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
                        result.state
                    );

            } catch (error) {

                handleRunError(error);

                return;
            }
        }

        console.log(
            "\nAgent response:\n"
        );

        console.log(
            result.finalOutput
        );

    } catch (error) {

        /*
         * Last-resort protection.
         */
        console.error(
            "\n[ERROR] Agent execution failed."
        );

        console.error(
            error instanceof Error
                ? error.message
                : error
        );

    } finally {

        /*
         * Always close MCP server.
         */
        if (mcpServer) {

            try {

                await mcpServer.close();

                console.log(
                    "\nMCP server closed."
                );

            } catch (error) {

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
    }
}


function handleRunError(
    error: unknown
): void {

    if (
        error instanceof MaxTurnsExceededError
    ) {

        console.error(
            "\n[ERROR] Agent reached the maximum number of turns."
        );

        console.error(
            `Maximum allowed turns: ${MAX_TURNS}`
        );

        return;
    }

    if (
        error instanceof ModelTimeoutError
    ) {

        console.error(
            "\n[ERROR] Model request timed out."
        );

        console.error(
            `Run timeout: ${RUN_TIMEOUT_MS}ms`
        );

        return;
    }

    if (
        error instanceof ToolTimeoutError
    ) {

        console.error(
            "\n[ERROR] Tool execution timed out."
        );

        return;
    }

    if (
        error instanceof ToolCallError
    ) {

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

        console.error(
            "\n[ERROR] Agent execution failed."
        );

        console.error(
            error.message
        );

        return;
    }

    console.error(
        "\n[ERROR] Unknown agent execution failure."
    );

    console.error(
        error
    );
}


main();
