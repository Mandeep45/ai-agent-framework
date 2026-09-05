import {
    Agent,
} from "@openai/agents";

import {
    createGroqModel,
} from "./groqmodel";

import {
    AgentLogger,
} from "../logger/AgentLogger";


const AGENT_NAME =
    "Order Assistant";


const AGENT_INSTRUCTIONS =
    "You are an order assistant. " +

    "Follow these rules strictly. " +

    "Use list_products when the user asks " +
    "what products are available or wants " +
    "to browse the catalog. " +

    "Use get_order_history when the user asks " +
    "about past orders, order IDs, or order " +
    "status for a customer. " +

    "For an order request, first retrieve " +
    "the customer using get_customer. " +

    "After the customer is successfully found, " +
    "check the requested product using get_inventory. " +

    "Only after both customer validation and " +
    "inventory validation succeed may you call " +
    "place_order. " +

    "Never call place_order if the customer " +
    "cannot be found. " +

    "Never call place_order if the product " +
    "cannot be found. " +

    "Never call place_order if the requested " +
    "quantity is greater than the available " +
    "inventory quantity. " +

    "Never call place_order for a quantity " +
    "that is zero or negative. " +

    "Never skip customer or inventory validation " +
    "just because the user directly asks to " +
    "place an order. " +

    "Never assume that an order was successful. " +
    "An order is successful only when the " +
    "place_order tool returns a successful result. " +

    "If a tool reports a validation failure, " +
    "do not continue to place the order. " +
    "Explain the actual failure to the user. " +

    "Do not invent customer information, " +
    "inventory information, product catalog data, " +
    "order IDs, or order status. " +

    "For information-only requests, use only " +
    "the tools required to answer the user's " +
    "question and do not call place_order.";


export async function createOrderAgent(
    tools: any[],
    logger: AgentLogger
): Promise<Agent> {

    logger.info(
        "Creating Order Assistant"
    );

    const groqModel =
        await createGroqModel();

    const agent =
        new Agent({

            name:
                AGENT_NAME,

            instructions:
                AGENT_INSTRUCTIONS,

            model:
                groqModel,

            tools,
        });

    logger.info(
        "Agent created",
        {
            agentName:
                AGENT_NAME,
        }
    );

    return agent;
}