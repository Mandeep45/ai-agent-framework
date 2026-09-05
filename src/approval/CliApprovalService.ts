import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { ToolCall } from "../types/ToolCall";
import { ApprovalService } from "./ApprovalService";

export class CliApprovalService
    implements ApprovalService {

    async requestApproval(
        toolCall: ToolCall
    ): Promise<boolean> {

        const readline =
            createInterface({
                input,
                output,
            });

        console.log("\n==============================");
        console.log("      APPROVAL REQUIRED");
        console.log("==============================");

        console.log(
            `Tool: ${toolCall.toolName}`
        );

        console.log(
            "Arguments:",
            JSON.stringify(
                toolCall.arguments,
                null,
                2
            )
        );

        const answer =
            await readline.question(
                "Approve this action? (y/n): "
            );

        readline.close();

        return (
            answer.trim().toLowerCase() === "y"
        );
    }
}