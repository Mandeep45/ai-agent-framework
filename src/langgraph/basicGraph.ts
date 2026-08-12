import {
    StateGraph,
    StateSchema,
    START,
    END,
} from "@langchain/langgraph";

import { z } from "zod";

const State = new StateSchema({
    message: z.string(),
});

const graph = new StateGraph(State)
    .addNode("hello", async (state) => {
        return {
            message: `Hello from LangGraph. Received: ${state.message}`,
        };
    })
    .addEdge(START, "hello")
    .addEdge("hello", END)
    .compile();

async function main() {
    const result = await graph.invoke({
        message: "Hello Agent",
    });

    console.log(result);
}

main();