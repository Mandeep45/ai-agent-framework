import { Order } from "../types/Order";

export interface CreateOrderInput {
    customerId: string;
    productId: string;
    quantity: number;
}

export interface OrderRepository {
    create(
        input: CreateOrderInput
    ): Order;
}
