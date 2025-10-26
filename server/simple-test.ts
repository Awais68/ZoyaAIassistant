import { GoogleGenerativeAI } from "@google/generative-ai";

// Your API key
const genAI = new GoogleGenerativeAI("AIzaSyDKKukoUyH5ob1BsAQxNSIhm2atlokj3JU");

async function run() {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = "Write a simple hello world message.";

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
}

run();
