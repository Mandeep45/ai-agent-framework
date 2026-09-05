import { ToolCall } from "../types/ToolCall";
import { ApprovalPolicy } from "./ApprovalPolicy";

export class SimpleApprovalPolicy
    implements ApprovalPolicy {

    requiresApproval(
        toolCall: ToolCall
    ): boolean {

        return (
            toolCall.toolName === "place_order"
        );
    }
}