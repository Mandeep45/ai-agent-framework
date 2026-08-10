import OpenAI from "openai";

import { LLMProvider } from "./LLMProvider";
import { Message } from "../types/message";
import { ToolDefinition } from "../types/ToolDefinition";
import { LLMResponse } from "../types/LLMResponse";
import { Logger } from "../logger/Logger";
import "dotenv/config";

export class OpenAIProvider implements LLMProvider {
    private readonly client: OpenAI;

    constructor(
        private readonly logger: Logger
    ) {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async generate(
        messages: Message[],
        tools: ToolDefinition[]
    ): Promise<LLMResponse> {

        this.logger.info(
            "Sending request to OpenAI",
            {
                messageCount: messages.length,
                availableTools: tools.map(
                    tool => tool.name
                ),
            }
        );

        const response = await this.client.responses.create({
            model: "gpt-5",
            input: messages
                .filter(
                    message =>
                        message.role === "user" ||
                        message.role === "assistant"
                )
                .map(message => ({
                    role: message.role,
                    content: String(message.content),
                })),
        });

        this.logger.info(
            "Received response from OpenAI",
            {
                responseId: response.id,
            }
        );

        return {
            isFinal: true,
            message: response.output_text,
            toolCalls: [],
        };
    }
}