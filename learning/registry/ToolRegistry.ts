import { Tool } from "../types/tools";
import { ToolDefinition } from "../types/ToolDefinition";
import { ToolNotFoundError } from "../errors/ToolNotFoundError";

export class ToolRegistry {
    private readonly tools = new Map<
        string,
        Tool<unknown, unknown>
    >();

    register(
        tool: Tool<unknown, unknown>
    ): void {
        if (this.tools.has(tool.definition.name)) {
            throw new Error(
                `Tool '${tool.definition.name}' already exists.`
            );
        }

        this.tools.set(
            tool.definition.name,
            tool
        );
    }

    get(
        name: string
    ): Tool<unknown, unknown> {

        const tool = this.tools.get(name);

        if (!tool) {
            throw new ToolNotFoundError(name);
        }

        return tool;
    }

    getDefinitions(): ToolDefinition[] {
        return Array.from(
            this.tools.values()
        ).map(
            tool => tool.definition
        );
    }
}