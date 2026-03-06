import axios from "axios";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.1-8b-instant";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export function getGroqModel() {
    return GROQ_MODEL;
}

export function ensureGroqConfigured() {
    if (!GROQ_API_KEY) {
        const error = new Error("AI service is not configured");
        error.statusCode = 500;
        error.details = "GROQ_API_KEY is not set";
        throw error;
    }
}

export async function generateGroqText({
    systemPrompt,
    userPrompt,
    temperature = 0.7,
    maxTokens = 512,
    topP = 0.95,
    timeout = 30000
}) {
    ensureGroqConfigured();

    const response = await axios.post(
        GROQ_API_URL,
        {
            model: GROQ_MODEL,
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ],
            temperature,
            max_tokens: maxTokens,
            top_p: topP
        },
        {
            timeout,
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );

    const content = response.data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
        const error = new Error("AI service returned an invalid response");
        error.statusCode = 503;
        error.details = "Response parsing failed";
        throw error;
    }

    return content;
}
