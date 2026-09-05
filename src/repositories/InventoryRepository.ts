import { Inventory } from "../types/Inventory";

export interface InventoryRepository {
    findByProductId(
        productId: string
    ): Promise<Inventory | null>;

    deductStock(
        productId: string,
        quantity: number
    ): Promise<boolean>;
}
