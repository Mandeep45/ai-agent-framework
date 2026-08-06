import { LLMProvider } from "./LLMProvider";
import { Tool } from "../types/tools";
import { Message } from "../types/message";

export class FakeLLMProvider implements LLMProvider {
    async generate(
        messages: Message[],
        tools: Tool[]
    ): Promise<string> {

        console.log("Messages:", messages);
        console.log("Available Tools:", tools.map(t => t.name));

        return "This is a fake LLM response.";
    }
}