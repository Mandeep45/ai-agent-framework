import { AgentResponse } from "../types/AgentResponse";
import { LLMResponse } from "../types/LLMResponse";
import { ToolCall } from "../types/ToolCall";
import { LLMProvider } from "../llm/LLMProvider";
import { ToolRegistry } from "../registry/ToolRegistry";
import { MessageHistory } from "./MessageHistory";
import { AgentIterationError } from "../errors/AgentIterationError";
import { ToolExecutionError } from "../errors/ToolExecutionError";

export class Agent {
    constructor(
        private readonly registry: ToolRegistry,
        private readonly history: MessageHistory,
        private readonly llm: LLMProvider,
        private readonly maxIterations = 10
    ) {}

    async chat(message: string): Promise<AgentResponse> {
        this.addUserMessage(message);

        let iteration = 0;

        while (iteration < this.maxIterations) {
            iteration++;

            const response = await this.generateResponse();

            if (response.isFinal) {
                this.addAssistantMessage(response.message ?? "");

                return this.buildResponse(response);
            }

            for (const toolCall of response.toolCalls) {
                const result = await this.executeTool(toolCall);

                this.addToolResult(
                    toolCall.toolName,
                    result
                );
            }
        }

        throw new AgentIterationError(this.maxIterations);
    }

    private addUserMessage(message: string): void {
        this.history.add({
            role: "user",
            content: message,
        });
    }

    private addAssistantMessage(message: string): void {
        this.history.add({
            role: "assistant",
            content: message,
        });
    }

    private async generateResponse(): Promise<LLMResponse> {
        return this.llm.generate(
            this.history.getMessages(),
            this.registry.getDefinitions()
        );
    }

    private async executeTool(
        toolCall: ToolCall
    ): Promise<unknown> {
    
        const tool = this.registry.get(
            toolCall.toolName
        );
    
        try {
            return await tool.execute(toolCall.arguments);
        } catch (error) {
            throw new ToolExecutionError(
                toolCall.toolName,
                error
            );
        }
    }

    private addToolResult(
        toolName: string,
        result: unknown
    ): void {
        this.history.add({
            role: "tool",
            toolName,
            content: result,
        });
    }

    private buildResponse(
        response: LLMResponse
    ): AgentResponse {
        return {
            message: response.message ?? "",
        };
    }
}