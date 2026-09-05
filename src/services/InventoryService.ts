import { Logger } from "../logger/Logger";

export class InventoryService {
    constructor(
        private readonly logger: Logger
    ) {}

    async checkInventory(
        productId: string
    ): Promise<{
        productId: string;
        available: boolean;
        quantity: number;
    }> {
        this.logger.info(
            "[InventoryService] Checking inventory",
            { productId }
        );

        // Fake inventory data for now
        return {
            productId,
            available: true,
            quantity: 25,
        };
    }
}