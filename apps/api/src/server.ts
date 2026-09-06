import "./env";
import "dotenv/config";

import type {
    Server,
} from "node:http";

import {
    closeDatabase,
} from "../../../src/db/initializeDatabase";

import {
    config,
} from "../../../src/config";

import {
    agentAppService,
} from "./services/AgentAppService";

import {
    createApp,
} from "./createApp";


const PORT = config.api.port;

let httpServer: Server | null = null;
let isShuttingDown = false;


async function shutdown(
    signal: string
): Promise<void> {

    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    console.log(
        `\nShutting down API server (${signal})...`
    );

    if (httpServer) {

        await new Promise<void>(
            (resolve, reject) => {

                httpServer!.close(
                    error => {

                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve();
                    }
                );
            }
        ).catch(
            error => {
                console.error(
                    "Failed to close HTTP server:",
                    error
                );
            }
        );

        httpServer = null;
    }

    try {
        await agentAppService.shutdown();
    } catch (error) {
        console.error(
            "Failed to shut down agent services:",
            error
        );
    }

    await closeDatabase();

    process.exit(0);
}


async function main() {

    if (
        config.nodeEnv ===
            "production" &&
        !config.api.key
    ) {
        throw new Error(
            "API_KEY is required when NODE_ENV=production."
        );
    }

    if (
        config.nodeEnv !==
        "production"
    ) {
        const { freeDevPort } =
            await import(
                "./freeDevPort.js"
            );

        await freeDevPort(PORT);
    }

    const app = await createApp();

    const server = app.listen(
        PORT,
        () => {
            console.log(
                `API server running on http://localhost:${PORT}`
            );
        }
    );

    httpServer = server;

    server.on(
        "error",
        error => {

            if (
                "code" in error &&
                error.code ===
                    "EADDRINUSE"
            ) {
                console.error(
                    `\nPort ${PORT} is already in use.`
                );

                console.error(
                    "Stop the other API process, or set API_PORT in .env."
                );

                console.error(
                    "Windows: netstat -ano | findstr :" +
                        PORT +
                        "  then  taskkill /PID <pid> /F"
                );
            }

            throw error;
        }
    );

    process.on(
        "SIGINT",
        () => {
            void shutdown("SIGINT");
        }
    );

    process.on(
        "SIGTERM",
        () => {
            void shutdown("SIGTERM");
        }
    );
}


main().catch(
    error => {
        console.error(
            "Failed to start API server:",
            error
        );
        process.exit(1);
    }
);
