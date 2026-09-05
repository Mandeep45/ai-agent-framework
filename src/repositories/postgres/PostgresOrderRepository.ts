import type { Pool, PoolClient } from "pg";

import { Order } from "../../types/Order";
import {
    CreateOrderInput,
    OrderRepository,
} from "../OrderRepository";


type Queryable = Pool | PoolClient;

export class PostgresOrderRepository
    implements OrderRepository {

    constructor(
        private readonly db: Queryable
    ) {}

    async create(
        input: CreateOrderInput
    ): Promise<Order> {

        const orderId =
            `ORD-${Date.now()}`;

        await this.db.query(
            `
                INSERT INTO orders (
                    id,
                    customer_id,
                    product_id,
                    quantity,
                    status
                ) VALUES ($1, $2, $3, $4, $5)
            `,
            [
                orderId,
                input.customerId,
                input.productId,
                input.quantity,
                "confirmed",
            ]
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

    async findByCustomerId(
        customerId: string
    ): Promise<Order[]> {

        const result =
            await this.db.query<{
                id: string;
                customer_id: string;
                product_id: string;
                quantity: number;
                status: "confirmed";
                created_at: Date;
            }>(
                `
                    SELECT
                        id,
                        customer_id,
                        product_id,
                        quantity,
                        status,
                        created_at
                    FROM orders
                    WHERE customer_id = $1
                    ORDER BY created_at DESC
                `,
                [customerId]
            );

        return result.rows.map(
            row => ({
                id: row.id,
                customerId:
                    row.customer_id,
                productId:
                    row.product_id,
                quantity:
                    row.quantity,
                status: row.status,
                createdAt:
                    row.created_at.toISOString(),
            })
        );
    }
}
