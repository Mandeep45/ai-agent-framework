import { HumanMessage } from "@langchain/core/messages";
import { graph } from "./customerGraph";
import "dotenv/config";

async function main() {
    const config = {
        recursionLimit: 10,

        configurable: {
            thread_id: "customer-session-1",
        },
    };

    const result = await graph.invoke(
        {
            messages: [
                new HumanMessage(
                    "Find customer ABC and check inventory for product XYZ"
                ),
            ],
        },
        config
    );

    const lastMessage =
        result.messages[
            result.messages.length - 1
        ];

    console.log("\nFinal response:\n");

    console.log(lastMessage.content);
}

main().catch(console.error);