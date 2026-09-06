import { FrameworkError } from "../../src/errors/FrameworkError";

export class AgentIterationError extends FrameworkError {
    constructor(maxIterations: number) {
        super(
            `Agent exceeded the maximum iteration limit (${maxIterations}).`
        );
    }
}