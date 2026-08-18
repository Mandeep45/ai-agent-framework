import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

import { CustomerService } from "../services/CustomerService";
import { ConsoleLogger } from "../logger/ConsoleLogger";
import { InventoryService } from "../services/InventoryService";
import { OrderService } from "../services/OrderService";

const server = new McpServer({
    name: "ai-agent-mcp-server",
    version: "1.0.0",
});

const logger = new ConsoleLogger();

const customerService =
    new CustomerService(logger);

const inventoryService =
    new InventoryService(logger);

const orderService = new OrderService(logger);

server.registerTool(
    "get_customer",
    {
        description:
            "Get customer information by customer ID",

        inputSchema: {
            customerId: z.string(),
        },
    },

    async ({ customerId }) => {

        const customer =
            await customerService.findCustomer(
                customerId
            );

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(customer),
                },
            ],
        };
    }
);

server.registerTool(
    "get_inventory",
    {
        description:
            "Check inventory for a product",

        inputSchema: {
            productId: z.string(),
        },
    },

    async ({ productId }) => {

        const inventory =
            await inventoryService.checkInventory(
                productId
            );

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(inventory),
                },
            ],
        };
    }
);

server.registerTool(
    "place_order",
    {
        description: "Place an order for a customer",

        inputSchema: {
            customerId: z.string(),
            productId: z.string(),
            quantity: z.number().positive(),
        },
    },

    async ({ customerId, productId, quantity }) => {

        const order =
            await orderService.placeOrder(
                customerId,
                productId,
                quantity
            );

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(order),
                },
            ],
        };
    }
);

async function main() {

    const transport =
        new StdioServerTransport();

    await server.connect(transport);
}

main().catch(console.error);