import killPort from "kill-port";


export async function freeDevPort(
    port: number
): Promise<void> {

    if (
        process.env.NODE_ENV ===
        "production"
    ) {
        return;
    }

    try {
        await killPort(
            port,
            "tcp"
        );
    } catch {
        // Port is already free.
    }
}
