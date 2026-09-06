import type { Pool, PoolClient } from "pg";

import { Inventory } from "../../types/Inventory";
import {
    InventoryRepository,
} from "../InventoryRepository";


type Queryable = Pool | PoolClient;

export class PostgresInventoryRepository
    implements InventoryRepository {

    constructor(
        private readonly db: Queryable
    ) {}

    async findByProductId(
        productId: string
    ): Promise<Inventory | null> {

        const result =
            await this.db.query<{
                product_id: string;
                quantity: number;
            }>(
                `
                    SELECT product_id, quantity
                    FROM inventory
                    WHERE product_id = $1
                `,
                [productId]
            );

        const row =
            result.rows[0];

        if (!row) {
            return null;
        }

        const quantity =
            row.quantity;

        return {
            productId:
                row.product_id,
            quantity,
            available:
                quantity > 0,
        };
    }

    async deductStock(
        productId: string,
        quantity: number
    ): Promise<boolean> {

        const result =
            await this.db.query(
                `
                    UPDATE inventory
                    SET quantity = quantity - $1
                    WHERE product_id = $2
                      AND quantity >= $1
                `,
                [
                    quantity,
                    productId,
                ]
            );

        return (
            result.rowCount === 1
        );
    }
}
