import {
    Router,
    type Request,
    type Response,
} from "express";

import {
    agentAppService,
} from "../services/AgentAppService";

import {
    getChatRepository,
} from "../services/domainServices";


export const chatRouter =
    Router();

chatRouter.post(
    "/",
    async (
        req: Request,
        res: Response
    ) => {

        const message =
            req.body?.message;

        const sessionId =
            req.body?.sessionId ??
            crypto.randomUUID();

        if (
            typeof message !== "string" ||
            message.trim() === ""
        ) {
            res.status(400).json({
                error:
                    "message is required.",
            });
            return;
        }

        try {

            const trimmedMessage =
                message.trim();

            const chatRepository =
                await getChatRepository();

            await chatRepository.appendMessage(
                sessionId,
                "user",
                trimmedMessage
            );

            const result =
                await agentAppService.runChat(
                    sessionId,
                    trimmedMessage
                );

            await chatRepository.appendMessage(
                sessionId,
                "assistant",
                result.output
            );

            res.json(result);

        } catch (error) {

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Agent execution failed.";

            res.status(500).json({
                sessionId,
                error:
                    errorMessage,
            });
        }
    }
);
