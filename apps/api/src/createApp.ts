import cors from "cors";
import express from "express";

import {
    config,
} from "../../../src/config";

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

import {
    ordersRouter,
} from "./routes/orders";

import {
    sessionsRouter,
} from "./routes/sessions";

import {
    apiKeyAuth,
} from "./middleware/apiKeyAuth";

import {
    rateLimiter,
} from "./middleware/rateLimiter";


export interface CreateAppOptions {
    initializeAgent?: boolean;
}

export async function createApp(
    options: CreateAppOptions = {}
): Promise<express.Express> {

    const initializeAgent =
        options.initializeAgent ??
        true;

    const app = express();

    const allowedOrigins =
        config.web.origins;

    app.use(
        cors({
            origin(
                origin,
                callback
            ) {

                if (!origin) {
                    callback(
                        null,
                        true
                    );
                    return;
                }

                const normalized =
                    origin.replace(
                        /\/$/,
                        ""
                    );

                const isAllowed =
                    allowedOrigins.some(
                        allowed =>
                            allowed ===
                                origin ||
                            allowed ===
                                normalized
                    );

                callback(
                    null,
                    isAllowed
                );
            },

            methods: [
                "GET",
                "POST",
                "OPTIONS",
            ],

            allowedHeaders: [
                "Content-Type",
                "x-api-key",
                "Authorization",
            ],
        })
    );

    app.use(
        express.json()
    );

    app.get(
        "/api/health",
        (
            _req: express.Request,
            res: express.Response
        ) => {
            res.json({
                status: "ok",
            });
        }
    );

    app.use(
        "/api/chat",
        apiKeyAuth,
        rateLimiter,
        chatRouter
    );

    app.use(
        "/api/approval",
        apiKeyAuth,
        approvalRouter
    );

    app.use(
        "/api/events",
        apiKeyAuth,
        eventsRouter
    );

    app.use(
        "/api/orders",
        apiKeyAuth,
        ordersRouter
    );

    app.use(
        "/api/sessions",
        apiKeyAuth,
        sessionsRouter
    );

    if (initializeAgent) {
        await agentAppService.initialize();
    }

    return app;
}
