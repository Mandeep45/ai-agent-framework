import { LLMProvider } from "../llm/LLMProvider";
import { ToolRegistry } from "../registry/ToolRegistry";
import { AgentResponse } from "../types/AgentResponse";
import { MessageHistory } from "./MessageHistory";

export class Agent {
  constructor(
    private readonly registry: ToolRegistry,
    private readonly history: MessageHistory,
    private readonly llm: LLMProvider
  ) {}

  async chat(message: string): Promise<AgentResponse> {
    // Store user message
    this.history.add({
      role: "user",
      content: message,
    });

    // Ask the LLM
    const response = await this.llm.generate(
      this.history.getAll(),
      this.registry.getAll()
    );

    // Store assistant response
    this.history.add({
      role: "assistant",
      content: response,
    });

    return {
        message: response
    };
  }
}