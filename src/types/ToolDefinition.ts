export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: JsonSchema;
}

export interface JsonSchema {
    [key: string]: unknown;

    type: "object";
    properties: Record<string, JsonSchemaProperty>;
    required?: string[];
    additionalProperties?: boolean;
}

export interface JsonSchemaProperty {
    [key: string]: unknown;

    type: "string" | "number" | "integer" | "boolean" | "array";
    description?: string;
    items?: JsonSchemaProperty;
}