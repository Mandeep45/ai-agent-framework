import {
    after,
    before,
    test,
} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type {
    Server,
} from "node:http";
import {
    createServer,
} from "node:http";

import {
    closeDatabase,
} from "../src/db/initializeDatabase";

import {
    resetSqliteData,
} from "../src/db/sqliteDatabaseProvider";

import {
    resetDomainServicesCache,
} from "../apps/api/src/services/domainServices";

import {
    resetRateLimiter,
} from "../apps/api/src/middleware/rateLimiter";


const TEST_DB_PATH =
    process.env.DATABASE_PATH ??
    "data/test-integration.db";

const API_KEY =
    "test-integration-key";

let server: Server;
let baseUrl = "";

function authHeaders(): Record<
    string,
    string
> {
    return {
        "Content-Type":
            "application/json",
        "x-api-key": API_KEY,
    };
}

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
    process.env.API_KEY = API_KEY;
    process.env.GROQ_API_KEY =
        "test-key";
    process.env.RATE_LIMIT_MAX_REQUESTS =
        "2";
    process.env.RATE_LIMIT_WINDOW_MS =
        "60000";

    resetDomainServicesCache();
    resetRateLimiter();
    resetSqliteData();

    const { createApp } =
        await import(
            "../apps/api/src/createApp"
        );

    const app =
        await createApp({
            initializeAgent: false,
        });

    server = createServer(app);

    await new Promise<void>(
        resolve => {
            server.listen(
                0,
                "127.0.0.1",
                () => {
                    resolve();
                }
            );
        }
    );

    const address =
        server.address();

    const port =
        typeof address === "object" &&
        address
            ? address.port
            : 0;

    baseUrl =
        `http://127.0.0.1:${port}`;
});

after(async () => {

    await new Promise<void>(
        (resolve, reject) => {
            server.close(error => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        }
    );

    await closeDatabase();
    resetDomainServicesCache();
    resetRateLimiter();
});

test(
    "GET /api/health returns ok",
    async () => {

        const response =
            await fetch(
                `${baseUrl}/api/health`
            );

        assert.equal(
            response.status,
            200
        );

        const body =
            await response.json();

        assert.deepEqual(
            body,
            { status: "ok" }
        );
    }
);

test(
    "protected routes require API key",
    async () => {

        const response =
            await fetch(
                `${baseUrl}/api/orders`
            );

        assert.equal(
            response.status,
            401
        );
    }
);

test(
    "GET /api/orders returns seeded empty list",
    async () => {

        const response =
            await fetch(
                `${baseUrl}/api/orders`,
                {
                    headers:
                        authHeaders(),
                }
            );

        assert.equal(
            response.status,
            200
        );

        const body =
            await response.json();

        assert.ok(
            Array.isArray(body.orders)
        );
    }
);

test(
    "GET /api/sessions/:id/messages returns empty history",
    async () => {

        const sessionId =
            "test-session-123";

        const response =
            await fetch(
                `${baseUrl}/api/sessions/${sessionId}/messages`,
                {
                    headers:
                        authHeaders(),
                }
            );

        assert.equal(
            response.status,
            200
        );

        const body =
            await response.json();

        assert.equal(
            body.sessionId,
            sessionId
        );

        assert.deepEqual(
            body.messages,
            []
        );
    }
);

test(
    "POST /api/chat validates message body",
    async () => {

        const response =
            await fetch(
                `${baseUrl}/api/chat`,
                {
                    method: "POST",
                    headers:
                        authHeaders(),
                    body: JSON.stringify({
                        sessionId:
                            "chat-test",
                        message: "   ",
                    }),
                }
            );

        assert.equal(
            response.status,
            400
        );
    }
);

test(
    "POST /api/chat is rate limited",
    async () => {

        const payload = {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
                sessionId:
                    "rate-limit-test",
                message: "hi",
            }),
        };

        const first =
            await fetch(
                `${baseUrl}/api/chat`,
                payload
            );

        const second =
            await fetch(
                `${baseUrl}/api/chat`,
                payload
            );

        const third =
            await fetch(
                `${baseUrl}/api/chat`,
                payload
            );

        assert.ok(
            first.status === 429 ||
                first.status === 500
        );

        assert.ok(
            second.status === 429 ||
                second.status === 500
        );

        assert.equal(
            third.status,
            429
        );
    }
);

test(
    "chat messages persist and reload",
    async () => {

        const sessionId =
            "persist-session";

        const { getChatRepository } =
            await import(
                "../apps/api/src/services/domainServices"
            );

        const chatRepository =
            await getChatRepository();

        await chatRepository.appendMessage(
            sessionId,
            "user",
            "Hello"
        );

        await chatRepository.appendMessage(
            sessionId,
            "assistant",
            "Hi there"
        );

        const response =
            await fetch(
                `${baseUrl}/api/sessions/${sessionId}/messages`,
                {
                    headers:
                        authHeaders(),
                }
            );

        const body =
            await response.json();

        assert.equal(
            body.messages.length,
            2
        );

        assert.equal(
            body.messages[0].role,
            "user"
        );

        assert.equal(
            body.messages[1].content,
            "Hi there"
        );
    }
);
