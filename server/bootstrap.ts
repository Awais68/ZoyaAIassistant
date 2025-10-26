import dotenv from "dotenv";
import path from "path";

// Ensure server/.env is loaded before any other module runs.
dotenv.config({ path: path.resolve(process.cwd(), "server", ".env") });

// Diagnostic: show if GEMINI_API_KEY is available (masked)
const _geminiKey = process.env.GEMINI_API_KEY;
if (_geminiKey) {
  const masked = `${_geminiKey.slice(0, 4)}...${_geminiKey.slice(-4)}`;
  console.log(`GEMINI_API_KEY loaded: ${masked}`);
} else {
  console.log("GEMINI_API_KEY not found in process.env");
}

// Dynamically import the main server after dotenv runs so imports inside
// the main server see the loaded environment variables.
await import("./index");
