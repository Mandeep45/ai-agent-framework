import fs from "node:fs";
import path from "node:path";


export function getProjectRoot(
    startDir: string = __dirname
): string {

    let current = startDir;

    while (true) {

        const packagePath =
            path.join(
                current,
                "package.json"
            );

        if (
            fs.existsSync(
                packagePath
            )
        ) {
            try {

                const packageJson =
                    JSON.parse(
                        fs.readFileSync(
                            packagePath,
                            "utf8"
                        )
                    ) as {
                        name?: string;
                    };

                if (
                    packageJson.name ===
                    "ai-agent-framework"
                ) {
                    return current;
                }

            } catch {
                // Keep searching upward.
            }
        }

        const parent =
            path.dirname(current);

        if (parent === current) {
            return process.cwd();
        }

        current = parent;
    }
}
