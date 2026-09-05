import type {
    PendingApproval,
    SessionEvent,
} from "../types";

const API_BASE = "/api";

export function createSessionId(): string {
    return crypto.randomUUID();
}

export async function sendChatMessage(
    sessionId: string,
    message: string
): Promise<{
    sessionId: string;
    output: string;
}> {

    const response = await fetch(
        `${API_BASE}/chat`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify({
                sessionId,
                message,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error ??
                "Chat request failed."
        );
    }

    return data;
}

export async function respondToApproval(
    sessionId: string,
    approvalId: string,
    approved: boolean
): Promise<void> {

    const response = await fetch(
        `${API_BASE}/approval/${approvalId}`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify({
                sessionId,
                approved,
            }),
        }
    );

    if (!response.ok) {
        const data = await response.json();
        throw new Error(
            data.error ??
                "Approval request failed."
        );
    }
}

export function subscribeToSessionEvents(
    sessionId: string,
    onEvent: (
        event: SessionEvent
    ) => void
): () => void {

    const source = new EventSource(
        `${API_BASE}/events/${sessionId}`
    );

    source.onmessage = (
        event: MessageEvent
    ) => {
        const parsed =
            JSON.parse(
                event.data
            ) as SessionEvent;

        onEvent(parsed);
    };

    source.onerror = () => {
        source.close();
    };

    return () => {
        source.close();
    };
}

export function parseApprovalEvent(
    event: SessionEvent
): PendingApproval | null {

    if (
        event.type !==
        "approval_required"
    ) {
        return null;
    }

    const approvalId =
        event.data?.approvalId;

    const toolName =
        event.data?.toolName;

    const argumentsJson =
        event.data?.argumentsJson;

    if (
        typeof approvalId !== "string" ||
        typeof toolName !== "string" ||
        typeof argumentsJson !== "string"
    ) {
        return null;
    }

    return {
        approvalId,
        toolName,
        argumentsJson,
    };
}
