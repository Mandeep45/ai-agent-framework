import type {
    ChatMessage,
    MessageRole,
} from "../types";

import {
    buildAuthHeaders,
    fetchWithColdStart,
    getApiBase,
} from "./http";

export async function fetchSessionMessages(
    sessionId: string
): Promise<ChatMessage[]> {

    const url =
        `${getApiBase()}/sessions/${sessionId}/messages`;

    const response =
        await fetchWithColdStart(
            url,
            {
                headers:
                    buildAuthHeaders(),
            }
        );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error ??
                "Failed to load chat history."
        );
    }

    const messages =
        data.messages as Array<{
            id: string;
            role: MessageRole;
            content: string;
        }>;

    return messages.map(message => ({
        id: message.id,
        role: message.role,
        content: message.content,
    }));
}
