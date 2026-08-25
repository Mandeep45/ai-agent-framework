import {
    Agent,
    run,
    MaxTurnsExceededError,
    ModelTimeoutError,
    ModelBehaviorError,
    ToolCallError,
    ToolTimeoutError,
} from "@openai/agents";

import {
    ApprovalHandler,
} from "../approval/ApprovalHandler";

import {
    AgentLogger,
} from "../logger/AgentLogger";

import {
    config,
} from "../config";


function createRunSignal(): AbortSignal {

    return AbortSignal.timeout(
        config.agent.runTimeoutMs
    );
}


export class AgentRunner {

    constructor(
        private readonly approvalHandler:
            ApprovalHandler,

        private readonly logger:
            AgentLogger
    ) {}


    async run(
        agent: Agent,
        input: string
    ) {

        const startTime =
            Date.now();

        this.logger.info(
            "Agent run started"
        );

        try {

            let result =
                await this.execute(
                    agent,
                    input
                );

            while (
                result.interruptions &&
                result.interruptions.length > 0
            ) {

                this.logger.info(
                    "Agent execution interrupted for approval",
                    {
                        interruptionCount:
                            result.interruptions.length,
                    }
                );

                for (
                    const interruption
                    of result.interruptions
                ) {

                    const toolName =
                        interruption.name ??
                        "unknown_tool";

                    const argumentsJson =
                        interruption.arguments ??
                        "{}";

                    this.logger.info(
                        "Approval requested",
                        {
                            toolName,
                            arguments:
                                argumentsJson,
                        }
                    );

                    const approved =
                        await this.approvalHandler
                            .requestApproval({
                                toolName,
                                argumentsJson,
                            });

                    if (approved) {

                        this.logger.info(
                            "Tool approval granted",
                            {
                                toolName,
                            }
                        );

                        console.log(
                            `[Approval] ${toolName}: APPROVED`
                        );

                        result.state.approve(
                            interruption
                        );

                    } else {

                        this.logger.warn(
                            "Tool approval rejected",
                            {
                                toolName,
                            }
                        );

                        console.log(
                            `[Approval] ${toolName}: REJECTED`
                        );

                        result.state.reject(
                            interruption,
                            {
                                message:
                                    "The user rejected this action.",
                            }
                        );
                    }
                }

                /*
                 * Resume the same run.
                 */
                result =
                    await this.execute(
                        agent,
                        result.state
                    );
            }

            this.logger.info(
                "Agent run completed successfully",
                {
                    durationMs:
                        Date.now() - startTime,
                }
            );

            return result;

        } catch (error) {

            this.handleError(
                error
            );

            throw error;
        }
    }


    private async execute(
        agent: Agent,
        input: string | any
    ) {

        const startTime =
            Date.now();

        try {

            return await run(
                agent,
                input,
                {
                    maxTurns:
                        config.agent.maxTurns,

                    signal:
                        createRunSignal(),
                }
            );

        } catch (error) {

            this.logger.error(
                "Agent run segment failed",
                {
                    durationMs:
                        Date.now() - startTime,

                    error:
                        error instanceof Error
                            ? error.message
                            : String(error),
                }
            );

            throw error;
        }
    }


    private handleError(
        error: unknown
    ): void {

        if (
            error instanceof MaxTurnsExceededError
        ) {

            this.logger.error(
                "Agent reached maximum number of turns",
                {
                    maxTurns:
                        config.agent.maxTurns,
                }
            );

            console.error(
                "\n[ERROR] Agent reached the maximum number of turns."
            );

            console.error(
                `Maximum allowed turns: ${config.agent.maxTurns}`
            );

            return;
        }

        if (
            error instanceof ModelTimeoutError
        ) {

            this.logger.error(
                "Model request timed out",
                {
                    timeoutMs:
                        config.agent.runTimeoutMs,
                }
            );

            console.error(
                "\n[ERROR] Model request timed out."
            );

            console.error(
                `Run timeout: ${config.agent.runTimeoutMs}ms`
            );

            return;
        }

        if (
            error instanceof ToolTimeoutError
        ) {

            this.logger.error(
                "Tool execution timed out"
            );

            console.error(
                "\n[ERROR] Tool execution timed out."
            );

            return;
        }

        if (
            error instanceof ToolCallError
        ) {

            this.logger.error(
                "MCP tool execution failed",
                {
                    error:
                        error.message,
                }
            );

            console.error(
                "\n[ERROR] MCP tool execution failed."
            );

            console.error(
                error.message
            );

            return;
        }

        if (
            error instanceof ModelBehaviorError
        ) {

            this.logger.error(
                "Model produced invalid agent behavior",
                {
                    error:
                        error.message,
                }
            );

            console.error(
                "\n[ERROR] Model produced invalid agent behavior."
            );

            console.error(
                error.message
            );

            return;
        }

        if (
            error instanceof Error
        ) {

            this.logger.error(
                "Agent execution failed",
                {
                    error:
                        error.message,
                }
            );

            console.error(
                "\n[ERROR] Agent execution failed."
            );

            console.error(
                error.message
            );

            return;
        }

        this.logger.error(
            "Unknown agent execution failure",
            {
                error:
                    String(error),
            }
        );

        console.error(
            "\n[ERROR] Unknown agent execution failure."
        );

        console.error(
            error
        );
    }
}