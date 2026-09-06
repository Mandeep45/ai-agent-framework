import {
    Pool,
    type PoolClient,
} from "pg";

import {
    DatabaseProvider,
    DatabaseRepositories,
} from "./DatabaseProvider";
import {
    POSTGRES_SCHEMA,
} from "./schema";
import {
    SEED_CUSTOMERS,
    SEED_INVENTORY,
    SEED_PRODUCTS,
} from "./seedData";
import {
    PostgresCustomerRepository,
} from "../repositories/postgres/PostgresCustomerRepository";
import {
    PostgresInventoryRepository,
} from "../repositories/postgres/PostgresInventoryRepository";
import {
    PostgresOrderRepository,
} from "../repositories/postgres/PostgresOrderRepository";
import {
    PostgresProductRepository,
} from "../repositories/postgres/PostgresProductRepository";


function createPostgresRepositories(
    db: Pool | PoolClient
): DatabaseRepositories {

    return {
        customerRepository:
            new PostgresCustomerRepository(
                db
            ),
        inventoryRepository:
            new PostgresInventoryRepository(
                db
            ),
        orderRepository:
            new PostgresOrderRepository(
                db
            ),
        productRepository:
            new PostgresProductRepository(
                db
            ),
    };
}


async function seedPostgres(
    pool: Pool,
    force = false
): Promise<void> {

    if (!force) {

        const result =
            await pool.query(
                "SELECT COUNT(*)::int AS count FROM customers"
            );

        const count =
            result.rows[0]?.count ?? 0;

        if (count > 0) {
            return;
        }
    }

    for (const customer of SEED_CUSTOMERS) {
        await pool.query(
            `
                INSERT INTO customers (id, name, email)
                VALUES ($1, $2, $3)
            `,
            [
                customer.id,
                customer.name,
                customer.email,
            ]
        );
    }

    for (const product of SEED_PRODUCTS) {
        await pool.query(
            `
                INSERT INTO products (id, name)
                VALUES ($1, $2)
            `,
            [
                product.id,
                product.name,
            ]
        );
    }

    for (const item of SEED_INVENTORY) {
        await pool.query(
            `
                INSERT INTO inventory (product_id, quantity)
                VALUES ($1, $2)
            `,
            [
                item.productId,
                item.quantity,
            ]
        );
    }
}


export class PostgresDatabaseProvider
    implements DatabaseProvider {

    readonly kind = "postgres" as const;

    readonly repositories:
        DatabaseRepositories;

    constructor(
        private readonly pool: Pool
    ) {

        this.repositories =
            createPostgresRepositories(
                pool
            );
    }

    async withTransaction<T>(
        fn: (
            repositories: DatabaseRepositories
        ) => Promise<T>
    ): Promise<T> {

        const client =
            await this.pool.connect();

        try {

            await client.query(
                "BEGIN"
            );

            const repositories =
                createPostgresRepositories(
                    client
                );

            const result =
                await fn(
                    repositories
                );

            await client.query(
                "COMMIT"
            );

            return result;

        } catch (error) {

            await client.query(
                "ROLLBACK"
            );

            throw error;

        } finally {

            client.release();
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}


export async function resetPostgresData(
    databaseUrl: string
): Promise<void> {

    const pool = new Pool({
        connectionString:
            databaseUrl,
        ssl:
            process.env.DATABASE_SSL ===
            "true"
                ? {
                    rejectUnauthorized:
                        false,
                }
                : undefined,
    });

    try {

        await pool.query(
            POSTGRES_SCHEMA
        );

        await pool.query(`
            TRUNCATE TABLE
                orders,
                inventory,
                products,
                customers
            RESTART IDENTITY CASCADE
        `);

        await seedPostgres(
            pool,
            true
        );

    } finally {
        await pool.end();
    }
}


export async function createPostgresProvider(
    databaseUrl: string
): Promise<PostgresDatabaseProvider> {

    const pool = new Pool({
        connectionString:
            databaseUrl,
        ssl:
            process.env.DATABASE_SSL ===
            "true"
                ? {
                    rejectUnauthorized:
                        false,
                }
                : undefined,
    });

    await pool.query(
        POSTGRES_SCHEMA
    );

    await seedPostgres(pool);

    return new PostgresDatabaseProvider(
        pool
    );
}
