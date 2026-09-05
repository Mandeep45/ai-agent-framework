import type Database from "better-sqlite3";

import { Order } from "../../types/Order";
import {
    CreateOrderInput,
    OrderRepository,
} from "../OrderRepository";


export class SqliteOrderRepository
    implements OrderRepository {

    constructor(
        private readonly db:
            Database.Database
    ) {}

    create(
        input: CreateOrderInput
    ): Order {

        const orderId =
            `ORD-${Date.now()}`;

        this.db.prepare(`
            INSERT INTO orders (
                id,
                customer_id,
                product_id,
                quantity,
                status
            ) VALUES (?, ?, ?, ?, ?)
        `).run(
            orderId,
            input.customerId,
            input.productId,
            input.quantity,
            "confirmed"
        );

        return {
            id: orderId,
            customerId:
                input.customerId,
            productId:
                input.productId,
            quantity:
                input.quantity,
            status: "confirmed",
        };
    }

    findByCustomerId(
        customerId: string
    ): Order[] {

        const rows =
            this.db.prepare(`
                SELECT
                    id,
                    customer_id,
                    product_id,
                    quantity,
                    status,
                    created_at
                FROM orders
                WHERE customer_id = ?
                ORDER BY created_at DESC
            `).all(customerId) as Array<{
                id: string;
                customer_id: string;
                product_id: string;
                quantity: number;
                status: "confirmed";
                created_at: string;
            }>;

        return rows.map(row => ({
            id: row.id,
            customerId:
                row.customer_id,
            productId:
                row.product_id,
            quantity:
                row.quantity,
            status: row.status,
            createdAt:
                row.created_at,
        }));
    }
}
