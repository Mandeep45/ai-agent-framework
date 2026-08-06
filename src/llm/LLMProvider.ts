import { Tool } from "../types/tools";

export interface LLMProvider {
    generate(
        messages: string[],
        tools: Tool[]
    ): Promise<string>;
}