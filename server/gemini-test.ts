import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.resolve(process.cwd(), "server", ".env") });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found");
  }

  console.log("Testing Gemini API connection...");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  try {
    console.log("Sending test message...");
    const result = await model.generateContent("Say hello!");
    const response = await result.response;
    console.log("Response:", response.text());
  } catch (error) {
    console.error("Error details:", error);
    throw error;
  }
}

testGemini().catch(console.error);
