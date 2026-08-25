export interface ApprovalRequest {
    toolName: string;
    argumentsJson: string;
}

export interface ApprovalHandler {
    requestApproval(
        request: ApprovalRequest
    ): Promise<boolean>;
}