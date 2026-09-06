export type OrderStatus =
    | "confirmed"
    | "cancelled";

export interface Order {
    id: string;
    customerId: string;
    productId: string;
    quantity: number;
    status: OrderStatus;
    createdAt?: string;
}
