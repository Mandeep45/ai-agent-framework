import { Logger } from "../logger/Logger";
import { Customer } from "../types/Customer";
import { CustomerNotFoundError } from "../errors/CustomerNotFoundError";
import {
    CustomerRepository,
} from "../repositories/CustomerRepository";

export class CustomerService {

    constructor(
        private readonly logger: Logger,

        private readonly customerRepository:
            CustomerRepository
    ) {}

    async findCustomer(
        customerId: string
    ): Promise<Customer> {

        this.logger.info(
            "[CustomerService] Searching customer",
            { customerId }
        );

        const customer =
            await this.customerRepository
                .findById(customerId);

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
            { customerId }
        );

        return customer;
    }

    async listCustomers():
        Promise<Customer[]> {

        this.logger.info(
            "[CustomerService] Listing customers"
        );

        const customers =
            await this.customerRepository
                .listAll();

        this.logger.info(
            "[CustomerService] Customers listed",
            { count: customers.length }
        );

        return customers;
    }
}
