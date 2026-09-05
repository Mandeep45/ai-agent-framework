import { Logger } from "../logger/Logger";
import { ProductNotFoundError } from "../errors/ProductNotFoundError";
import { Inventory } from "../types/Inventory";
import {
    InventoryRepository,
} from "../repositories/InventoryRepository";

export class InventoryService {

    constructor(
        private readonly logger: Logger,

        private readonly inventoryRepository:
            InventoryRepository
    ) {}

    async checkInventory(
        productId: string
    ): Promise<Inventory> {

        this.logger.info(
            "[InventoryService] Checking inventory",
            { productId }
        );

        const inventory =
            this.inventoryRepository
                .findByProductId(
                    productId
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
                quantity:
                    inventory.quantity,
                available:
                    inventory.available,
            }
        );

        return inventory;
    }
}
