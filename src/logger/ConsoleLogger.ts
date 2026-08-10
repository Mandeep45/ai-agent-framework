import { Logger } from "./Logger";

export class ConsoleLogger implements Logger {
    info(message: string, metadata?: unknown): void {
        console.log(`[INFO] ${message}`);

        if (metadata !== undefined) {
            console.log(metadata);
        }
    }

    warn(message: string, metadata?: unknown): void {
        console.warn(`[WARN] ${message}`);

        if (metadata !== undefined) {
            console.warn(metadata);
        }
    }

    error(message: string, metadata?: unknown): void {
        console.error(`[ERROR] ${message}`);

        if (metadata !== undefined) {
            console.error(metadata);
        }
    }
}