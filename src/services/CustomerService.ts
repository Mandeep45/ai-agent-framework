import { Logger } from "../logger/Logger";
import { Customer } from "../types/Customer";

export class CustomerService {

    constructor(
        private readonly logger: Logger
    ) {}

    async findCustomer(customerId: string): Promise<Customer> {

        this.logger.info(
            `[CustomerService] Searching ${customerId}`
        );

        return {
            id: customerId,
            name: "John Doe",
            email: "john@example.com",
        };
    }
}