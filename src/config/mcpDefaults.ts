import path from "node:path";

import {
    getProjectRoot,
} from "../utils/projectRoot";


export function getDefaultMcpServerCommand():
    string {

    if (
        process.env.NODE_ENV ===
        "production"
    ) {
        return "node";
    }

    return "tsx";
}


export function getDefaultMcpServerPath():
    string {

    const projectRoot =
        getProjectRoot();

    if (
        process.env.NODE_ENV ===
        "production"
    ) {
        return path.join(
            projectRoot,
            "dist",
            "src",
            "mcp",
            "server.js"
        );
    }

    return path.join(
        projectRoot,
        "src",
        "mcp",
        "server.ts"
    );
}


export function getMcpServerEnv():
    Record<string, string> {

    /*
     * MCP stdio only inherits PATH/HOME/etc. by default.
     * Pass through app env vars (DATABASE_URL, GROQ_API_KEY, …).
     */
    const env: Record<string, string> =
        {};

    for (const [
        key,
        value,
    ] of Object.entries(
        process.env
    )) {

        if (
            typeof value === "string"
        ) {
            env[key] = value;
        }
    }

    return env;
}
