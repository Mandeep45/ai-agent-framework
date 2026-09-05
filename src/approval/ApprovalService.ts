import { ToolCall } from "../types/ToolCall";

export interface ApprovalService {
    requestApproval(
        toolCall: ToolCall
    ): Promise<boolean>;
}