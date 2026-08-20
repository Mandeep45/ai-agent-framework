import { AgentResponse } from "../types/AgentResponse";
import { LLMResponse } from "../types/LLMResponse";
import { ToolCall } from "../types/ToolCall";
import {
    ToolExecutionResult,
} from "../types/ToolExecutionResult";
import { LLMProvider } from "../llm/LLMProvider";
import { ToolRegistry } from "../registry/ToolRegistry";
import { MessageHistory } from "./MessageHistory";
import { ToolValidator } from "../validation/ToolValidator";
import { ToolExecutionError } from "../errors/ToolExecutionError";
import { ApprovalPolicy } from "../approval/ApprovalPolicy";
import { SimpleApprovalPolicy } from "../approval/SimpleApprovalPolicy";
import { ApprovalService } from "../approval/ApprovalService";
import { CliApprovalService } from "../approval/CliApprovalService";

export class Agent {
    private readonly maxIterations = 10;
    private readonly toolTimeoutMs = 5000;

    constructor(
        private readonly registry: ToolRegistry,
        private readonly history: MessageHistory,
        private readonly llm: LLMProvider,
        private readonly validator = new ToolValidator(),
        private readonly approvalPolicy: ApprovalPolicy =
            new SimpleApprovalPolicy(),
        private readonly approvalService: ApprovalService =
            new CliApprovalService()
    ) {}

    async chat(
        message: string
    ): Promise<AgentResponse> {

        this.addUserMessage(message);

        let iteration = 0;

        while (
            iteration < this.maxIterations
        ) {
            iteration++;

            const response =
                await this.generateResponse();

            if (response.isFinal) {
                this.addAssistantMessage(
                    response.message ?? ""
                );

                return this.buildResponse(
                    response
                );
            }

            for (const toolCall of response.toolCalls) {
                this.addAssistantToolCall(toolCall);
            }

            const results = await Promise.all(
                response.toolCalls.map(
                    toolCall =>
                        this.executeToolSafely(toolCall)
                )
            );

            response.toolCalls.forEach(
                (toolCall, index) => {
                    this.addToolResult(
                        toolCall,
                        results[index]
                    );
                }
            );
        }

        throw new Error(
            `Agent exceeded the maximum iteration limit (${this.maxIterations}).`
        );
    }

    private addUserMessage(
        message: string
    ): void {
        this.history.add({
            role: "user",
            content: message,
        });
    }

    private addAssistantMessage(
        message: string
    ): void {
        this.history.add({
            role: "assistant",
            content: message,
        });
    }

    private addAssistantToolCall(
        toolCall: ToolCall
    ): void {
        this.history.add({
            role: "assistant_tool_call",
            toolCallId: toolCall.id,
            toolName: toolCall.toolName,
            arguments: toolCall.arguments,
        });
    }

    private async generateResponse():
        Promise<LLMResponse> {

        return this.llm.generate(
            this.history.getMessages(),
            this.registry.getDefinitions()
        );
    }

    private async executeToolSafely(
        toolCall: ToolCall
    ): Promise<ToolExecutionResult> {

        const tool =
            this.registry.get(
                toolCall.toolName
            );

        const requiresApproval =
            this.approvalPolicy.requiresApproval(
                toolCall
            );

        console.log(
            `[Approval] ${toolCall.toolName}: ${
                requiresApproval
                    ? "REQUIRED"
                    : "NOT REQUIRED"
            }`
        );

        if (requiresApproval) {

            const approved =
                await this.approvalService.requestApproval(
                    toolCall
                );

            if (!approved) {
                return {
                    success: false,
                    toolCallId: toolCall.id,
                    toolName: toolCall.toolName,
                    error: {
                        type: "approval_rejected",
                        message:
                            "Human approval was rejected.",
                    },
                };
            }

            console.log(
                `[Approval] ${toolCall.toolName}: APPROVED`
            );
        }

        try {
            this.validator.validate(
                tool.definition,
                toolCall.arguments
            );

            const data =
                await this.withTimeout(
                    tool.execute(
                        toolCall.arguments
                    ),
                    this.toolTimeoutMs
                );

            return {
                success: true,
                toolCallId: toolCall.id,
                toolName: toolCall.toolName,
                data,
            };

        } catch (error) {

            if (
                error instanceof Error &&
                error.name ===
                    "ToolValidationError"
            ) {
                return {
                    success: false,
                    toolCallId: toolCall.id,
                    toolName: toolCall.toolName,
                    error: {
                        type: "validation_error",
                        message: error.message,
                    },
                };
            }

            if (
                error instanceof Error &&
                error.name ===
                    "ToolTimeoutError"
            ) {
                return {
                    success: false,
                    toolCallId: toolCall.id,
                    toolName: toolCall.toolName,
                    error: {
                        type: "timeout_error",
                        message: error.message,
                    },
                };
            }

            const executionError =
                new ToolExecutionError(
                    toolCall.toolName,
                    error instanceof Error
                        ? error.message
                        : "Unknown error",
                    error
                );

            return {
                success: false,
                toolCallId: toolCall.id,
                toolName: toolCall.toolName,
                error: {
                    type: "execution_error",
                    message:
                        executionError.message,
                },
            };
        }
    }

    private async withTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number
    ): Promise<T> {

        let timeoutId:
            ReturnType<typeof setTimeout>;

        const timeoutPromise =
            new Promise<never>(
                (_, reject) => {

                    timeoutId =
                        setTimeout(
                            () => {

                                const error =
                                    new Error(
                                        `Tool execution exceeded ${timeoutMs}ms.`
                                    );

                                error.name =
                                    "ToolTimeoutError";

                                reject(error);
                            },
                            timeoutMs
                        );
                }
            );

        try {
            return await Promise.race([
                promise,
                timeoutPromise,
            ]);
        } finally {
            clearTimeout(
                timeoutId!
            );
        }
    }

    private addToolResult(
        toolCall: ToolCall,
        result: ToolExecutionResult
    ): void {

        this.history.add({
            role: "tool",
            toolCallId: toolCall.id,
            toolName: toolCall.toolName,
            content: result,
        });
    }

    private buildResponse(
        response: LLMResponse
    ): AgentResponse {

        return {
            message:
                response.message ?? "",
        };
    }
}