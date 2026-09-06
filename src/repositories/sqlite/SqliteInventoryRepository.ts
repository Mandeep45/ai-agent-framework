import type Database from "better-sqlite3";

import { Inventory } from "../../types/Inventory";
import {
    InventoryRepository,
} from "../InventoryRepository";


export class SqliteInventoryRepository
    implements InventoryRepository {

    constructor(
        private readonly db:
            Database.Database
    ) {}

    async findByProductId(
        productId: string
    ): Promise<Inventory | null> {

        const row =
            this.db.prepare(`
                SELECT product_id, quantity
                FROM inventory
                WHERE product_id = ?
            `).get(productId) as
                | {
                    product_id: string;
                    quantity: number;
                }
                | undefined;

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
            this.db.prepare(`
                UPDATE inventory
                SET quantity = quantity - ?
                WHERE product_id = ?
                  AND quantity >= ?
            `).run(
                quantity,
                productId,
                quantity
            );

        return (
            result.changes === 1
        );
    }
}
