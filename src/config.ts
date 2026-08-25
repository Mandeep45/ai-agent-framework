import "dotenv/config";


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


export const config = {

    groq: {
        apiKey:
            getEnv("GROQ_API_KEY"),

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
                "tsx"
            ),

        serverPath:
            getEnv(
                "MCP_SERVER_PATH",
                "src/mcp/server.ts"
            ),

        timeoutMs:
            getNumberEnv(
                "MCP_SERVER_TIMEOUT_MS",
                15_000
            ),
    },

} as const;