import "dotenv/config";

import {
    AgentLogger,
} from "../logger/AgentLogger";

import {
    ApprovalHandler,
} from "../approval/ApprovalHandler";

import {
    CliApprovalHandler,
} from "../approval/CliApprovalHandler";

import {
    MCPAgentTools,
} from "./MCPAgentTools";

import {
    createOrderAgent,
} from "./OrderAgent";

import {
    AgentRunner,
} from "./AgentRunner";


const INITIAL_REQUEST =
    "Find customer ABC, check inventory for product XYZ, " +
    "and place an order for 1 unit of product XYZ.";


async function main() {

    const logger =
        new AgentLogger();

    const approvalHandler:
        ApprovalHandler =
        new CliApprovalHandler();

    const mcpTools =
        new MCPAgentTools(
            logger
        );

    const runner =
        new AgentRunner(
            approvalHandler,
            logger
        );

    logger.info(
        "Agent application starting"
    );

    try {

        /*
         * Connect to MCP.
         */
        await mcpTools.connect();

        /*
         * Discover and configure tools.
         */
        const tools =
            await mcpTools.getTools();

        /*
         * Create Order Agent.
         */
        const agent =
            await createOrderAgent(
                tools,
                logger
            );

        /*
         * Execute agent.
         */
        const result =
            await runner.run(
                agent,
                INITIAL_REQUEST
            );

        console.log(
            "\nAgent response:\n"
        );

        console.log(
            result.finalOutput
        );

        logger.info(
            "Agent application completed"
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

        try {

            await mcpTools.close();

        } catch (error) {

            console.error(
                "[ERROR] MCP shutdown failed."
            );

            console.error(
                error instanceof Error
                    ? error.message
                    : error
            );
        }

        logger.info(
            "Agent application stopped"
        );
    }
}


main();