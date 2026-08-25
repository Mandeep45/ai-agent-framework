import { OpenAIProvider } from "@openai/agents";

export async function createGroqModel() {
    const groqProvider =
        new OpenAIProvider({
            apiKey:
                process.env.GROQ_API_KEY,

            baseURL:
                "https://api.groq.com/openai/v1",

            useResponses: false,
        });

    return groqProvider.getModel(
        "openai/gpt-oss-20b"
    );
}