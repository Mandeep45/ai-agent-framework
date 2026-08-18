import {
    StateGraph,
    StateSchema,
    START,
    END,
    MessagesValue,
    MemorySaver,
    interrupt,
} from "@langchain/langgraph";

import { llm } from "./llm";
import { createCustomerTool } from "./customerTool";
import { CustomerService } from "../services/CustomerService";
import { ConsoleLogger } from "../logger/ConsoleLogger";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { InventoryService } from "../services/InventoryService";
import { createInventoryTool } from "./inventoryTool";
import { OrderService } from "../services/OrderService";
import { createOrderTool } from "./orderTool";

import z from "zod";

const State = new StateSchema({
    messages: MessagesValue,

    approved: z.boolean().optional(),
});

const logger = new ConsoleLogger();

const checkpointer =
    new MemorySaver();

const customerService =
    new CustomerService(logger);

const inventoryService =
    new InventoryService(logger);

const orderService =
    new OrderService(logger);

const customerTool =
    createCustomerTool(
        customerService
    );

const inventoryTool =
    createInventoryTool(
        inventoryService
    );

const orderTool =
    createOrderTool(
        orderService
    );

const model =
    llm.bindTools([
        customerTool,
        inventoryTool,
        orderTool,
    ]);

const toolNode =
    new ToolNode(
        [
            customerTool,
            inventoryTool,
            orderTool,
        ],
        {
            handleToolErrors: true,
        }
    );

const llmNode = async (
    state: typeof State.State
) => {

    const response =
        await model.invoke(
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
        !lastMessage ||
        !("tool_calls" in lastMessage) ||
        !Array.isArray(
            lastMessage.tool_calls
        ) ||
        lastMessage.tool_calls.length === 0
    ) {
        return END;
    }

    const hasOrderCall =
        lastMessage.tool_calls.some(
            call =>
                call.name === "OrderTool"
        );

    if (hasOrderCall) {
        return "orderApproval";
    }

    return "tools";
};

const orderApprovalNode = async (
    state: typeof State.State
) => {

    const lastMessage =
        state.messages[
            state.messages.length - 1
        ];

    if (
        !lastMessage ||
        !("tool_calls" in lastMessage) ||
        !Array.isArray(
            lastMessage.tool_calls
        )
    ) {
        return {};
    }

    const toolCalls =
        lastMessage.tool_calls as Array<{
            name: string;
            args: unknown;
        }>;

    const orderCall =
        toolCalls.find(
            call =>
                call.name === "OrderTool"
        );

    if (!orderCall) {
        return {};
    }

    const decision =
        interrupt({
            action: "place_order",
            arguments: orderCall.args,
            question:
                "Do you approve this order?",
        });

    return {
        approved:
            decision === "yes",
    };
};

const routeAfterApproval = (
    state: typeof State.State
) => {

    console.log(
        "[Approval Router]",
        {
            approved:
                state.approved,
        }
    );

    if (state.approved === true) {
        return "tools";
    }

    return END;
};

export const graph =
    new StateGraph(State)

        .addNode(
            "llm",
            llmNode
        )

        .addNode(
            "tools",
            toolNode
        )

        .addNode(
            "orderApproval",
            orderApprovalNode
        )

        .addEdge(
            START,
            "llm"
        )

        .addConditionalEdges(
            "llm",
            routeAfterLLM
        )

        .addConditionalEdges(
            "orderApproval",
            routeAfterApproval
        )

        .addEdge(
            "tools",
            "llm"
        )

        .compile({
            checkpointer,
        });