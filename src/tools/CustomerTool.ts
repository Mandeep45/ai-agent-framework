import { CustomerInput } from "../types/CustomerInput";
import { Customer } from "../types/Customer";
import { Tool } from "../types/tools";
import { CustomerService } from "../services/CustomerService";

export class CustomerTool
    implements Tool<CustomerInput, Customer> {

    readonly definition = {
        name: "CustomerTool",
        description: "Find customer by customer ID.",
        inputSchema: {
            type: "object",
            properties: {
                customerId: {
                    type: "string",
                },
            },
            required: ["customerId"],
        },
    };

    constructor(
        private readonly customerService: CustomerService
    ) {}

    async execute(
        input: CustomerInput
    ): Promise<Customer> {

        return this.customerService.findCustomer(
            input.customerId
        );

    }
}