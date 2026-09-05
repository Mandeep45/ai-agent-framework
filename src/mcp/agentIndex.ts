import "dotenv/config";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

import { ToolRegistry } from "../registry/ToolRegistry";
import { MessageHistory } from "../agent/MessageHistory";
import { Agent } from "../agent/Agent";
import {  GroqProvider } from "../llm/GroqProvider";

import { registerMcpTools } from "./McpToolAdapter";
import { ConsoleLogger } from "../logger/ConsoleLogger";

async function main() {

    const client = new Client({
        name: "ai-agent",
        version: "1.0.0",
    });

    const transport =
        new StdioClientTransport({
            command: "tsx",
            args: ["src/mcp/server.ts"],
        });

    await client.connect(
        transport
    );

    console.log(
        "Connected to MCP server."
    );

    const registry =
        new ToolRegistry();

    await registerMcpTools(
        client,
        registry
    );

    console.log(
        "\nRegistered MCP tools:"
    );

    console.log(
        registry.getDefinitions()
    );

    const history =
        new MessageHistory();
    
    const logger = new ConsoleLogger();

    const llm = new GroqProvider(logger)

    const agent =
        new Agent(
            registry,
            history,
            llm
        );

    const response =
        await agent.chat(
            "Place 1 unit of product XYZ for customer ABC"
        );

    console.log(
        "\nAgent response:\n"
    );

    console.log(
        response.message
    );

    await client.close();
}

main().catch(console.error);