import { Logger } from "../logger/Logger";
import { Order } from "../types/Order";
import { CustomerNotFoundError } from "../errors/CustomerNotFoundError";
import { ProductNotFoundError } from "../errors/ProductNotFoundError";
import { InsufficientStockError } from "../errors/InsufficientStockError";
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
}
