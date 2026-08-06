import { ToolCall } from "./ToolCall";

export interface LLMResponse {
    isFinal: boolean;
    message?: string;
    toolCalls: ToolCall[];
}