import { HumanMessage } from "@langchain/core/messages";
import {
    Command,
} from "@langchain/langgraph";

import { graph } from "./customerGraph";

import "dotenv/config";

async function main() {

    const config = {
        recursionLimit: 10,

        configurable: {
            thread_id:
                "customer-session-1",
        },
    };

    // First invocation
    const firstResult =
        await graph.invoke(
            {
                messages: [
                    new HumanMessage(
                        "Find customer ABC, check inventory for product XYZ, and place an order for 1 unit of XYZ"
                    ),
                ],
            },
            config
        );

    console.log("\nFirst result:\n");

    console.dir(
        firstResult,
        { depth: null }
    );

    // Resume after human approval
    const finalResult =
        await graph.invoke(
            new Command({
                resume: "yes",
            }),
            config
        );

    const lastMessage =
        finalResult.messages[
            finalResult.messages.length - 1
        ];

    console.log("\nFinal response:\n");

    console.log(
        lastMessage.content
    );
}

main().catch(console.error);