import { Logger } from "../logger/Logger";

export interface Order {
    id: string;
    customerId: string;
    productId: string;
    quantity: number;
    status: "confirmed";
}

export class OrderService {
    constructor(
        private readonly logger: Logger
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

        // Simulate order processing
        await new Promise(
            resolve => setTimeout(resolve, 1000)
        );

        const order: Order = {
            id: `ORD-${Date.now()}`,
            customerId,
            productId,
            quantity,
            status: "confirmed",
        };

        this.logger.info(
            "[OrderService] Order confirmed",
            order
        );

        return order;
    }
}