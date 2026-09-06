import type Database from "better-sqlite3";

import { Order, OrderStatus } from "../../types/Order";
import {
    CreateOrderInput,
    OrderRepository,
} from "../OrderRepository";


function mapOrderRow(
    row: {
        id: string;
        customer_id: string;
        product_id: string;
        quantity: number;
        status: OrderStatus;
        created_at: string;
    }
): Order {

    return {
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
    };
}


export class SqliteOrderRepository
    implements OrderRepository {

    constructor(
        private readonly db:
            Database.Database
    ) {}

    async create(
        input: CreateOrderInput
    ): Promise<Order> {

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

    async findById(
        orderId: string
    ): Promise<Order | null> {

        const row =
            this.db.prepare(`
                SELECT
                    id,
                    customer_id,
                    product_id,
                    quantity,
                    status,
                    created_at
                FROM orders
                WHERE id = ?
            `).get(orderId) as
                | {
                    id: string;
                    customer_id: string;
                    product_id: string;
                    quantity: number;
                    status: OrderStatus;
                    created_at: string;
                }
                | undefined;

        if (!row) {
            return null;
        }

        return mapOrderRow(row);
    }

    async findByCustomerId(
        customerId: string
    ): Promise<Order[]> {

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
                status: OrderStatus;
                created_at: string;
            }>;

        return rows.map(mapOrderRow);
    }

    async updateStatus(
        orderId: string,
        status: OrderStatus
    ): Promise<Order | null> {

        const result =
            this.db.prepare(`
                UPDATE orders
                SET status = ?
                WHERE id = ?
            `).run(
                status,
                orderId
            );

        if (result.changes !== 1) {
            return null;
        }

        return this.findById(orderId);
    }
}
