import { FrameworkError } from "./FrameworkError";

export class ToolNotFoundError extends FrameworkError {
    constructor(toolName: string) {
        super(`Tool '${toolName}' is not registered.`);
    }
}