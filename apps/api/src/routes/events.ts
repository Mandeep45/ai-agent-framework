import {
    Router,
    type Request,
    type Response,
} from "express";

import {
    sessionEventBus,
} from "../services/SessionEventBus";


export const eventsRouter =
    Router();

eventsRouter.get(
    "/:sessionId",
    (
        req: Request,
        res: Response
    ) => {

        const sessionId =
            req.params.sessionId;

        res.setHeader(
            "Content-Type",
            "text/event-stream"
        );

        res.setHeader(
            "Cache-Control",
            "no-cache"
        );

        res.setHeader(
            "Connection",
            "keep-alive"
        );

        res.flushHeaders();

        const sendEvent = (
            event: unknown
        ) => {
            res.write(
                `data: ${JSON.stringify(event)}\n\n`
            );
        };

        sendEvent({
            type: "connected",
            sessionId,
            timestamp:
                new Date().toISOString(),
        });

        const unsubscribe =
            sessionEventBus.subscribe(
                sessionId,
                sendEvent
            );

        const heartbeat =
            setInterval(() => {
                res.write(
                    ": heartbeat\n\n"
                );
            }, 15000);

        req.on(
            "close",
            () => {
                clearInterval(
                    heartbeat
                );
                unsubscribe();
            }
        );
    }
);
