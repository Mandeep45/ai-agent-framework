import { LLMProvider } from "./LLMProvider";
import { Logger } from "../logger/Logger";
import { Message } from "../types/message";
import { ToolDefinition } from "../types/ToolDefinition";
import { LLMResponse } from "../types/LLMResponse";
import { Customer } from "../types/Customer";

export class FakeLLMProvider implements LLMProvider {
    constructor(
        private readonly logger: Logger
    ) {}

    async generate(
        messages: Message[],
        tools: ToolDefinition[]
    ): Promise<LLMResponse> {

        this.logger.info(
            `Generating LLM response: ${JSON.stringify({
                messages,
                availableTools: tools.map(tool => tool.name),
            })}`
        );

        const customerResult = messages.find(
            (message) =>
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

        const customer = customerResult.content as Customer;

        return {
            isFinal: true,
            message: `Customer ${customer.name} (${customer.id}) found successfully.`,
            toolCalls: [],
        };
    }
}