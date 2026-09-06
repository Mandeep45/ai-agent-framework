import type {
    PendingApproval,
    SessionEvent,
    ToolStep,
} from "../types";

const API_BASE = resolveApiBase();
const API_KEY =
    import.meta.env.VITE_API_KEY ?? "";

function resolveApiBase(): string {

    const configuredUrl =
        import.meta.env.VITE_API_URL;

    if (
        typeof configuredUrl === "string" &&
        configuredUrl.trim() !== ""
    ) {
        return `${configuredUrl.replace(
            /\/$/,
            ""
        )}/api`;
    }

    return "/api";
}

function buildAuthHeaders(
    includeJson = false
): Record<string, string> {

    const headers: Record<string, string> =
        {};

    if (includeJson) {
        headers["Content-Type"] =
            "application/json";
    }

    if (API_KEY) {
        headers["x-api-key"] = API_KEY;
    }

    return headers;
}

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
            headers: buildAuthHeaders(
                true
            ),
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
            headers: buildAuthHeaders(
                true
            ),
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

    const params =
        new URLSearchParams();

    if (API_KEY) {
        params.set(
            "apiKey",
            API_KEY
        );
    }

    const query =
        params.toString();

    const url =
        `${API_BASE}/events/${sessionId}` +
        (query ? `?${query}` : "");

    const source = new EventSource(url);

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

export function parseToolCallEvent(
    event: SessionEvent
): ToolStep | null {

    if (
        event.type !== "tool_call"
    ) {
        return null;
    }

    const stepId =
        event.data?.stepId;

    const toolName =
        event.data?.toolName;

    const argumentsJson =
        event.data?.argumentsJson;

    if (
        typeof stepId !== "string" ||
        typeof toolName !== "string"
    ) {
        return null;
    }

    return {
        id: stepId,
        toolName,
        status: "running",
        argumentsJson:
            typeof argumentsJson === "string"
                ? argumentsJson
                : undefined,
    };
}

export function parseToolResultEvent(
    event: SessionEvent
): {
    stepId: string;
    toolName: string;
    result: string;
    success: boolean;
} | null {

    if (
        event.type !== "tool_result"
    ) {
        return null;
    }

    const stepId =
        event.data?.stepId;

    const toolName =
        event.data?.toolName;

    const result =
        event.data?.result;

    const success =
        event.data?.success;

    if (
        typeof stepId !== "string" ||
        typeof toolName !== "string" ||
        typeof result !== "string"
    ) {
        return null;
    }

    return {
        stepId,
        toolName,
        result,
        success:
            success === true,
    };
}
