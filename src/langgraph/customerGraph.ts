import {
    StateGraph,
    StateSchema,
    START,
    END,
    MessagesValue,
} from "@langchain/langgraph";

import { llm } from "./llm";
import { createCustomerTool } from "./customerTool";
import { CustomerService } from "../services/CustomerService";
import { ConsoleLogger } from "../logger/ConsoleLogger";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { InventoryService } from "../services/InventoryService";
import { createInventoryTool } from "./inventoryTool";
import { MemorySaver } from "@langchain/langgraph";
import z from "zod";

const State = new StateSchema({
    messages: MessagesValue
});

const logger = new ConsoleLogger();
const checkpointer = new MemorySaver();
const customerService =
    new CustomerService(logger);

const inventoryService =
    new InventoryService(logger);

const customerTool =
    createCustomerTool(
        customerService
    );

const inventoryTool =
    createInventoryTool(
        inventoryService
    );

const model =
    llm.bindTools([
        customerTool,
        inventoryTool,
    ]);

const toolNode = new ToolNode(
    [
        customerTool,
        inventoryTool,
    ],
    {
        handleToolErrors: true,
    }
);

const llmNode = async (
    state: typeof State.State
) => {
    const response = await model.invoke(
        state.messages
    );

    return {
        messages: [
            response,
        ],
    };
};

const routeAfterLLM = (
    state: typeof State.State
) => {
    const lastMessage =
        state.messages[
        state.messages.length - 1
        ];

    if (
        lastMessage &&
        "tool_calls" in lastMessage &&
        Array.isArray(lastMessage.tool_calls) &&
        lastMessage.tool_calls.length > 0
    ) {
        return "tools";
    }

    return END;
};



export const graph = new StateGraph(State)
    .addNode("llm", llmNode)
    .addNode("tools", toolNode)
    .addEdge(START, "llm")
    .addEdge("tools","llm")
    .addConditionalEdges(
        "llm",
        routeAfterLLM
    )
    .compile({checkpointer});

