import type Database from "better-sqlite3";

import { Product } from "../../types/Product";
import {
    ProductRepository,
} from "../ProductRepository";


export class SqliteProductRepository
    implements ProductRepository {

    constructor(
        private readonly db:
            Database.Database
    ) {}

    async listAll(): Promise<Product[]> {

        const rows =
            this.db.prepare(`
                SELECT
                    p.id,
                    p.name,
                    COALESCE(i.quantity, 0)
                        AS quantity
                FROM products p
                LEFT JOIN inventory i
                    ON i.product_id = p.id
                ORDER BY p.id
            `).all() as Array<{
                id: string;
                name: string;
                quantity: number;
            }>;

        return rows.map(row => ({
            id: row.id,
            name: row.name,
            quantity: row.quantity,
            available: row.quantity > 0,
        }));
    }
}
