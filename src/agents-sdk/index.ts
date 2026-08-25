import "dotenv/config";

import {
    Agent,
    run,
} from "@openai/agents";

import {
    createGroqModel,
} from "./groqmodel";

import {
    getCustomerTool,
} from "./tools/getCustomerTool";

import {
    getInventoryTool,
} from "./tools/getInventoryTool";

import {
    placeOrderTool,
} from "./tools/placeOrderTool";

import readline from "node:readline/promises";
import {
    stdin,
    stdout,
} from "node:process";

async function askForApproval(
    toolName: string,
    argumentsJson: string
): Promise<boolean> {

    console.log(
        "\n=============================="
    );

    console.log(
        "      APPROVAL REQUIRED"
    );

    console.log(
        "=============================="
    );

    console.log(
        `Tool: ${toolName}`
    );

    console.log(
        `Arguments: ${argumentsJson}`
    );

    const rl =
        readline.createInterface({
            input: stdin,
            output: stdout,
        });

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

    const agent = new Agent({
        name: "Order Assistant",

        instructions:
            "You are an order assistant. " +
            "Use get_customer for customer information. " +
            "Use get_inventory for inventory information. " +
            "Use place_order when the user explicitly asks to place an order. " +
            "Never invent customer, inventory, or order information.",

        model: groqModel,

        tools: [
            getCustomerTool,
            getInventoryTool,
            placeOrderTool,
        ],
    });

    let result =
        await run(
            agent,
            "Place 1 unit of product XYZ for customer ABC."
        );

    while (
        result.interruptions &&
        result.interruptions.length > 0
    ) {

        for (
            const interruption
            of result.interruptions
        ) {

            const approved =
                await askForApproval(
                    interruption.name ?? "",
                    interruption.arguments ?? "{}"
                );

            if (approved) {

                console.log(
                    `[Approval] ${interruption.name}: APPROVED`
                );

                result.state.approve(
                    interruption
                );

            } else {

                console.log(
                    `[Approval] ${interruption.name}: REJECTED`
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
}

main().catch(
    console.error
);