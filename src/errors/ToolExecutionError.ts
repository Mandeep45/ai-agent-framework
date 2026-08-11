export class ToolExecutionError extends Error {
    constructor(
        public readonly toolName: string,
        message: string,
        public readonly cause?: unknown
    ) {
        super(
            `Tool '${toolName}' execution failed: ${message}`
        );

        this.name = "ToolExecutionError";
    }
}