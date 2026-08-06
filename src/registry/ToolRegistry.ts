import { ToolDefinition } from "../types/ToolDefinition";
import { Tool } from "../types/tools";

export class ToolRegistry {
    private tools = new Map<string, Tool>();

    register(tool: Tool): void {
        if (this.tools.has(tool.name)) {
            throw new Error(
                `Tool "${tool.name}" is already registered.`
            );
        }

        this.tools.set(tool.name, tool);
    }

    get(name: string): Tool {
        const tool = this.tools.get(name);
    
        if (!tool) {
            throw new Error(`Tool '${name}' not found.`);
        }
    
        return tool;
    }

    getAll(): Tool[] {
        return Array.from(this.tools.values());
    }

    getDefinitions(): ToolDefinition[] {
        return Array.from(this.tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
        }));
    }
}

