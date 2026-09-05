import { randomUUID } from "node:crypto";


export class AgentLogger {

    readonly runId: string;

    constructor() {

        this.runId =
            randomUUID();
    }

    info(
        message: string,
        metadata?: Record<string, unknown>
    ): void {

        this.log(
            "INFO",
            message,
            metadata
        );
    }

    warn(
        message: string,
        metadata?: Record<string, unknown>
    ): void {

        this.log(
            "WARN",
            message,
            metadata
        );
    }

    error(
        message: string,
        metadata?: Record<string, unknown>
    ): void {

        this.log(
            "ERROR",
            message,
            metadata
        );
    }

    private log(
        level: string,
        message: string,
        metadata?: Record<string, unknown>
    ): void {

        const timestamp =
            new Date().toISOString();

        const logEntry = {
            timestamp,
            level,
            runId: this.runId,
            message,
            ...(metadata ?? {}),
        };

        console.log(
            JSON.stringify(logEntry)
        );
    }
}