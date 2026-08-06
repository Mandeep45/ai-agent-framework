import { AgentResponse } from "../types/AgentResponse";
import { LLMResponse } from "../types/LLMResponse";
import { ToolCall } from "../types/ToolCall";
import { LLMProvider } from "../llm/LLMProvider";
import { ToolRegistry } from "../registry/ToolRegistry";
import { MessageHistory } from "./MessageHistory";

export class Agent {
    constructor(
        private readonly registry: ToolRegistry,
        private readonly history: MessageHistory,
        private readonly llm: LLMProvider
    ) {}

    async chat(message: string): Promise<AgentResponse> {
        this.addUserMessage(message);

        const maxIterations = 10;
        let iteration = 0;

        while (iteration < maxIterations) {
            iteration++;

            const response = await this.generateResponse();

            if (response.isFinal) {
                this.addAssistantMessage(
                    response.message ?? ""
                );

                return this.buildResponse(response);
            }

            for (const toolCall of response.toolCalls) {
                const result =
                    await this.executeTool(toolCall);

                this.addToolResult(
                    toolCall.toolName,
                    result
                );
            }
        }

        throw new Error("Maximum iterations exceeded.");
    }

    private addUserMessage(message: string): void {
        this.history.add({
            role: "user",
            content: message
        });
    }

    private addAssistantMessage(message: string): void {
        this.history.add({
            role: "assistant",
            content: message
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

        return tool.execute(
            toolCall.arguments
        );
    }

    private addToolResult(
        toolName: string,
        result: unknown
    ): void {
        this.history.add({
            role: "tool",
            content: JSON.stringify({
                toolName,
                result
            })
        });
    }

    private buildResponse(
        response: LLMResponse
    ): AgentResponse {
        return {
            message: response.message ?? ""
        };
    }
}