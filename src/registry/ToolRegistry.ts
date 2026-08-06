import { Tool } from "../types/tools";
import { ToolDefinition } from "../types/ToolDefinition";

export class ToolRegistry {
    private readonly tools = new Map<string, Tool<any, any>>();

    register(tool: Tool<any, any>): void {
        if (this.tools.has(tool.definition.name)) {
            throw new Error(
                `Tool '${tool.definition.name}' is already registered.`
            );
        }

        this.tools.set(tool.definition.name, tool);
    }

    get(name: string): Tool<any, any> {
        const tool = this.tools.get(name);

        if (!tool) {
            throw new Error(`Tool '${name}' not found.`);
        }

        return tool;
    }

    getDefinitions(): ToolDefinition[] {
        return Array.from(this.tools.values()).map(
            tool => tool.definition
        );
    }
}