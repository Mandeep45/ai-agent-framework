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
    getDatabase,
} from "./database";
import {
    SqliteCustomerRepository,
} from "../repositories/sqlite/SqliteCustomerRepository";
import {
    SqliteInventoryRepository,
} from "../repositories/sqlite/SqliteInventoryRepository";
import {
    SqliteOrderRepository,
} from "../repositories/sqlite/SqliteOrderRepository";


export interface DomainServices {
    customerService: CustomerService;
    inventoryService: InventoryService;
    orderService: OrderService;
}

export function createDomainServices(
    logger: Logger
): DomainServices {

    const db = getDatabase();

    const customerRepository =
        new SqliteCustomerRepository(
            db
        );

    const inventoryRepository =
        new SqliteInventoryRepository(
            db
        );

    const orderRepository =
        new SqliteOrderRepository(
            db
        );

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
                inventoryRepository,
                orderRepository,
                db
            ),
    };
}
