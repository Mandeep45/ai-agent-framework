import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { InventoryService } from "../services/InventoryService";

export function createInventoryTool(
    inventoryService: InventoryService
) {
    return tool(
        async ({ productId }) => {
            return inventoryService.checkInventory(
                productId
            );
        },
        {
            name: "InventoryTool",
            description:
                "Check the available inventory for a product.",
            schema: z.object({
                productId: z
                    .string()
                    .describe(
                        "The product ID to check."
                    ),
            }),
        }
    );
}