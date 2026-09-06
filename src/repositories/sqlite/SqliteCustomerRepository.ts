import type Database from "better-sqlite3";

import { Customer } from "../../types/Customer";
import {
    CustomerRepository,
} from "../CustomerRepository";


export class SqliteCustomerRepository
    implements CustomerRepository {

    constructor(
        private readonly db:
            Database.Database
    ) {}

    async findById(
        customerId: string
    ): Promise<Customer | null> {

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

    async listAll(): Promise<Customer[]> {

        const rows =
            this.db.prepare(`
                SELECT id, name, email
                FROM customers
                ORDER BY id
            `).all() as Customer[];

        return rows;
    }
}
