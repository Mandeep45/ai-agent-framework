import { Logger } from "../logger/Logger";
import { ProductNotFoundError } from "../errors/ProductNotFoundError";

interface Inventory {
    productId: string;
    available: boolean;
    quantity: number;
}

export class InventoryService {

    private readonly inventory: Inventory[] = [
        {
            productId: "XYZ",
            available: true,
            quantity: 25,
        },
        {
            productId: "ABC",
            available: false,
            quantity: 0,
        },
    ];

    constructor(
        private readonly logger: Logger
    ) {}

    async checkInventory(
        productId: string
    ): Promise<Inventory> {

        this.logger.info(
            "[InventoryService] Checking inventory",
            { productId }
        );

        const inventory =
            this.inventory.find(
                item =>
                    item.productId === productId
            );

        if (!inventory) {

            this.logger.warn(
                "[InventoryService] Product not found",
                { productId }
            );

            throw new ProductNotFoundError(
                productId
            );
        }

        this.logger.info(
            "[InventoryService] Inventory found",
            {
                productId,
                quantity: inventory.quantity,
                available: inventory.available,
            }
        );

        return inventory;
    }
}