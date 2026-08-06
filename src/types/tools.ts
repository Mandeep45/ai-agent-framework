import { ToolDefinition } from "./ToolDefinition";

export interface Tool extends ToolDefinition {
    execute(input: unknown): Promise<unknown>;
}