import { Message } from "../types/message";
import { Tool } from "../types/tools";

export interface LLMProvider {
    generate(
        messages: Message[],
        tools: Tool[]
    ): Promise<string>;
}