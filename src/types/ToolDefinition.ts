export interface JsonSchema {
    [key: string]: unknown;

    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
}

export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: JsonSchema;
}