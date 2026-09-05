import OpenAI from "openai";

import { LLMProvider } from "./LLMProvider";
import { Message } from "../types/message";
import { ToolDefinition } from "../types/ToolDefinition";
import { LLMResponse } from "../types/LLMResponse";
import { Logger } from "../logger/Logger";

export class GroqProvider implements LLMProvider {
    private readonly client: OpenAI;

    constructor(
        private readonly logger: Logger
    ) {
        this.client = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1",
        });
    }

    async generate(
        messages: Message[],
        tools: ToolDefinition[]
    ): Promise<LLMResponse> {

        this.logger.info(
            "Sending request to Groq",
            {
                messageCount: messages.length,
                availableTools: tools.map(
                    tool => tool.name
                ),
            }
        );

        const input = messages.flatMap(
            message => this.convertMessage(message)
        );

        const response =
            await this.client.responses.create({
                model: "openai/gpt-oss-20b",

                input,

                tools: tools.map(tool => ({
                    type: "function" as const,
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.inputSchema,
                    strict: true,
                })),

                tool_choice: "auto",
            });

        this.logger.info(
            "Received response from Groq",
            {
                responseId: response.id,
            }
        );

        const toolCalls = response.output
            .filter(
                item => item.type === "function_call"
            )
            .map(item => ({
                id: item.call_id,
                toolName: item.name,
                arguments: JSON.parse(
                    item.arguments
                ),
            }));

        if (toolCalls.length > 0) {
            return {
                isFinal: false,
                toolCalls,
            };
        }

        return {
            isFinal: true,
            message: response.output_text,
            toolCalls: [],
        };
    }

    private convertMessage(
        message: Message
    ): any[] {

        if (message.role === "user") {
            return [
                {
                    role: "user",
                    content: message.content,
                },
            ];
        }

        if (message.role === "assistant") {
            return [
                {
                    role: "assistant",
                    content: message.content,
                },
            ];
        }

        if (
            message.role === "assistant_tool_call"
        ) {
            return [
                {
                    type: "function_call",
                    call_id: message.toolCallId,
                    name: message.toolName,
                    arguments: JSON.stringify(
                        message.arguments
                    ),
                },
            ];
        }

        return [
            {
                type: "function_call_output",
                call_id: message.toolCallId,
                output: JSON.stringify(
                    message.content
                ),
            },
        ];
    }
}