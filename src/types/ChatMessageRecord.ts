export type ChatMessageRole =
    | "user"
    | "assistant"
    | "system"
    | "approval";

export interface ChatMessageRecord {
    id: string;
    sessionId: string;
    role: ChatMessageRole;
    content: string;
    createdAt: string;
}
