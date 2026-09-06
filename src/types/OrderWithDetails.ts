import { OrderStatus } from "./Order";

export interface OrderWithDetails {
    id: string;
    customerId: string;
    customerName: string;
    productId: string;
    productName: string;
    quantity: number;
    status: OrderStatus;
    createdAt: string;
}
