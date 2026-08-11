export interface UserMessage {
    role: "user";
    content: string;
}

export interface AssistantMessage {
    role: "assistant";
    content: string;
}

export interface AssistantToolCallMessage {
    role: "assistant_tool_call";
    toolCallId: string;
    toolName: string;
    arguments: unknown;
}

export interface ToolMessage {
    role: "tool";
    toolCallId: string;
    toolName: string;
    content: unknown;
}

export type Message =
    | UserMessage
    | AssistantMessage
    | AssistantToolCallMessage
    | ToolMessage;