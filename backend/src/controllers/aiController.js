import axios from "axios";

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

// Together AI model (free tier supported)
const TOGETHER_MODEL = "meta-llama/Llama-2-7b-chat-hf";
const TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions";

export const sendMessageToAI = async (req, res) => {
    try {
        const { message } = req.body;
        const userEmail = req.user?.email || "anonymous";

        console.log(`📨 AI Request received from ${userEmail}: "${message.substring(0, 50)}..."`);

        if (!message || !message.trim()) {
            console.warn("❌ Message is empty");
            return res.status(400).json({ error: "Message is required" });
        }

        if (!HUGGINGFACE_API_KEY) {
            console.error("❌ HUGGINGFACE_API_KEY is not set in environment variables");
            return res.status(500).json({ error: "AI service is not configured" });
        }

        try {
            console.log(`🤖 Sending request to Hugging Face (${HUGGINGFACE_MODEL})...`);
            
            const systemPrompt = `You are Ghor AI, a helpful real estate assistant for a property rental and sales platform called "GHOR BARI" (which means "home" in Bengali). You help users find properties, answer questions about real estate, provide advice on renting or buying properties in Bangladesh, and assist with any property-related queries.

Be friendly, professional, and helpful. Keep responses concise and informative.`;

            const prompt = `${systemPrompt}\n\nUser: ${message}\nAssistant:`;

            const response = await axios.post(
                HUGGINGFACE_API_URL,
                {
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 256,
                        temperature: 0.7,
                        top_p: 0.95,
                        do_sample: true,
                    }
                },
                {
                    timeout: 30000,
                    headers: {
                        "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
                        "Content-Type": "application/json",
                    }
                }
            );

            // Hugging Face text-generation API returns an array with generated_text
            if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
                let aiResponse = response.data[0]?.generated_text;
                
                if (aiResponse) {
                    // Extract only the assistant's response (after "Assistant:")
                    const assistantIndex = aiResponse.lastIndexOf("Assistant:");
                    if (assistantIndex !== -1) {
                        aiResponse = aiResponse.substring(assistantIndex + 10).trim();
                    }
                    
                    console.log(`✅ Successfully received response from Hugging Face for user: ${userEmail}`);
                    return res.status(200).json({
                        success: true,
                        response: aiResponse.trim(),
                        model: HUGGINGFACE_MODEL
                    });
                }
            }

            console.error("❌ Invalid response structure from Hugging Face");
            return res.status(503).json({
                error: "Unable to process your request. AI service returned invalid response.",
                details: "Response parsing failed"
            });
            
        } catch (error) {
            const statusCode = error.response?.status;
            const errorMessage = error.response?.data?.error || error.message;
            
            console.error(`❌ Hugging Face API error (${statusCode}):`, errorMessage);

            // Handle specific errors
            if (statusCode === 401 || statusCode === 403) {
                return res.status(401).json({
                    error: "AI service authentication failed. Please check your configuration.",
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
