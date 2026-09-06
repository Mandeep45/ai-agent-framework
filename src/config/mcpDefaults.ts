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
