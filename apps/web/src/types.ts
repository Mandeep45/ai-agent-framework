export type MessageRole =
    | "user"
    | "assistant"
    | "system"
    | "approval";

export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
}

export type ToolStepStatus =
    | "running"
    | "completed"
    | "failed";

export interface ToolStep {
    id: string;
    toolName: string;
    status: ToolStepStatus;
    argumentsJson?: string;
    result?: string;
}

export interface PendingApproval {
    approvalId: string;
    toolName: string;
    argumentsJson: string;
}

export type SessionEventType =
    | "connected"
    | "agent_started"
    | "tool_call"
    | "tool_result"
    | "approval_required"
    | "approval_resolved"
    | "agent_completed"
    | "agent_error";

export interface SessionEvent {
    type: SessionEventType;
    sessionId: string;
    timestamp: string;
    data?: Record<string, unknown>;
}
