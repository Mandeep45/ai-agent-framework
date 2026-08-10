export class ToolValidationError extends Error {
    constructor(
        public readonly toolName: string,
        message: string
    ) {
        super(
            `Tool '${toolName}' validation failed: ${message}`
        );

        this.name = "ToolValidationError";
    }
}