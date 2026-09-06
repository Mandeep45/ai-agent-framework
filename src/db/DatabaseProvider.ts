import {
    CustomerRepository,
} from "../repositories/CustomerRepository";
import {
    InventoryRepository,
} from "../repositories/InventoryRepository";
import {
    OrderRepository,
} from "../repositories/OrderRepository";
import {
    ProductRepository,
} from "../repositories/ProductRepository";
import {
    ChatRepository,
} from "../repositories/ChatRepository";


export type DatabaseKind =
    | "sqlite"
    | "postgres";

export interface DatabaseRepositories {
    customerRepository:
        CustomerRepository;
    inventoryRepository:
        InventoryRepository;
    orderRepository:
        OrderRepository;
    productRepository:
        ProductRepository;
    chatRepository:
        ChatRepository;
}

export interface DatabaseProvider {
    readonly kind: DatabaseKind;
    readonly repositories:
        DatabaseRepositories;

    withTransaction<T>(
        fn: (
            repositories: DatabaseRepositories
        ) => Promise<T>
    ): Promise<T>;

    close(): Promise<void>;
}
