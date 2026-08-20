import { ToolCall } from "../types/ToolCall";

export interface ApprovalPolicy {
    requiresApproval(
        toolCall: ToolCall
    ): boolean;
}