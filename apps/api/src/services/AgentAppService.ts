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

import {
    sessionStore,
} from "./SessionStore";


export interface ChatResult {
    sessionId: string;
    output: string;
}


function emitSessionEvent(
    sessionId: string,
    type: Parameters<
        typeof sessionEventBus.emit
    >[0]["type"],
    data?: Record<string, unknown>
): void {

    sessionEventBus.emit({
        type,
        sessionId,
        timestamp:
            new Date().toISOString(),
        data,
    });
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
                        emitSessionEvent(
                            sessionId,
                            "approval_required",
                            {
                                approvalId:
                                    approval.id,
                                toolName:
                                    approval.toolName,
                                argumentsJson:
                                    approval.argumentsJson,
                            }
                        );
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
            emitSessionEvent(
                sessionId,
                "approval_resolved",
                {
                    approvalId,
                    approved,
                }
            );
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

        const memorySession =
            sessionStore.getOrCreate(
                sessionId
            );

        const runner =
            new AgentRunner(
                approvalHandler,
                new AgentLogger(),

                (() => {

                    let stepCounter = 0;

                    const activeSteps =
                        new Map<
                            string,
                            string
                        >();

                    return {
                        onToolStart: (
                            toolName: string,
                            argumentsJson: string
                        ) => {

                            const stepId =
                                `step-${++stepCounter}`;

                            activeSteps.set(
                                toolName,
                                stepId
                            );

                            emitSessionEvent(
                                sessionId,
                                "tool_call",
                                {
                                    stepId,
                                    toolName,
                                    argumentsJson,
                                }
                            );
                        },

                        onToolEnd: (
                            toolName: string,
                            result: string,
                            success: boolean
                        ) => {

                            const stepId =
                                activeSteps.get(
                                    toolName
                                ) ??
                                `step-${++stepCounter}`;

                            activeSteps.delete(
                                toolName
                            );

                            emitSessionEvent(
                                sessionId,
                                "tool_result",
                                {
                                    stepId,
                                    toolName,
                                    result,
                                    success,
                                }
                            );
                        },
                    };
                })()
            );

        emitSessionEvent(
            sessionId,
            "agent_started",
            { message }
        );

        try {

            const result =
                await runner.run(
                    this.agent,
                    message,
                    memorySession
                );

            const output =
                String(
                    result.finalOutput ?? ""
                );

            emitSessionEvent(
                sessionId,
                "agent_completed",
                { output }
            );

            return {
                sessionId,
                output,
            };

        } catch (error) {

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : String(error);

            emitSessionEvent(
                sessionId,
                "agent_error",
                {
                    error:
                        errorMessage,
                }
            );

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
