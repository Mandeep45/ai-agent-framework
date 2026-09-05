export interface Order {
    id: string;
    customerId: string;
    productId: string;
    quantity: number;
    status: "confirmed";
    createdAt?: string;
}
