import { AgentResponse } from "../types/AgentResponse";
import { LLMResponse } from "../types/LLMResponse";
import { ToolCall } from "../types/ToolCall";
import { MessageHistory } from "./MessageHistory";
import { LLMProvider } from "../llm/LLMProvider";
import { ToolRegistry } from "../registry/ToolRegistry";

export class Agent {
  constructor(
    private readonly registry: ToolRegistry,
    private readonly history: MessageHistory,
    private readonly llm: LLMProvider
  ) {}

  async chat(message: string): Promise<AgentResponse> {
    this.addUserMessage(message);

    // Temporary integration test
    const result = await this.executeTool({
      toolName: "CustomerTool",
      arguments: {
        customerId: "ABC123",
      },
    });

    console.log("Tool Result:", result);

    const llmResponse = await this.generateResponse();

    return this.buildResponse(llmResponse);
  }

  private addUserMessage(message: string): void {
    this.history.add({
      role: "user",
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
    const tool = this.registry.get(toolCall.toolName);

    return tool.execute(toolCall.arguments);
  }

  private buildResponse(
    response: LLMResponse
  ): AgentResponse {
    return {
      message: response.message ?? "",
    };
  }
}