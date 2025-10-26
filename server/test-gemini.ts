import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

// Load the .env file
dotenv.config({ path: path.resolve(process.cwd(), "server", ".env") });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY not found in environment");
}

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Get the model
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    // Start a chat
    console.log("Creating chat...");
    const chat = model.startChat();

    // Send a message
    console.log("Sending test message...");
    const msg = await chat.sendMessage("Hi, can you hear me?");

    // Get the response
    console.log("Response:", await msg.response.text());
  } catch (error) {
    console.error("Error testing Gemini:", error);
  }
}

console.log("Starting Gemini test...");
testGemini().then(() => console.log("Test complete"));
