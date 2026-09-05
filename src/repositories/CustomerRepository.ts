import { Customer } from "../types/Customer";

export interface CustomerRepository {
    findById(
        customerId: string
    ): Promise<Customer | null>;
}
