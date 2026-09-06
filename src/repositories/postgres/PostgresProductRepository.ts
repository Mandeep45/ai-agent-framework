import type { Pool, PoolClient } from "pg";

import { Product } from "../../types/Product";
import {
    ProductRepository,
} from "../ProductRepository";


type Queryable = Pool | PoolClient;

export class PostgresProductRepository
    implements ProductRepository {

    constructor(
        private readonly db: Queryable
    ) {}

    async listAll(): Promise<Product[]> {

        const result =
            await this.db.query<{
                id: string;
                name: string;
                quantity: number;
            }>(
                `
                    SELECT
                        p.id,
                        p.name,
                        COALESCE(i.quantity, 0)
                            AS quantity
                    FROM products p
                    LEFT JOIN inventory i
                        ON i.product_id = p.id
                    ORDER BY p.id
                `
            );

        return result.rows.map(
            row => ({
                id: row.id,
                name: row.name,
                quantity: row.quantity,
                available:
                    row.quantity > 0,
            })
        );
    }
}
