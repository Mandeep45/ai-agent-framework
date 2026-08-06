export interface UserMessage {
    role: "user";
    content: string;
}

export interface AssistantMessage {
    role: "assistant";
    content: string;
}

export interface ToolMessage {
    role: "tool";
    toolName: string;
    content: unknown;
}

export type Message =
    | UserMessage
    | AssistantMessage
    | ToolMessage;