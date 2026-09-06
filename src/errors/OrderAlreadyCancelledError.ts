export class OrderAlreadyCancelledError extends Error {
    constructor(orderId: string) {
        super(
            `Order ${orderId} is already cancelled.`
        );

        this.name = "OrderAlreadyCancelledError";
    }
}
