import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

export const llm = new ChatOpenAI({
    model: "openai/gpt-oss-20b",
    apiKey: process.env.GROQ_API_KEY,
    configuration: {
        baseURL: "https://api.groq.com/openai/v1",
    },
});