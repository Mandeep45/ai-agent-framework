import { ToolDefinition } from "../types/ToolDefinition";
import { ToolValidationError } from "../errors/ToolValidationError";

export class ToolValidator {
    validate(
        definition: ToolDefinition,
        input: unknown
    ): void {

        if (
            typeof input !== "object" ||
            input === null ||
            Array.isArray(input)
        ) {
            throw new ToolValidationError(
                definition.name,
                "Arguments must be an object."
            );
        }

        const objectInput =
            input as Record<string, unknown>;

        const required =
            definition.inputSchema.required ?? [];

        for (const field of required) {
            if (
                !(field in objectInput) ||
                objectInput[field] === undefined
            ) {
                throw new ToolValidationError(
                    definition.name,
                    `Missing required argument '${field}'.`
                );
            }
        }

        const properties =
            definition.inputSchema.properties;

        for (const [field, value] of Object.entries(
            objectInput
        )) {
            const schema = properties[field] as
                | { type?: string }
                | undefined;

            if (!schema) {
                if (
                    definition.inputSchema
                        .additionalProperties === false
                ) {
                    throw new ToolValidationError(
                        definition.name,
                        `Unknown argument '${field}'.`
                    );
                }

                continue;
            }

            if (
                schema.type === "string" &&
                typeof value !== "string"
            ) {
                throw new ToolValidationError(
                    definition.name,
                    `Argument '${field}' must be a string.`
                );
            }

            if (
                schema.type === "number" &&
                typeof value !== "number"
            ) {
                throw new ToolValidationError(
                    definition.name,
                    `Argument '${field}' must be a number.`
                );
            }

            if (
                schema.type === "boolean" &&
                typeof value !== "boolean"
            ) {
                throw new ToolValidationError(
                    definition.name,
                    `Argument '${field}' must be a boolean.`
                );
            }
        }
    }
}