import { Logger } from "../logger/Logger";
import {
    CustomerService,
} from "../services/CustomerService";
import {
    InventoryService,
} from "../services/InventoryService";
import {
    OrderService,
} from "../services/OrderService";
import {
    ProductService,
} from "../services/ProductService";
import {
    DatabaseProvider,
} from "./DatabaseProvider";


export interface DomainServices {
    customerService: CustomerService;
    inventoryService: InventoryService;
    orderService: OrderService;
    productService: ProductService;
}

export function createDomainServices(
    logger: Logger,
    databaseProvider: DatabaseProvider
): DomainServices {

    const {
        customerRepository,
        inventoryRepository,
        orderRepository,
        productRepository,
    } = databaseProvider.repositories;

    return {
        customerService:
            new CustomerService(
                logger,
                customerRepository
            ),

        inventoryService:
            new InventoryService(
                logger,
                inventoryRepository
            ),

        orderService:
            new OrderService(
                logger,
                customerRepository,
                databaseProvider
            ),

        productService:
            new ProductService(
                logger,
                productRepository
            ),
    };
}
