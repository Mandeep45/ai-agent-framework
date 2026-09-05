import { test } from "node:test";
import assert from "node:assert/strict";

import { Agent } from "../src/agent/Agent";
import { MessageHistory } from "../src/agent/MessageHistory";
import { ToolRegistry } from "../src/registry/ToolRegistry";
import { LLMProvider } from "../src/llm/LLMProvider";
import { Message } from "../src/types/message";
import { ToolDefinition } from "../src/types/ToolDefinition";
import { LLMResponse } from "../src/types/LLMResponse";
import { ToolCall } from "../src/types/ToolCall";
import { Tool } from "../src/types/tools";

class TestLLMProvider implements LLMProvider {
    private callCount = 0;

    constructor(
        private readonly toolCall: ToolCall
    ) {}

    async generate(
        messages: Message[],
        tools: ToolDefinition[]
    ): Promise<LLMResponse> {

        this.callCount++;

        if (this.callCount === 1) {
            return {
                isFinal: false,
                toolCalls: [this.toolCall],
            };
        }

        const toolResult = messages.find(
            message => message.role === "tool"
        );

        return {
            isFinal: true,
            message: JSON.stringify(
                toolResult?.content
            ),
            toolCalls: [],
        };
    }
}

class MultiToolTestLLMProvider
implements LLMProvider {

    private callCount = 0;

    constructor(
        private readonly toolCalls: ToolCall[]
    ) {}

    async generate(
        messages: Message[],
        tools: ToolDefinition[]
    ): Promise<LLMResponse> {

        this.callCount++;

        if (this.callCount === 1) {
            return {
                isFinal: false,
                toolCalls: this.toolCalls,
            };
        }

        return {
            isFinal: true,
            message: "Both tools completed.",
            toolCalls: [],
        };
    }
}

class CustomerTestTool
implements Tool
{
    readonly definition: ToolDefinition = {
        name: "CustomerTool",
        description: "Find customer by ID.",
        inputSchema: {
            type: "object",
            properties: {
                customerId: {
                    type: "string",
                },
            },
            required: ["customerId"],
            additionalProperties: false,
        },
    };

    executionCount = 0;

    async execute(
        input: unknown
    ): Promise<unknown> {

        this.executionCount++;

        const { customerId } =
            input as {
                customerId: string;
            };

        return {
            id: customerId,
            name: "John Doe",
            email: "john@example.com",
        };
    }
}

class TimeoutTestTool
implements Tool
{
    readonly definition: ToolDefinition = {
        name: "SlowTool",
        description: "A tool that never finishes.",
        inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
        },
    };

    async execute(
        _input: unknown
    ): Promise<unknown> {

        return new Promise(() => {
            // Intentionally never resolves.
        });
    }
}

class SlowTestTool
implements Tool
{
    readonly definition: ToolDefinition;

    constructor(
        private readonly toolName: string,
        private readonly delayMs: number
    ) {
        this.definition = {
            name: toolName,
            description:
                `Slow test tool ${toolName}.`,
            inputSchema: {
                type: "object",
                properties: {},
                additionalProperties: false,
            },
        };
    }

    async execute(
        _input: unknown
    ): Promise<unknown> {

        await new Promise<void>(
            resolve =>
                setTimeout(
                    resolve,
                    this.delayMs
                )
        );

        return {
            tool: this.toolName,
            completed: true,
        };
    }
}

function createAgent(
    tool: Tool,
    toolCall: ToolCall
): {
    agent: Agent;
    tool: Tool;
} {

    const registry =
        new ToolRegistry();

    registry.register(tool);

    const history =
        new MessageHistory();

    const llm =
        new TestLLMProvider(
            toolCall
        );

    const agent =
        new Agent(
            registry,
            history,
            llm
        );

    return {
        agent,
        tool,
    };
}

test(
    "Agent executes a valid tool call and returns the result",
    async () => {

        const tool =
            new CustomerTestTool();

        const toolCall: ToolCall = {
            id: "call-1",
            toolName: "CustomerTool",
            arguments: {
                customerId: "ABC",
            },
        };

        const { agent } =
            createAgent(
                tool,
                toolCall
            );

        const response =
            await agent.chat(
                "Find customer ABC"
            );

        assert.equal(
            tool.executionCount,
            1
        );

        assert.match(
            response.message,
            /ABC/
        );

        assert.match(
            response.message,
            /John Doe/
        );
    }
);

test(
    "Agent rejects invalid tool arguments",
    async () => {

        const tool =
            new CustomerTestTool();

        const toolCall: ToolCall = {
            id: "call-2",
            toolName: "CustomerTool",
            arguments: {
                customerId: 123,
            },
        };

        const { agent } =
            createAgent(
                tool,
                toolCall
            );

        const response =
            await agent.chat(
                "Find customer ABC"
            );

        assert.equal(
            tool.executionCount,
            0
        );

        assert.match(
            response.message,
            /validation_error/
        );

        assert.match(
            response.message,
            /CustomerTool/
        );
    }
);

test(
    "Agent handles tool timeout",
    async () => {

        const tool =
            new TimeoutTestTool();

        const toolCall: ToolCall = {
            id: "call-3",
            toolName: "SlowTool",
            arguments: {},
        };

        const { agent } =
            createAgent(
                tool,
                toolCall
            );

        const response =
            await agent.chat(
                "Run the slow tool"
            );

        assert.match(
            response.message,
            /timeout_error/
        );

        assert.match(
            response.message,
            /SlowTool/
        );
    }
);

test(
    "Agent executes independent tools in parallel",
    async () => {

        const toolA =
            new SlowTestTool(
                "ToolA",
                1000
            );

        const toolB =
            new SlowTestTool(
                "ToolB",
                1000
            );

        const registry =
            new ToolRegistry();

        registry.register(toolA);
        registry.register(toolB);

        const history =
            new MessageHistory();

        const toolCalls: ToolCall[] = [
            {
                id: "call-a",
                toolName: "ToolA",
                arguments: {},
            },
            {
                id: "call-b",
                toolName: "ToolB",
                arguments: {},
            },
        ];

        const llm =
            new MultiToolTestLLMProvider(
                toolCalls
            );

        const agent =
            new Agent(
                registry,
                history,
                llm
            );

        const start =
            Date.now();

        const response =
            await agent.chat(
                "Run both tools"
            );

        const duration =
            Date.now() - start;

        assert.equal(
            response.message,
            "Both tools completed."
        );

        assert.ok(
            duration < 1800,
            `Expected parallel execution to finish in under 1800ms, but took ${duration}ms`
        );
    }
);

test(
    "Agent preserves tool call IDs for multiple tool calls",
    async () => {

        const toolA =
            new SlowTestTool(
                "ToolA",
                100
            );

        const toolB =
            new SlowTestTool(
                "ToolB",
                100
            );

        const registry =
            new ToolRegistry();

        registry.register(toolA);
        registry.register(toolB);

        const history =
            new MessageHistory();

        const toolCalls: ToolCall[] = [
            {
                id: "call-a",
                toolName: "ToolA",
                arguments: {},
            },
            {
                id: "call-b",
                toolName: "ToolB",
                arguments: {},
            },
        ];

        let callCount = 0;

        const llm: LLMProvider = {

            async generate(
                messages: Message[],
                tools: ToolDefinition[]
            ): Promise<LLMResponse> {

                callCount++;

                if (callCount === 1) {
                    return {
                        isFinal: false,
                        toolCalls,
                    };
                }

                const toolResults =
                    messages.filter(
                        message =>
                            message.role === "tool"
                    );

                return {
                    isFinal: true,
                    message:
                        JSON.stringify(
                            toolResults
                        ),
                    toolCalls: [],
                };
            },
        };

        const agent =
            new Agent(
                registry,
                history,
                llm
            );

        const response =
            await agent.chat(
                "Run both tools"
            );

        const results =
            JSON.parse(
                response.message
            );

        assert.equal(
            results.length,
            2
        );

        const resultA =
            results.find(
                (result: any) =>
                    result.toolCallId === "call-a"
            );

        const resultB =
            results.find(
                (result: any) =>
                    result.toolCallId === "call-b"
            );

        assert.ok(resultA);
        assert.ok(resultB);

        assert.equal(
            resultA.toolName,
            "ToolA"
        );

        assert.equal(
            resultB.toolName,
            "ToolB"
        );

        assert.equal(
            resultA.content.success,
            true
        );

        assert.equal(
            resultB.content.success,
            true
        );

        assert.equal(
            resultA.content.toolCallId,
            "call-a"
        );

        assert.equal(
            resultB.content.toolCallId,
            "call-b"
        );
    }
);
