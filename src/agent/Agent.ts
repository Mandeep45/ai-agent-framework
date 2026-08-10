import { AgentResponse } from "../types/AgentResponse";
import { LLMResponse } from "../types/LLMResponse";
import { ToolCall } from "../types/ToolCall";
import { LLMProvider } from "../llm/LLMProvider";
import { ToolRegistry } from "../registry/ToolRegistry";
import { MessageHistory } from "./MessageHistory";
import { ToolValidator } from "../validation/ToolValidator";
import { ToolExecutionError } from "../errors/ToolExecutionError";

export class Agent {
    private readonly maxIterations = 10;
    private readonly toolTimeoutMs = 5000;

    constructor(
        private readonly registry: ToolRegistry,
        private readonly history: MessageHistory,
        private readonly llm: LLMProvider,
        private readonly validator = new ToolValidator()
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

            for (
                const toolCall of response.toolCalls
            ) {
                this.addAssistantToolCall(
                    toolCall
                );

                const result =
                    await this.executeToolSafely(
                        toolCall
                    );

                this.addToolResult(
                    toolCall,
                    result
                );
            }
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
    ): Promise<unknown> {

        const tool =
            this.registry.get(
                toolCall.toolName
            );

        try {
            this.validator.validate(
                tool.definition,
                toolCall.arguments
            );

            return await this.withTimeout(
                tool.execute(
                    toolCall.arguments
                ),
                this.toolTimeoutMs
            );

        } catch (error) {

            if (
                error instanceof Error &&
                error.name ===
                    "ToolValidationError"
            ) {
                return {
                    success: false,
                    error: {
                        type: "validation_error",
                        toolName: toolCall.toolName,
                        message: error.message,
                    },
                };
            }

            if (
                error instanceof Error &&
                error.name ===
                    "ToolExecutionError"
            ) {
                return {
                    success: false,
                    error: {
                        type: "execution_error",
                        toolName: toolCall.toolName,
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
                    error: {
                        type: "timeout_error",
                        toolName: toolCall.toolName,
                        message: error.message,
                    },
                };
            }

            throw new ToolExecutionError(
                toolCall.toolName,
                error instanceof Error
                    ? error.message
                    : "Unknown error",
                error
            );
        }
    }

    private async withTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number
    ): Promise<T> {

        let timeoutId: ReturnType<
            typeof setTimeout
        >;

        const timeoutPromise =
            new Promise<never>(
                (_, reject) => {
                    timeoutId = setTimeout(
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
            clearTimeout(timeoutId!);
        }
    }

    private addToolResult(
        toolCall: ToolCall,
        result: unknown
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