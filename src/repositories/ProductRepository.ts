import { Product } from "../types/Product";

export interface ProductRepository {
    listAll(): Promise<Product[]>;
}
