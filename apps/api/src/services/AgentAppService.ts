import type { Agent } from "@openai/agents";

import {
    MCPAgentTools,
} from "../../../../src/agents-sdk/MCPAgentTools";

import {
    createOrderAgent,
} from "../../../../src/agents-sdk/OrderAgent";

import {
    AgentRunner,
} from "../../../../src/agents-sdk/AgentRunner";

import {
    AgentLogger,
} from "../../../../src/logger/AgentLogger";

import {
    WebApprovalHandler,
} from "../../../../src/approval/WebApprovalHandler";

import {
    sessionEventBus,
} from "./SessionEventBus";


export interface ChatResult {
    sessionId: string;
    output: string;
}

export class AgentAppService {

    private agent: Agent | null = null;

    private readonly mcpTools =
        new MCPAgentTools(
            new AgentLogger()
        );

    private readonly approvalHandlers =
        new Map<
            string,
            WebApprovalHandler
        >();

    private initialized = false;

    async initialize(): Promise<void> {

        if (this.initialized) {
            return;
        }

        await this.mcpTools.connect();

        const tools =
            await this.mcpTools.getTools();

        this.agent =
            await createOrderAgent(
                tools,
                new AgentLogger()
            );

        this.initialized = true;
    }

    async shutdown(): Promise<void> {

        await this.mcpTools.close();

        this.initialized = false;
        this.agent = null;
    }

    getApprovalHandler(
        sessionId: string
    ): WebApprovalHandler {

        let handler =
            this.approvalHandlers.get(
                sessionId
            );

        if (!handler) {

            handler =
                new WebApprovalHandler(
                    sessionId,

                    approval => {
                        sessionEventBus.emit({
                            type:
                                "approval_required",
                            sessionId,
                            timestamp:
                                new Date().toISOString(),
                            data: {
                                approvalId:
                                    approval.id,
                                toolName:
                                    approval.toolName,
                                argumentsJson:
                                    approval.argumentsJson,
                            },
                        });
                    }
                );

            this.approvalHandlers.set(
                sessionId,
                handler
            );
        }

        return handler;
    }

    respondToApproval(
        sessionId: string,
        approvalId: string,
        approved: boolean
    ): boolean {

        const handler =
            this.approvalHandlers.get(
                sessionId
            );

        if (!handler) {
            return false;
        }

        const resolved =
            handler.respond(
                approvalId,
                approved
            );

        if (resolved) {
            sessionEventBus.emit({
                type:
                    "approval_resolved",
                sessionId,
                timestamp:
                    new Date().toISOString(),
                data: {
                    approvalId,
                    approved,
                },
            });
        }

        return resolved;
    }

    async runChat(
        sessionId: string,
        message: string
    ): Promise<ChatResult> {

        if (!this.agent) {
            throw new Error(
                "Agent is not initialized."
            );
        }

        const approvalHandler =
            this.getApprovalHandler(
                sessionId
            );

        const runner =
            new AgentRunner(
                approvalHandler,
                new AgentLogger()
            );

        sessionEventBus.emit({
            type: "agent_started",
            sessionId,
            timestamp:
                new Date().toISOString(),
            data: {
                message,
            },
        });

        try {

            const result =
                await runner.run(
                    this.agent,
                    message
                );

            const output =
                String(
                    result.finalOutput ?? ""
                );

            sessionEventBus.emit({
                type:
                    "agent_completed",
                sessionId,
                timestamp:
                    new Date().toISOString(),
                data: {
                    output,
                },
            });

            return {
                sessionId,
                output,
            };

        } catch (error) {

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : String(error);

            sessionEventBus.emit({
                type: "agent_error",
                sessionId,
                timestamp:
                    new Date().toISOString(),
                data: {
                    error:
                        errorMessage,
                },
            });

            throw error;

        } finally {

            this.approvalHandlers.delete(
                sessionId
            );
        }
    }
}

export const agentAppService =
    new AgentAppService();
