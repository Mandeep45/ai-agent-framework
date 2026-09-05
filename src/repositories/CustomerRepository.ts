import { Customer } from "../types/Customer";

export interface CustomerRepository {
    findById(
        customerId: string
    ): Customer | null;
}
