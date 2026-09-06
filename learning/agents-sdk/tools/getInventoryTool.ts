import { tool } from "@openai/agents";
import { z } from "zod";

export const getInventoryTool = tool({
    name: "get_inventory",

    description:
        "Check inventory availability for a product.",

    parameters: z.object({
        productId: z
            .string()
            .describe(
                "The unique product ID."
            ),
    }),

    execute: async ({ productId }) => {

        console.log(
            `[InventoryService] Checking ${productId}`
        );

        if (productId === "XYZ") {
            return {
                productId: "XYZ",
                available: true,
                quantity: 25,
            };
        }

        return {
            productId,
            available: false,
            quantity: 0,
        };
    },
});