import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import {
    config,
} from "../config";
import {
    DatabaseProvider,
    DatabaseRepositories,
} from "./DatabaseProvider";
import {
    SQLITE_SCHEMA,
} from "./schema";
import {
    SEED_CUSTOMERS,
    SEED_INVENTORY,
    SEED_PRODUCTS,
} from "./seedData";
import {
    SqliteCustomerRepository,
} from "../repositories/sqlite/SqliteCustomerRepository";
import {
    SqliteInventoryRepository,
} from "../repositories/sqlite/SqliteInventoryRepository";
import {
    SqliteOrderRepository,
} from "../repositories/sqlite/SqliteOrderRepository";
import {
    SqliteProductRepository,
} from "../repositories/sqlite/SqliteProductRepository";
import {
    getProjectRoot,
} from "../utils/projectRoot";


function ensureDataDirectory(
    dbPath: string
): void {

    const directory =
        path.dirname(dbPath);

    if (
        !fs.existsSync(directory)
    ) {
        fs.mkdirSync(
            directory,
            { recursive: true }
        );
    }
}


function seedSqlite(
    db: Database.Database,
    force = false
): void {

    if (!force) {

        const customerCount =
            db.prepare(
                "SELECT COUNT(*) AS count FROM customers"
            ).get() as { count: number };

        if (customerCount.count > 0) {
            return;
        }
    }

    const insertCustomer =
        db.prepare(`
            INSERT INTO customers (id, name, email)
            VALUES (@id, @name, @email)
        `);

    for (const customer of SEED_CUSTOMERS) {
        insertCustomer.run(customer);
    }

    const insertProduct =
        db.prepare(`
            INSERT INTO products (id, name)
            VALUES (@id, @name)
        `);

    for (const product of SEED_PRODUCTS) {
        insertProduct.run(product);
    }

    const insertInventory =
        db.prepare(`
            INSERT INTO inventory (product_id, quantity)
            VALUES (@productId, @quantity)
        `);

    for (const item of SEED_INVENTORY) {
        insertInventory.run(item);
    }
}


function createSqliteRepositories(
    db: Database.Database
): DatabaseRepositories {

    return {
        customerRepository:
            new SqliteCustomerRepository(
                db
            ),
        inventoryRepository:
            new SqliteInventoryRepository(
                db
            ),
        orderRepository:
            new SqliteOrderRepository(
                db
            ),
        productRepository:
            new SqliteProductRepository(
                db
            ),
    };
}


export class SqliteDatabaseProvider
    implements DatabaseProvider {

    readonly kind = "sqlite" as const;

    readonly repositories:
        DatabaseRepositories;

    constructor(
        private readonly db:
            Database.Database
    ) {

        this.repositories =
            createSqliteRepositories(
                db
            );
    }

    async withTransaction<T>(
        fn: (
            repositories: DatabaseRepositories
        ) => Promise<T>
    ): Promise<T> {

        this.db.exec(
            "BEGIN IMMEDIATE"
        );

        try {

            const result =
                await fn(
                    this.repositories
                );

            this.db.exec("COMMIT");

            return result;

        } catch (error) {

            this.db.exec(
                "ROLLBACK"
            );

            throw error;
        }
    }

    async close(): Promise<void> {
        this.db.close();
    }
}


export function resetSqliteData(): void {

    const dbPath =
        path.resolve(
            getProjectRoot(),
            config.database.sqlitePath
        );

    ensureDataDirectory(
        dbPath
    );

    const db = new Database(
        dbPath
    );

    db.pragma(
        "journal_mode = WAL"
    );

    db.pragma(
        "foreign_keys = ON"
    );

    db.exec(SQLITE_SCHEMA);

    db.exec(`
        DELETE FROM orders;
        DELETE FROM inventory;
        DELETE FROM products;
        DELETE FROM customers;
    `);

    seedSqlite(
        db,
        true
    );

    db.close();
}


export function createSqliteProvider():
    SqliteDatabaseProvider {

    const dbPath =
        path.resolve(
            getProjectRoot(),
            config.database.sqlitePath
        );

    ensureDataDirectory(
        dbPath
    );

    const db = new Database(
        dbPath
    );

    db.pragma(
        "journal_mode = WAL"
    );

    db.pragma(
        "foreign_keys = ON"
    );

    db.exec(SQLITE_SCHEMA);
    seedSqlite(db);

    return new SqliteDatabaseProvider(
        db
    );
}
