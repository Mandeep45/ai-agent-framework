import { ToolCall } from "../types/ToolCall";
import {
    ToolExecutionResult,
} from "../types/ToolExecutionResult";
import { ToolRegistry } from "../registry/ToolRegistry";
import { ToolValidator } from "../validation/ToolValidator";
import { ToolExecutionError } from "../errors/ToolExecutionError";
import { ApprovalPolicy } from "../approval/ApprovalPolicy";
import { SimpleApprovalPolicy } from "../approval/SimpleApprovalPolicy";
import { ApprovalService } from "../approval/ApprovalService";
import { CliApprovalService } from "../approval/CliApprovalService";

export class ToolExecutionService {
    private readonly toolTimeoutMs = 5000;

    constructor(
        private readonly registry: ToolRegistry,
        private readonly validator = new ToolValidator(),
        private readonly approvalPolicy: ApprovalPolicy =
            new SimpleApprovalPolicy(),
        private readonly approvalService: ApprovalService =
            new CliApprovalService()
    ) {}

    async execute(
        toolCall: ToolCall
    ): Promise<ToolExecutionResult> {

        const tool =
            this.registry.get(
                toolCall.toolName
            );

        /*
         * 1. Validate the requested tool arguments.
         */
        try {
            this.validator.validate(
                tool.definition,
                toolCall.arguments
            );
        } catch (error) {

            if (
                error instanceof Error &&
                error.name ===
                    "ToolValidationError"
            ) {
                return {
                    success: false,
                    toolCallId: toolCall.id,
                    toolName: toolCall.toolName,
                    error: {
                        type: "validation_error",
                        message: error.message,
                    },
                };
            }

            throw error;
        }

        /*
         * 2. Determine whether human approval
         *    is required.
         */
        const requiresApproval =
            this.approvalPolicy.requiresApproval(
                toolCall
            );

        console.log(
            `[Approval] ${toolCall.toolName}: ${
                requiresApproval
                    ? "REQUIRED"
                    : "NOT REQUIRED"
            }`
        );

        /*
         * 3. Request human approval when required.
         */
        if (requiresApproval) {

            const approved =
                await this.approvalService.requestApproval(
                    toolCall
                );

            if (!approved) {
                return {
                    success: false,
                    toolCallId: toolCall.id,
                    toolName: toolCall.toolName,
                    error: {
                        type: "approval_rejected",
                        message:
                            "Human approval was rejected.",
                    },
                };
            }

            console.log(
                `[Approval] ${toolCall.toolName}: APPROVED`
            );
        }

        /*
         * 4. Execute the actual tool.
         */
        try {

            const data =
                await this.withTimeout(
                    tool.execute(
                        toolCall.arguments
                    ),
                    this.toolTimeoutMs
                );

            return {
                success: true,
                toolCallId: toolCall.id,
                toolName: toolCall.toolName,
                data,
            };

        } catch (error) {

            if (
                error instanceof Error &&
                error.name ===
                    "ToolTimeoutError"
            ) {
                return {
                    success: false,
                    toolCallId: toolCall.id,
                    toolName: toolCall.toolName,
                    error: {
                        type: "timeout_error",
                        message: error.message,
                    },
                };
            }

            const executionError =
                new ToolExecutionError(
                    toolCall.toolName,
                    error instanceof Error
                        ? error.message
                        : "Unknown error",
                    error
                );

            return {
                success: false,
                toolCallId: toolCall.id,
                toolName: toolCall.toolName,
                error: {
                    type: "execution_error",
                    message:
                        executionError.message,
                },
            };
        }
    }

    private async withTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number
    ): Promise<T> {

        let timeoutId:
            ReturnType<typeof setTimeout>;

        const timeoutPromise =
            new Promise<never>(
                (_, reject) => {

                    timeoutId =
                        setTimeout(
                            () => {

                                const error =
                                    new Error(
                                        `Tool execution exceeded ${timeoutMs}ms.`
                                    );

                                error.name =
                                    "ToolTimeoutError";

                                reject(error);
                            },
                            timeoutMs
                        );
                }
            );

        try {
            return await Promise.race([
                promise,
                timeoutPromise,
            ]);
        } finally {
            clearTimeout(
                timeoutId!
            );
        }
    }
}