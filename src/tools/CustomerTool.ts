import { CustomerService } from "../services/CustomerService";
import { Tool } from "../types/tools";

export class CustomerTool implements Tool {
  readonly name = "CustomerTool";

  readonly description = "Find customer by customer ID.";

  readonly inputSchema = {
    type: "object",
    properties: {
      customerId: {
        type: "string",
      },
    },
    required: ["customerId"],
  };

  constructor(
    private readonly customerService: CustomerService
  ) {}

  async execute(input: unknown): Promise<unknown> {
    const { customerId } = input as {
      customerId: string;
    };

    return this.customerService.findCustomer(customerId);
  }
}