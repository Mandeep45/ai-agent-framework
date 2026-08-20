import { Tool } from "../types/tools";
import { ToolDefinition } from "../types/ToolDefinition";
import { Client } from "@modelcontextprotocol/client";

export class McpTool implements Tool {

    constructor(
        public readonly definition: ToolDefinition,
        private readonly client: Client
    ) {}

    async execute(
        input: unknown
    ): Promise<unknown> {

        const result =
            await this.client.callTool({
                name: this.definition.name,
                arguments: input as Record<string, unknown>,
            });

        return result;
    }
}