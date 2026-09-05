import {
    ApprovalHandler,
    ApprovalRequest,
} from "./ApprovalHandler";

export interface PendingApproval {
    id: string;
    sessionId: string;
    toolName: string;
    argumentsJson: string;
}

type ApprovalResolver = (
    approved: boolean
) => void;

interface PendingEntry {
    sessionId: string;
    request: ApprovalRequest;
    resolve: ApprovalResolver;
}

export type ApprovalPendingListener = (
    approval: PendingApproval
) => void;

export class WebApprovalHandler
    implements ApprovalHandler {

    private readonly pending =
        new Map<string, PendingEntry>();

    constructor(
        private readonly sessionId: string,

        private readonly onPending?:
            ApprovalPendingListener
    ) {}

    async requestApproval(
        request: ApprovalRequest
    ): Promise<boolean> {

        const id = crypto.randomUUID();

        return new Promise<boolean>(
            resolve => {

                this.pending.set(
                    id,
                    {
                        sessionId:
                            this.sessionId,
                        request,
                        resolve,
                    }
                );

                this.onPending?.({
                    id,
                    sessionId:
                        this.sessionId,
                    toolName:
                        request.toolName,
                    argumentsJson:
                        request.argumentsJson,
                });
            }
        );
    }

    respond(
        approvalId: string,
        approved: boolean
    ): boolean {

        const entry =
            this.pending.get(
                approvalId
            );

        if (!entry) {
            return false;
        }

        entry.resolve(
            approved
        );

        this.pending.delete(
            approvalId
        );

        return true;
    }

    getPendingForSession(
        sessionId: string
    ): PendingApproval[] {

        const results:
            PendingApproval[] = [];

        for (
            const [id, entry]
            of this.pending
        ) {

            if (
                entry.sessionId !==
                sessionId
            ) {
                continue;
            }

            results.push({
                id,
                sessionId:
                    entry.sessionId,
                toolName:
                    entry.request.toolName,
                argumentsJson:
                    entry.request.argumentsJson,
            });
        }

        return results;
    }
}
