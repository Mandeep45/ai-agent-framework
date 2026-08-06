import { Customer } from "../types/Customer";

export class CustomerService {
    async findCustomer(customerId: string): Promise<Customer> {
        console.log(
            `[CustomerService] Searching ${customerId}`
        );

        return {
            id: customerId,
            name: "John Doe",
            email: "john@example.com",
        };
    }
}