import { Logger } from "../logger/Logger";
import { Product } from "../types/Product";
import {
    ProductRepository,
} from "../repositories/ProductRepository";

export class ProductService {

    constructor(
        private readonly logger: Logger,

        private readonly productRepository:
            ProductRepository
    ) {}

    async listProducts():
        Promise<Product[]> {

        this.logger.info(
            "[ProductService] Listing products"
        );

        const products =
            this.productRepository
                .listAll();

        this.logger.info(
            "[ProductService] Products listed",
            { count: products.length }
        );

        return products;
    }
}
