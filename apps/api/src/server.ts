import "./env";
import "dotenv/config";

import cors from "cors";
import express from "express";

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

    app.listen(
        PORT,
        () => {
            console.log(
                `API server running on http://localhost:${PORT}`
            );
        }
    );

    const shutdown = async () => {
        await agentAppService.shutdown();
        process.exit(0);
    };

    process.on(
        "SIGINT",
        shutdown
    );

    process.on(
        "SIGTERM",
        shutdown
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
