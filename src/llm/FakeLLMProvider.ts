import { LLMProvider } from "./LLMProvider";
import { Tool } from "../types/tools";
import { Message } from "../types/message";
import { ToolDefinition } from "../types/ToolDefinition";
import { LLMResponse } from "../types/LLMResponse";

export class FakeLLMProvider implements LLMProvider {
    async generate(
        messages: Message[],
        tools: ToolDefinition[]
    ): Promise<LLMResponse> {

        console.log("Messages:", messages);
        console.log("Available Tools:", tools.map(t => t.name));

        if (messages.length === 1) {
            return {
                isFinal: false,
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
            message: "Customer found successfully.",
            toolCalls: []
        };
    }
}