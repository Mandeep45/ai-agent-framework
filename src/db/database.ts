import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import {
    config,
} from "../config";


let database:
    Database.Database | null = null;


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


function migrate(
    db: Database.Database
): void {

    db.exec(`
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS inventory (
            product_id TEXT PRIMARY KEY,
            quantity INTEGER NOT NULL
                CHECK (quantity >= 0),
            FOREIGN KEY (product_id)
                REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            quantity INTEGER NOT NULL
                CHECK (quantity > 0),
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
                DEFAULT (datetime('now')),
            FOREIGN KEY (customer_id)
                REFERENCES customers(id),
            FOREIGN KEY (product_id)
                REFERENCES products(id)
        );
    `);
}


function seed(
    db: Database.Database
): void {

    const customerCount =
        db.prepare(
            "SELECT COUNT(*) AS count FROM customers"
        ).get() as { count: number };

    if (customerCount.count > 0) {
        return;
    }

    const insertCustomer =
        db.prepare(`
            INSERT INTO customers (id, name, email)
            VALUES (@id, @name, @email)
        `);

    insertCustomer.run({
        id: "ABC",
        name: "John Doe",
        email: "john@example.com",
    });

    insertCustomer.run({
        id: "DEF",
        name: "Jane Doe",
        email: "jane@example.com",
    });

    const insertProduct =
        db.prepare(`
            INSERT INTO products (id, name)
            VALUES (@id, @name)
        `);

    insertProduct.run({
        id: "XYZ",
        name: "Widget XYZ",
    });

    insertProduct.run({
        id: "ABC",
        name: "Legacy Part ABC",
    });

    const insertInventory =
        db.prepare(`
            INSERT INTO inventory (product_id, quantity)
            VALUES (@productId, @quantity)
        `);

    insertInventory.run({
        productId: "XYZ",
        quantity: 25,
    });

    insertInventory.run({
        productId: "ABC",
        quantity: 0,
    });
}


export function getDatabase():
    Database.Database {

    if (database) {
        return database;
    }

    const dbPath =
        path.resolve(
            config.database.path
        );

    ensureDataDirectory(
        dbPath
    );

    database = new Database(
        dbPath
    );

    database.pragma(
        "journal_mode = WAL"
    );

    database.pragma(
        "foreign_keys = ON"
    );

    migrate(database);
    seed(database);

    return database;
}


export function closeDatabase(): void {

    if (database) {
        database.close();
        database = null;
    }
}
