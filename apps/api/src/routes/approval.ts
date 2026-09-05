import {
    Router,
    type Request,
    type Response,
} from "express";

import {
    agentAppService,
} from "../services/AgentAppService";


export const approvalRouter =
    Router();

approvalRouter.post(
    "/:approvalId",
    (
        req: Request,
        res: Response
    ) => {

        const approvalId =
            req.params.approvalId;

        const sessionId =
            req.body?.sessionId;

        const approved =
            req.body?.approved === true;

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

        const resolved =
            agentAppService.respondToApproval(
                sessionId,
                approvalId,
                approved
            );

        if (!resolved) {
            res.status(404).json({
                error:
                    "Approval request not found or already resolved.",
            });
            return;
        }

        res.json({
            approvalId,
            sessionId,
            approved,
        });
    }
);
