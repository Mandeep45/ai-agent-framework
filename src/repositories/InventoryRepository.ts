import { Inventory } from "../types/Inventory";

export interface InventoryRepository {
    findByProductId(
        productId: string
    ): Inventory | null;

    deductStock(
        productId: string,
        quantity: number
    ): boolean;
}
