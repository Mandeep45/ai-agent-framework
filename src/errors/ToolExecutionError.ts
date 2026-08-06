import { FrameworkError } from "./FrameworkError";

export class ToolExecutionError extends FrameworkError {
    constructor(
        toolName: string,
        reason: unknown
    ) {
        const message =
            reason instanceof Error
                ? reason.message
                : String(reason);

        super(
            `Failed to execute tool '${toolName}'. Reason: ${message}`
        );
    }
}