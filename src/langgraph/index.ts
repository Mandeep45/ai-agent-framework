import { HumanMessage } from "@langchain/core/messages";

import { graph } from "./customerGraph";

import "dotenv/config";

async function main() {
    const result = await graph.invoke({
        messages: [
            new HumanMessage(
                "Find customer ABC"
            ),
        ],
    });

    const lastMessage =
        result.messages[
            result.messages.length - 1
        ];

    console.log("\nFinal response:\n");

    console.log(
        lastMessage.content
    );
}

main().catch(console.error);