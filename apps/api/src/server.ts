import "./env";
import "dotenv/config";

import type {
    Server,
} from "node:http";

import cors from "cors";
import express from "express";

import {
    closeDatabase,
} from "../../../src/db/database";

import {
    agentAppService,
} from "./services/AgentAppService";

import {
    chatRouter,
} from "./routes/chat";

import {
    approvalRouter,
} from "./routes/approval";

import {
    eventsRouter,
} from "./routes/events";


const PORT =
    Number(
        process.env.API_PORT ?? 3001
    );

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

    closeDatabase();

    process.exit(0);
}


async function main() {

    const app = express();

    app.use(
        cors({
            origin:
                process.env.WEB_ORIGIN ??
                "http://localhost:5173",
        })
    );

    app.use(
        express.json()
    );

    app.get(
        "/api/health",
        (_req, res) => {
            res.json({
                status: "ok",
            });
        }
    );

    app.use(
        "/api/chat",
        chatRouter
    );

    app.use(
        "/api/approval",
        approvalRouter
    );

    app.use(
        "/api/events",
        eventsRouter
    );

    await agentAppService.initialize();

    httpServer = app.listen(
        PORT,
        () => {
            console.log(
                `API server running on http://localhost:${PORT}`
            );
        }
    );

    httpServer.on(
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
