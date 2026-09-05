export interface ToolExecutionSuccess {
    success: true;
    toolCallId: string;
    toolName: string;
    data: unknown;
}

export interface ToolExecutionFailure {
    success: false;
    toolCallId: string;
    toolName: string;
    error: {
        type:
            | "validation_error"
            | "execution_error"
            | "timeout_error"
            | "approval_rejected";
        message: string;
    };
}

export type ToolExecutionResult =
    | ToolExecutionSuccess
    | ToolExecutionFailure;