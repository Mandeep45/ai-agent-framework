import path from "node:path";

/*
 * Ensure MCP and other root-relative paths
 * resolve correctly when the API runs from
 * apps/api via npm workspaces.
 */
process.chdir(
    path.resolve(
        __dirname,
        "..",
        "..",
        ".."
    )
);
