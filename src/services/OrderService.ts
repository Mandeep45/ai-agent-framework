import type Database from "better-sqlite3";

import { Logger } from "../logger/Logger";
import { Order } from "../types/Order";
import { CustomerNotFoundError } from "../errors/CustomerNotFoundError";
import { ProductNotFoundError } from "../errors/ProductNotFoundError";
import { InsufficientStockError } from "../errors/InsufficientStockError";
import {
    CustomerRepository,
} from "../repositories/CustomerRepository";
import {
    InventoryRepository,
} from "../repositories/InventoryRepository";
import {
    OrderRepository,
} from "../repositories/OrderRepository";

export class OrderService {

    constructor(
        private readonly logger: Logger,

        private readonly customerRepository:
            CustomerRepository,

        private readonly inventoryRepository:
            InventoryRepository,

        private readonly orderRepository:
            OrderRepository,

        private readonly db:
            Database.Database
    ) {}

    async placeOrder(
        customerId: string,
        productId: string,
        quantity: number
    ): Promise<Order> {

        this.logger.info(
            "[OrderService] Placing order",
            {
                customerId,
                productId,
                quantity,
            }
        );

        const customer =
            this.customerRepository
                .findById(customerId);

        if (!customer) {
            throw new CustomerNotFoundError(
                customerId
            );
        }

        const inventory =
            this.inventoryRepository
                .findByProductId(
                    productId
                );

        if (!inventory) {
            throw new ProductNotFoundError(
                productId
            );
        }

        if (
            inventory.quantity <
            quantity
        ) {
            throw new InsufficientStockError(
                productId,
                quantity,
                inventory.quantity
            );
        }

        const order =
            this.db.transaction(
                () => {

                    const deducted =
                        this.inventoryRepository
                            .deductStock(
                                productId,
                                quantity
                            );

                    if (
                        !deducted
                    ) {
                        throw new InsufficientStockError(
                            productId,
                            quantity,
                            inventory.quantity
                        );
                    }

                    return this.orderRepository
                        .create({
                            customerId,
                            productId,
                            quantity,
                        });
                }
            )();

        this.logger.info(
            "[OrderService] Order confirmed",
            order
        );

        return order;
    }

    async getOrderHistory(
        customerId: string
    ): Promise<Order[]> {

        this.logger.info(
            "[OrderService] Fetching order history",
            { customerId }
        );

        const customer =
            this.customerRepository
                .findById(customerId);

        if (!customer) {
            throw new CustomerNotFoundError(
                customerId
            );
        }

        const orders =
            this.orderRepository
                .findByCustomerId(
                    customerId
                );

        this.logger.info(
            "[OrderService] Order history fetched",
            {
                customerId,
                count: orders.length,
            }
        );

        return orders;
    }
}
