export interface LLMResponse {
    type: "message" | "tool_call";
    message?: string;
    toolName?: string;
    arguments?: unknown;
}