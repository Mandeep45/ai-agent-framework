import {
    Router,
    type Request,
    type Response,
} from "express";

import {
    getChatRepository,
} from "../services/domainServices";


export const sessionsRouter =
    Router();

sessionsRouter.get(
    "/:sessionId/messages",
    async (
        req: Request,
        res: Response
    ) => {

        const sessionId =
            req.params.sessionId;

        if (
            typeof sessionId !== "string" ||
            sessionId.trim() === ""
        ) {
            res.status(400).json({
                error:
                    "sessionId is required.",
            });
            return;
        }

        try {

            const chatRepository =
                await getChatRepository();

            const messages =
                await chatRepository.getMessages(
                    sessionId
                );

            res.json({
                sessionId,
                messages,
            });

        } catch (error) {

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to load session messages.";

            res.status(500).json({
                error: errorMessage,
            });
        }
    }
);
