import { Tool } from "../types/tools";
import { ToolDefinition } from "../types/ToolDefinition";
import { CustomerService } from "../services/CustomerService";

export class CustomerTool implements Tool {
    readonly definition: ToolDefinition = {
        name: "CustomerTool",
        description: "Find customer by customer ID.",
        inputSchema: {
            type: "object",
            properties: {
                customerId: {
                    type: "string",
                    description: "The customer ID to search for.",
                },
            },
            required: ["customerId"],
            additionalProperties: false,
        },
    };

    constructor(
        private readonly customerService: CustomerService
    ) {}

    async execute(
        input: unknown
    ): Promise<unknown> {
        const { customerId } = input as {
            customerId: string;
        };

        return this.customerService.findCustomer(
            customerId
        );
    }
}