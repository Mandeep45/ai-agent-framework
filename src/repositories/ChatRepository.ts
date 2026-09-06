import {
    ChatMessageRecord,
    ChatMessageRole,
} from "../types/ChatMessageRecord";

export interface ChatRepository {
    ensureSession(
        sessionId: string
    ): Promise<void>;

    appendMessage(
        sessionId: string,
        role: ChatMessageRole,
        content: string
    ): Promise<ChatMessageRecord>;

    getMessages(
        sessionId: string
    ): Promise<ChatMessageRecord[]>;
}
