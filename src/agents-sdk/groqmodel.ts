import {
    OpenAIProvider,
} from "@openai/agents";

import {
    config,
} from "../config";


export async function createGroqModel() {

    if (
        !config.groq.apiKey
    ) {
        throw new Error(
            "GROQ_API_KEY is not configured."
        );
    }

    const provider =
        new OpenAIProvider({
            apiKey:
                config.groq.apiKey,

            baseURL:
                "https://api.groq.com/openai/v1",

            useResponses:
                false,
        });

    return provider.getModel(
        config.groq.model
    );
}