import { tool } from "@openai/agents";
import { z } from "zod";

export const getCustomerTool = tool({
    name: "get_customer",

    description:
        "Get customer information by customer ID.",

    parameters: z.object({
        customerId: z
            .string()
            .describe(
                "The unique customer ID."
            ),
    }),

    execute: async ({ customerId }) => {

        console.log(
            `[CustomerService] Searching ${customerId}`
        );

        if (customerId === "ABC") {
            return {
                id: "ABC",
                name: "John Doe",
                email: "john@example.com",
            };
        }

        return {
            error:
                `Customer '${customerId}' not found.`,
        };
    },
});