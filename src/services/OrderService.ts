import { Logger } from "../logger/Logger";
import { Order } from "../types/Order";
import {
    OrderWithDetails,
} from "../types/OrderWithDetails";
import { CustomerNotFoundError } from "../errors/CustomerNotFoundError";
import { ProductNotFoundError } from "../errors/ProductNotFoundError";
import { InsufficientStockError } from "../errors/InsufficientStockError";
import { OrderNotFoundError } from "../errors/OrderNotFoundError";
import { OrderAlreadyCancelledError } from "../errors/OrderAlreadyCancelledError";
import {
    CustomerRepository,
} from "../repositories/CustomerRepository";
import {
    DatabaseProvider,
} from "../db/DatabaseProvider";

export class OrderService {

    constructor(
        private readonly logger: Logger,

        private readonly customerRepository:
            CustomerRepository,

        private readonly databaseProvider:
            DatabaseProvider
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
            await this.customerRepository
                .findById(customerId);

        if (!customer) {
            throw new CustomerNotFoundError(
                customerId
            );
        }

        const inventory =
            await this.databaseProvider
                .repositories
                .inventoryRepository
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
            await this.databaseProvider
                .withTransaction(
                    async repositories => {

                        const deducted =
                            await repositories
                                .inventoryRepository
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

                        return repositories
                            .orderRepository
                            .create({
                                customerId,
                                productId,
                                quantity,
                            });
                    }
                );

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
            await this.customerRepository
                .findById(customerId);

        if (!customer) {
            throw new CustomerNotFoundError(
                customerId
            );
        }

        const orders =
            await this.databaseProvider
                .repositories
                .orderRepository
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

    async listOrders(
        customerId?: string
    ): Promise<OrderWithDetails[]> {

        this.logger.info(
            "[OrderService] Listing orders",
            { customerId }
        );

        if (customerId) {

            const customer =
                await this.customerRepository
                    .findById(
                        customerId
                    );

            if (!customer) {
                throw new CustomerNotFoundError(
                    customerId
                );
            }
        }

        const orders =
            await this.databaseProvider
                .repositories
                .orderRepository
                .findAllWithDetails(
                    customerId
                );

        this.logger.info(
            "[OrderService] Orders listed",
            {
                customerId,
                count: orders.length,
            }
        );

        return orders;
    }

    async cancelOrder(
        orderId: string
    ): Promise<Order> {

        this.logger.info(
            "[OrderService] Cancelling order",
            { orderId }
        );

        const existingOrder =
            await this.databaseProvider
                .repositories
                .orderRepository
                .findById(orderId);

        if (!existingOrder) {
            throw new OrderNotFoundError(
                orderId
            );
        }

        if (
            existingOrder.status ===
            "cancelled"
        ) {
            throw new OrderAlreadyCancelledError(
                orderId
            );
        }

        const cancelledOrder =
            await this.databaseProvider
                .withTransaction(
                    async repositories => {

                        const restored =
                            await repositories
                                .inventoryRepository
                                .restoreStock(
                                    existingOrder.productId,
                                    existingOrder.quantity
                                );

                        if (!restored) {
                            throw new ProductNotFoundError(
                                existingOrder.productId
                            );
                        }

                        const updated =
                            await repositories
                                .orderRepository
                                .updateStatus(
                                    orderId,
                                    "cancelled"
                                );

                        if (!updated) {
                            throw new OrderNotFoundError(
                                orderId
                            );
                        }

                        return updated;
                    }
                );

        this.logger.info(
            "[OrderService] Order cancelled",
            cancelledOrder
        );

        return cancelledOrder;
    }
}
