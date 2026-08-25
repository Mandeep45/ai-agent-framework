import "dotenv/config";

import {
    Agent,
    run,
    MCPServerStdio,
    mcpToFunctionTool,
} from "@openai/agents";

import {
    createGroqModel,
} from "./groqmodel";

import {
    stdin,
    stdout,
} from "node:process";

import * as readline from "node:readline/promises";


async function askForApproval(
    toolName: string,
    argumentsJson: string
): Promise<boolean> {

    const rl =
        readline.createInterface({
            input: stdin,
            output: stdout,
        });

    console.log("\n==============================");
    console.log("      APPROVAL REQUIRED");
    console.log("==============================");

    console.log(`Tool: ${toolName}`);
    console.log(`Arguments: ${argumentsJson}`);

    const answer =
        await rl.question(
            "Approve this action? (y/n): "
        );

    rl.close();

    return (
        answer
            .trim()
            .toLowerCase() === "y"
    );
}


async function main() {

    const groqModel =
        await createGroqModel();

    const mcpServer =
        new MCPServerStdio({

            name:
                "Order MCP Server",

            command:
                "tsx",

            args: [
                "src/mcp/server.ts",
            ],

            timeout: 15000,
        });

    await mcpServer.connect();

    console.log(
        "Connected to MCP server."
    );

    const mcpTools =
        await mcpServer.listTools();

    console.log(
        "\nMCP tools discovered:"
    );

    console.log(
        mcpTools.map(
            tool => tool.name
        )
    );

    /*
     * Convert the MCP tools into
     * Agents SDK FunctionTools.
     */
    const tools =
        mcpTools.map(
            mcpTool =>
                mcpToFunctionTool(
                    mcpTool,
                    mcpServer,
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
     * mcpToFunctionTool() returns a
     * FunctionTool, so needsApproval
     * is available here.
     */
    placeOrderTool.needsApproval =
        async () => true;

    const agent =
        new Agent({

            name:
                "Order Assistant",

            instructions:
                "You are an order assistant. " +
                "Use the MCP tools to retrieve customer " +
                "and inventory information. " +
                "Use place_order when the user asks to " +
                "place an order. " +
                "Do not invent customer or inventory information.",

            model:
                groqModel,

            tools,
        });

    try {

        let result =
            await run(
                agent,
                "Find customer ABC, check inventory for product XYZ, " +
                "and place an order for 1 unit of product XYZ."
            );

        /*
         * The Agents SDK pauses execution when
         * a tool requires approval.
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

                const approved =
                    await askForApproval(
                        toolName,
                        argumentsJson
                    );

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
            result =
                await run(
                    agent,
                    result.state
                );
        }

        console.log(
            "\nAgent response:\n"
        );

        console.log(
            result.finalOutput
        );

    } finally {

        await mcpServer.close();

    }
}


main().catch(
    console.error
);