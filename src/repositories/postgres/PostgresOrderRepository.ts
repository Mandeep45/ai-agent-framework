import type { Pool, PoolClient } from "pg";

import { Order, OrderStatus } from "../../types/Order";
import {
    OrderWithDetails,
} from "../../types/OrderWithDetails";
import {
    CreateOrderInput,
    OrderRepository,
} from "../OrderRepository";


type Queryable = Pool | PoolClient;

function mapOrderRow(
    row: {
        id: string;
        customer_id: string;
        product_id: string;
        quantity: number;
        status: OrderStatus;
        created_at: Date;
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
            row.created_at.toISOString(),
    };
}

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

    async findById(
        orderId: string
    ): Promise<Order | null> {

        const result =
            await this.db.query<{
                id: string;
                customer_id: string;
                product_id: string;
                quantity: number;
                status: OrderStatus;
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
                    WHERE id = $1
                `,
                [orderId]
            );

        const row =
            result.rows[0];

        if (!row) {
            return null;
        }

        return mapOrderRow(row);
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
                status: OrderStatus;
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
            mapOrderRow
        );
    }

    async updateStatus(
        orderId: string,
        status: OrderStatus
    ): Promise<Order | null> {

        const result =
            await this.db.query(
                `
                    UPDATE orders
                    SET status = $1
                    WHERE id = $2
                `,
                [
                    status,
                    orderId,
                ]
            );

        if (result.rowCount !== 1) {
            return null;
        }

        return this.findById(orderId);
    }

    async findAllWithDetails(
        customerId?: string
    ): Promise<OrderWithDetails[]> {

        const baseQuery = `
            SELECT
                o.id,
                o.customer_id,
                c.name AS customer_name,
                o.product_id,
                p.name AS product_name,
                o.quantity,
                o.status,
                o.created_at
            FROM orders o
            JOIN customers c
                ON c.id = o.customer_id
            JOIN products p
                ON p.id = o.product_id
        `;

        const result =
            customerId
                ? await this.db.query<{
                    id: string;
                    customer_id: string;
                    customer_name: string;
                    product_id: string;
                    product_name: string;
                    quantity: number;
                    status: OrderStatus;
                    created_at: Date;
                }>(
                    `${baseQuery}
                    WHERE o.customer_id = $1
                    ORDER BY o.created_at DESC`,
                    [customerId]
                )
                : await this.db.query<{
                    id: string;
                    customer_id: string;
                    customer_name: string;
                    product_id: string;
                    product_name: string;
                    quantity: number;
                    status: OrderStatus;
                    created_at: Date;
                }>(
                    `${baseQuery}
                    ORDER BY o.created_at DESC`
                );

        return result.rows.map(
            row => ({
                id: row.id,
                customerId:
                    row.customer_id,
                customerName:
                    row.customer_name,
                productId:
                    row.product_id,
                productName:
                    row.product_name,
                quantity:
                    row.quantity,
                status: row.status,
                createdAt:
                    row.created_at.toISOString(),
            })
        );
    }
}
