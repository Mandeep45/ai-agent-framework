import { FrameworkError } from "../../src/errors/FrameworkError";

export class ToolNotFoundError extends FrameworkError {
    constructor(toolName: string) {
        super(`Tool '${toolName}' is not registered.`);
    }
}