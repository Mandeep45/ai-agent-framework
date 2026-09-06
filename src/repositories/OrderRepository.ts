import { Order } from "../types/Order";
import {
    OrderWithDetails,
} from "../types/OrderWithDetails";

export interface CreateOrderInput {
    customerId: string;
    productId: string;
    quantity: number;
}

export interface OrderRepository {
    create(
        input: CreateOrderInput
    ): Promise<Order>;

    findById(
        orderId: string
    ): Promise<Order | null>;

    findByCustomerId(
        customerId: string
    ): Promise<Order[]>;

    updateStatus(
        orderId: string,
        status: Order["status"]
    ): Promise<Order | null>;

    findAllWithDetails(
        customerId?: string
    ): Promise<OrderWithDetails[]>;
}
