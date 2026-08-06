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

        const customerResult = messages.find(
            message =>
                message.role === "tool" &&
                message.toolName === "CustomerTool"
        );

        if (!customerResult) {
            return {
                isFinal: false,
                message: "",
                toolCalls: [
                    {
                        id: "tool-call-1",
                        toolName: "CustomerTool",
                        arguments: {
                            customerId: "ABC123",
                        },
                    },
                ],
            };
        }

        const customer = customerResult.content as {
            id: string;
            name: string;
            email: string;
        };

        return {
            isFinal: true,
            message: `Customer ${customer.name} (${customer.id}) found successfully.`,
            toolCalls: [],
        };
    }
}