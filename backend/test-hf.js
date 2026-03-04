import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const testAI = async () => {
  try {
    console.log("Testing Hugging Face GPT-2 API...");
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/gpt2",
      {
        inputs: "You are a real estate assistant. User: Hello, what properties do you have? Assistant:",
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
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("✅ Success:", response.status);
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log("❌ Error:", error.response?.status);
    console.log(
      "Message:",
      JSON.stringify(error.response?.data, null, 2)
    );
    console.log("Error:", error.message);
  }
};

testAI();
