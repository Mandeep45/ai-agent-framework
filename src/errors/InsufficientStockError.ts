export class InsufficientStockError
    extends Error {

    constructor(
        productId: string,
        requested: number,
        available: number
    ) {
        super(
            `Insufficient stock for product ${productId}. ` +
            `Requested ${requested}, but only ${available} available.`
        );

        this.name =
            "InsufficientStockError";
    }
}
