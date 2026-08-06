import { Agent } from "./agent/Agent";
import { MessageHistory } from "./agent/MessageHistory";
import { FakeLLMProvider } from "./llm/FakeLLMProvider";
import { ToolRegistry } from "./registry/ToolRegistry";

async function main() {
  const registry = new ToolRegistry();

  const history = new MessageHistory();

  const llm = new FakeLLMProvider();

  const agent = new Agent(
    registry,
    history,
    llm
  );

  const response = await agent.chat("Hello");

  console.log(response);
}

main();
