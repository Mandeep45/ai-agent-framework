import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { OrderService } from "../services/OrderService";

export const createOrderTool = (
    orderService: OrderService
) => {
    return tool(
        async ({
            customerId,
            productId,
            quantity,
        }) => {

            return orderService.placeOrder(
                customerId,
                productId,
                quantity
            );
        },
        {
            name: "OrderTool",

            description:
                "Place an order for a customer and product.",

            schema: z.object({
                customerId: z.string(),
                productId: z.string(),
                quantity: z.number().int().positive(),
            }),
        }
    );
};