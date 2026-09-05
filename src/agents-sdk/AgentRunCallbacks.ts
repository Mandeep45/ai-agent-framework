export interface AgentRunCallbacks {

    onToolStart?(
        toolName: string,
        argumentsJson: string
    ): void;

    onToolEnd?(
        toolName: string,
        result: string,
        success: boolean
    ): void;
}
