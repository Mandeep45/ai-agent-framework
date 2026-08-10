import { LLMResponse } from "../types/LLMResponse";
import { Message } from "../types/message";
import { ToolDefinition } from "../types/ToolDefinition";
import { Tool } from "../types/tools";

export interface LLMProvider {
    generate(
        messages: Message[],
        tools: ToolDefinition[]
    ): Promise<LLMResponse>;
}