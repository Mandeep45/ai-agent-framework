export interface Tool {
    
    // Unique name of the tool. Used by the Agent and ToolRegistry.
    name: string;
  
    // Human-readable description. Helps the LLM decide when to use this tool.
    description: string;
  
    // Schema describing the expected input. We will replace `unknown` with Zod later.
    inputSchema: unknown;
  
    // Executes the tool.
    execute(input: unknown): Promise<unknown>;
  }