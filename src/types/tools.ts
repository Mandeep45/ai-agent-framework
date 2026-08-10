import { ToolDefinition } from "../types/ToolDefinition";

export interface Tool<TInput = unknown, TOutput = unknown> {
    readonly definition: ToolDefinition;

    execute(input: TInput): Promise<TOutput>;
}