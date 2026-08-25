import {
    stdin,
    stdout,
} from "node:process";

import * as readline from "node:readline/promises";

import {
    ApprovalHandler,
    ApprovalRequest,
} from "./ApprovalHandler";


export class CliApprovalHandler
    implements ApprovalHandler {

    async requestApproval(
        request: ApprovalRequest
    ): Promise<boolean> {

        const rl =
            readline.createInterface({
                input: stdin,
                output: stdout,
            });

        try {

            console.log(
                "\n=============================="
            );

            console.log(
                "      APPROVAL REQUIRED"
            );

            console.log(
                "=============================="
            );

            console.log(
                `Tool: ${request.toolName}`
            );

            console.log(
                `Arguments: ${request.argumentsJson}`
            );

            const answer =
                await rl.question(
                    "Approve this action? (y/n): "
                );

            return (
                answer
                    .trim()
                    .toLowerCase() === "y"
            );

        } finally {

            rl.close();
        }
    }
}