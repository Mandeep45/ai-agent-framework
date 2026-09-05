import type Database from "better-sqlite3";

import { Customer } from "../types/Customer";
import {
    CustomerRepository,
} from "../repositories/CustomerRepository";


export class SqliteCustomerRepository
    implements CustomerRepository {

    constructor(
        private readonly db:
            Database.Database
    ) {}

    findById(
        customerId: string
    ): Customer | null {

        const row =
            this.db.prepare(`
                SELECT id, name, email
                FROM customers
                WHERE id = ?
            `).get(customerId) as
                | Customer
                | undefined;

        return row ?? null;
    }
}
