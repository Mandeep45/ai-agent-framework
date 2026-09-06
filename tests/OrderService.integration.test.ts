import {
    after,
    before,
    test,
} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
    closeDatabase,
    ensureDatabase,
} from "../src/db/initializeDatabase";

import {
    createDomainServices,
} from "../src/db/createDomainServices";

import {
    ConsoleLogger,
} from "../src/logger/ConsoleLogger";

import {
    OrderNotFoundError,
} from "../src/errors/OrderNotFoundError";

import {
    resetSqliteData,
} from "../src/db/sqliteDatabaseProvider";


const TEST_DB_PATH =
    process.env.DATABASE_PATH ??
    "data/test-integration.db";

before(async () => {

    const absolutePath =
        path.resolve(TEST_DB_PATH);

    for (const file of [
        absolutePath,
        `${absolutePath}-wal`,
        `${absolutePath}-shm`,
    ]) {

        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    }

    process.env.DATABASE_PATH =
        TEST_DB_PATH;

    await closeDatabase();
});

after(async () => {
    await closeDatabase();
});

async function createOrderService() {

    const databaseProvider =
        await ensureDatabase();

    const { orderService } =
        createDomainServices(
            new ConsoleLogger(),
            databaseProvider
        );

    return orderService;
}

test(
    "OrderService places, gets, lists, and cancels orders",
    async () => {

        const orderService =
            await createOrderService();

        const placed =
            await orderService.placeOrder(
                "ABC",
                "IPH14",
                1
            );

        assert.equal(
            placed.status,
            "confirmed"
        );

        const fetched =
            await orderService.getOrder(
                placed.id
            );

        assert.equal(
            fetched.id,
            placed.id
        );

        const allOrders =
            await orderService.listOrders();

        assert.ok(
            allOrders.length >= 1
        );

        assert.equal(
            allOrders[0].customerName,
            "John Doe"
        );

        const customerOrders =
            await orderService.listOrders(
                "ABC"
            );

        assert.ok(
            customerOrders.some(
                order =>
                    order.id ===
                    placed.id
            )
        );

        const cancelled =
            await orderService.cancelOrder(
                placed.id
            );

        assert.equal(
            cancelled.status,
            "cancelled"
        );

        await assert.rejects(
            () =>
                orderService.getOrder(
                    "ORD-missing"
                ),
            OrderNotFoundError
        );
    }
);
