import { tool } from "@openai/agents";
import { z } from "zod";

export const placeOrderTool = tool({
    name: "place_order",

    description:
        "Place an order for a customer and product.",

    parameters: z.object({
        customerId: z
            .string()
            .describe(
                "The customer ID."
            ),

        productId: z
            .string()
            .describe(
                "The product ID."
            ),

        quantity: z
            .number()
            .int()
            .positive()
            .describe(
                "The quantity to order."
            ),
    }),

    needsApproval: true,

    execute: async ({
        customerId,
        productId,
        quantity,
    }) => {

        console.log(
            `[OrderService] Placing order: ` +
            `${customerId} → ${productId} x ${quantity}`
        );

        return {
            orderId:
                `ORD-${Date.now()}`,

            customerId,

            productId,

            quantity,

            status: "confirmed",
        };
    },
});