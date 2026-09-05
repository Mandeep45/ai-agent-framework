const ALLOWED_MCP_TOOLS = new Set([
    "get_customer",
    "get_inventory",
    "list_products",
    "get_order_history",
    "place_order",
]);


export function validateMcpTools(
    discoveredToolNames: string[]
): void {

    const unexpectedTools =
        discoveredToolNames.filter(
            toolName =>
                !ALLOWED_MCP_TOOLS.has(
                    toolName
                )
        );

    if (
        unexpectedTools.length > 0
    ) {

        throw new Error(
            "MCP security validation failed. " +
            "Unexpected tools discovered: " +
            unexpectedTools.join(", ")
        );
    }

    const missingTools =
        [...ALLOWED_MCP_TOOLS].filter(
            toolName =>
                !discoveredToolNames.includes(
                    toolName
                )
        );

    if (
        missingTools.length > 0
    ) {

        throw new Error(
            "MCP security validation failed. " +
            "Required tools are missing: " +
            missingTools.join(", ")
        );
    }
}


export function isAllowedMcpTool(
    toolName: string
): boolean {

    return ALLOWED_MCP_TOOLS.has(
        toolName
    );
}