import { Logger } from "../logger/Logger";
import { Customer } from "../types/Customer";
import { CustomerNotFoundError } from "../errors/CustomerNotFoundError";

export class CustomerService {

    private readonly customers: Customer[] = [
        {
            id: "ABC",
            name: "John Doe",
            email: "john@example.com",
        },
        {
            id: "DEF",
            name: "Jane Doe",
            email: "jane@example.com",
        },
    ];

    constructor(
        private readonly logger: Logger
    ) {}

    async findCustomer(
        customerId: string
    ): Promise<Customer> {

        this.logger.info(
            "[CustomerService] Searching customer",
            { customerId }
        );

        const customer =
            this.customers.find(
                customer =>
                    customer.id === customerId
            );

        if (!customer) {

            this.logger.warn(
                "[CustomerService] Customer not found",
                { customerId }
            );

            throw new CustomerNotFoundError(
                customerId
            );
        }

        this.logger.info(
            "[CustomerService] Customer found",
            {
                customerId,
            }
        );

        return customer;
    }
}