import { Agent } from "./agent/Agent";
import { MessageHistory } from "./agent/MessageHistory";
import { FakeLLMProvider } from "./llm/FakeLLMProvider";
import { ToolRegistry } from "./registry/ToolRegistry";

import { CustomerService } from "./services/CustomerService";
import { CustomerTool } from "./tools/CustomerTool";
import { ConsoleLogger } from "./logger/ConsoleLogger";

async function main() {
  const registry = new ToolRegistry();

  const logger = new ConsoleLogger();
  const customerService = new CustomerService(logger);
  const customerTool = new CustomerTool(customerService);

  registry.register(customerTool);

  const history = new MessageHistory();

  const llm = new FakeLLMProvider(logger);

  const agent = new Agent(
    registry,
    history,
    llm
  );

  console.log("Registered Tools:");
  console.log(registry.getDefinitions());

  const response = await agent.chat("Find customer ABC");

  console.log(response);
}

main();