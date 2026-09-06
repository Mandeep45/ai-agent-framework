import killPort from "kill-port";


const port = Number(
    process.argv[2] ??
        process.env.API_PORT ??
        3001
);

freePort(port);


async function freePort(
    targetPort: number
): Promise<void> {

    try {
        await killPort(
            targetPort,
            "tcp"
        );

        console.log(
            `Freed port ${targetPort}.`
        );

    } catch {
        console.log(
            `Port ${targetPort} is already free.`
        );
    }
}
