import axios from "axios";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Groq model (free tier - very fast)
const GROQ_MODEL = "mixtral-8x7b-32768";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export const sendMessageToAI = async (req, res) => {
    try {
        const { message } = req.body;
        const userEmail = req.user?.email || "anonymous";

        console.log(`📨 AI Request received from ${userEmail}: "${message.substring(0, 50)}..."`);

        if (!message || !message.trim()) {
            console.warn("❌ Message is empty");
            return res.status(400).json({ error: "Message is required" });
        }

        if (!GROQ_API_KEY) {
            console.error("❌ GROQ_API_KEY is not set in environment variables");
            return res.status(500).json({ error: "AI service is not configured" });
        }

        try {
            console.log(`🤖 Sending request to Groq (${GROQ_MODEL})...`);
            
            const systemPrompt = `You are Ghor AI, a helpful real estate assistant for a property rental and sales platform called "GHOR BARI" (which means "home" in Bengali). You help users find properties, answer questions about real estate, provide advice on renting or buying properties in Bangladesh, and assist with any property-related queries.

Be friendly, professional, and helpful. Keep responses concise and informative.`;

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
                            content: message
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 512,
                    top_p: 0.95,
                },
                {
                    timeout: 30000,
                    headers: {
                        "Authorization": `Bearer ${GROQ_API_KEY}`,
                        "Content-Type": "application/json",
                    }
                }
            );

            // Groq returns OpenAI-compatible format
            if (response.status === 200 && response.data?.choices?.[0]?.message?.content) {
                const aiResponse = response.data.choices[0].message.content;
                
                if (aiResponse) {
                    console.log(`✅ Successfully received response from Groq for user: ${userEmail}`);
                    return res.status(200).json({
                        success: true,
                        response: aiResponse.trim(),
                        model: GROQ_MODEL
                    });
                }
            }

            console.error("❌ Invalid response structure from Groq");
            return res.status(503).json({
                error: "Unable to process your request. AI service returned invalid response.",
                details: "Response parsing failed"
            });
            
        } catch (error) {
            const statusCode = error.response?.status;
            const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message;
            
            console.error(`❌ Groq API error (${statusCode}):`, errorMessage);

            // Handle specific errors
            if (statusCode === 401 || statusCode === 403) {
                return res.status(401).json({
                    error: "AI service authentication failed. Please check your API key.",
                    details: "Invalid or expired API key"
                });
            }

            if (statusCode === 429) {
                return res.status(429).json({
                    error: "AI service is experiencing high demand. Please try again in a few moments.",
                    details: "Rate limit reached"
                });
            }

            if (statusCode === 503 || statusCode === 500) {
                return res.status(503).json({
                    error: "AI service is temporarily unavailable. Please try again later.",
                    details: errorMessage
                });
            }

            return res.status(500).json({
                error: "An error occurred while processing your request.",
                details: errorMessage
            });
        }

    } catch (error) {
        console.error("❌ Unexpected error in sendMessageToAI:", error);
        return res.status(500).json({
            error: "An unexpected error occurred. Please try again later.",
            details: error.message
        });
    }
};
