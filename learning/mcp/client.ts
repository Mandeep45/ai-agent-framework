import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

async function main() {
    const client = new Client({
        name: "ai-agent-mcp-client",
        version: "1.0.0",
    });

    const transport = new StdioClientTransport({
        command: "npx",
        args: [
            "tsx",
            "src/mcp/server.ts",
        ],
    });

    await client.connect(transport);

    const tools = await client.listTools();

    console.log("\nAvailable MCP tools:\n");

    console.log(tools.tools);

    const result = await client.callTool({
        name: "get_customer",
        arguments: {
            customerId: "ABC",
        },
    });

    console.log("\nTool result:\n");

    console.log(result);

    const inventoryResult = await client.callTool({
        name: "get_inventory",
        arguments: {
            productId: "XYZ",
        },
    });
    
    console.log("\nInventory result:\n");
    
    console.log(inventoryResult);

    const orderResult = await client.callTool({
        name: "place_order",
        arguments: {
            customerId: "ABC",
            productId: "XYZ",
            quantity: 1,
        },
    });
    
    console.log("\nOrder result:\n");
    console.log(orderResult);

    await client.close();
}

main().catch(console.error);