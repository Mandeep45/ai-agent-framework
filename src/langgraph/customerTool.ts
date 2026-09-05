import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { CustomerService } from "../services/CustomerService";

export function createCustomerTool(
    customerService: CustomerService
) {
    return tool(
        async ({ customerId }) => {
            return customerService.findCustomer(
                customerId
            );
        },
        {
            name: "CustomerTool",
            description:
                "Find customer by customer ID.",
            schema: z.object({
                customerId: z.string(),
            }),
        }
    );
}