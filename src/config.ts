import "dotenv/config";

import path from "node:path";

import {
    getDefaultMcpServerCommand,
    getDefaultMcpServerPath,
} from "./config/mcpDefaults";
import {
    getProjectRoot,
} from "./utils/projectRoot";


function getEnv(
    name: string,
    defaultValue?: string
): string {

    const value =
        process.env[name];

    if (
        value !== undefined &&
        value.trim() !== ""
    ) {
        return value;
    }

    if (defaultValue !== undefined) {
        return defaultValue;
    }

    throw new Error(
        `Missing required environment variable: ${name}`
    );
}


function getOptionalEnv(
    name: string
): string | undefined {

    const value =
        process.env[name];

    if (
        value === undefined ||
        value.trim() === ""
    ) {
        return undefined;
    }

    return value;
}


function getNumberEnv(
    name: string,
    defaultValue: number
): number {

    const value =
        process.env[name];

    if (
        value === undefined ||
        value.trim() === ""
    ) {
        return defaultValue;
    }

    const parsed =
        Number(value);

    if (
        !Number.isFinite(parsed) ||
        parsed <= 0
    ) {
        throw new Error(
            `${name} must be a positive number.`
        );
    }

    return parsed;
}


function getListenPort(): number {

    if (getOptionalEnv("PORT")) {
        return getNumberEnv(
            "PORT",
            10000
        );
    }

    return getNumberEnv(
        "API_PORT",
        3001
    );
}


function getWebOrigins(): string[] {

    const raw =
        getEnv(
            "WEB_ORIGIN",
            "http://localhost:5173"
        );

    return raw
        .split(",")
        .map(origin =>
            origin
                .trim()
                .replace(/\/$/, "")
        )
        .filter(
            origin =>
                origin.length > 0
        );
}


export const config = {

    nodeEnv:
        getEnv(
            "NODE_ENV",
            "development"
        ),

    groq: {
        apiKey:
            getOptionalEnv(
                "GROQ_API_KEY"
            ) ?? "",

        model:
            getEnv(
                "GROQ_MODEL",
                "openai/gpt-oss-20b"
            ),
    },

    agent: {
        maxTurns:
            getNumberEnv(
                "AGENT_MAX_TURNS",
                10
            ),

        runTimeoutMs:
            getNumberEnv(
                "AGENT_RUN_TIMEOUT_MS",
                60_000
            ),
    },

    mcp: {
        name:
            getEnv(
                "MCP_SERVER_NAME",
                "Order MCP Server"
            ),

        command:
            getEnv(
                "MCP_SERVER_COMMAND",
                getDefaultMcpServerCommand()
            ),

        serverPath:
            getEnv(
                "MCP_SERVER_PATH",
                getDefaultMcpServerPath()
            ),

        timeoutMs:
            getNumberEnv(
                "MCP_SERVER_TIMEOUT_MS",
                15_000
            ),
    },

    database: {
        url:
            getOptionalEnv(
                "DATABASE_URL"
            ),

        sqlitePath:
            getEnv(
                "DATABASE_PATH",
                "data/app.db"
            ),
    },

    api: {
        port: getListenPort(),

        key:
            getOptionalEnv(
                "API_KEY"
            ),
    },

    web: {
        origins:
            getWebOrigins(),
    },

} as const;

export function resolveProjectPath(
    relativePath: string
): string {

    return path.resolve(
        getProjectRoot(),
        relativePath
    );
}
