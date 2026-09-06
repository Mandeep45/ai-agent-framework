import { AgentResponse } from "../types/AgentResponse";
import { LLMResponse } from "../types/LLMResponse";
import { ToolCall } from "../types/ToolCall";
import {
    ToolExecutionResult,
} from "../types/ToolExecutionResult";
import { LLMProvider } from "../llm/LLMProvider";
import { ToolRegistry } from "../registry/ToolRegistry";
import { MessageHistory } from "./MessageHistory";
import { ToolExecutionService } from "../application/ToolExecutionService";

export class Agent {
    private readonly maxIterations = 10;

    constructor(
        private readonly registry: ToolRegistry,
        private readonly history: MessageHistory,
        private readonly llm: LLMProvider,
        private readonly toolExecutionService:
            ToolExecutionService =
                new ToolExecutionService(
                    registry
                )
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

            const results =
                await Promise.all(
                    response.toolCalls.map(
                        toolCall =>
                            this.executeToolSafely(
                                toolCall
                            )
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

        return this.toolExecutionService.execute(
            toolCall
        );
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