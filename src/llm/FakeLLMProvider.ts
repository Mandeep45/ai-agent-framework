import { LLMProvider } from "./LLMProvider";
import { Message } from "../types/message";
import { ToolDefinition } from "../types/ToolDefinition";
import { LLMResponse } from "../types/LLMResponse";

export class FakeLLMProvider implements LLMProvider {

    async generate(
        messages: Message[],
        tools: ToolDefinition[]
    ): Promise<LLMResponse> {

        console.log("Messages:", messages);
        console.log(
            "Available Tools:",
            tools.map(tool => tool.name)
        );

        const hasToolResult = messages.some(
            message => message.role === "tool"
        );

        if (!hasToolResult) {
            return {
                isFinal: false,
                message: "",
                toolCalls: [
                    {
                        toolName: "CustomerTool",
                        arguments: {
                            customerId: "ABC123"
                        }
                    }
                ]
            };
        }

        return {
            isFinal: true,
            message: "Customer ABC123 found successfully.",
            toolCalls: []
        };
    }
}