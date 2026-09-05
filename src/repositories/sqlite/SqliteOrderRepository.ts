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
}
