import { approvalGraph } from "./approvalGraph";
import { Command } from "@langchain/langgraph";

async function main() {

    const config = {
        recursionLimit: 10,

        configurable: {
            thread_id: "approval-session-1",
        },
    };

    // First execution
    const firstResult =
        await approvalGraph.invoke(
            {
                message:
                    "Place order for product XYZ",
            },
            config
        );

    console.log(
        "\nFirst result:\n"
    );

    console.log(firstResult);

    // Resume after human approval
    const finalResult =
    await approvalGraph.invoke(
        new Command({
            resume: "no",
        }),
        config
    );
    console.log(
        "\nFinal result:\n"
    );

    console.log(finalResult);
}

main().catch(console.error);