import type { Pool, PoolClient } from "pg";

import { Customer } from "../../types/Customer";
import {
    CustomerRepository,
} from "../CustomerRepository";


type Queryable = Pool | PoolClient;

export class PostgresCustomerRepository
    implements CustomerRepository {

    constructor(
        private readonly db: Queryable
    ) {}

    async findById(
        customerId: string
    ): Promise<Customer | null> {

        const result =
            await this.db.query<Customer>(
                `
                    SELECT id, name, email
                    FROM customers
                    WHERE id = $1
                `,
                [customerId]
            );

        return (
            result.rows[0] ?? null
        );
    }

    async listAll(): Promise<Customer[]> {

        const result =
            await this.db.query<Customer>(
                `
                    SELECT id, name, email
                    FROM customers
                    ORDER BY id
                `
            );

        return result.rows;
    }
}
