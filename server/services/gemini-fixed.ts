import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable."
  );
}

const genAI = new GoogleGenerativeAI(apiKey);

const TEXT_MODEL = "gemini-1.5-flash";
const CHAT_MODEL = "gemini-1.5-flash";

export interface CommandIntent {
  action: string;
  parameters: Record<string, any>;
  language: string;
  confidence: number;
}

export interface AIResponse {
  intent: CommandIntent;
  response: string;
  language: string;
}

export async function processNaturalLanguageCommand(
  input: string,
  language: string = "en"
): Promise<AIResponse> {
  try {
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    const prompt = `You are Zoya, an AI personal assistant. Analyze the user's command and extract the intent and parameters. 
          
          Support these actions:
          - schedule_meeting: Schedule a new meeting (requires title, date/time, attendees)
          - check_calendar: Check calendar for specific date or today
          - send_email: Send an email (requires recipient, subject, content)
          - check_emails: Check recent or unread emails
          - create_task: Create a new task (requires title, optional priority/due date)
          - set_reminder: Set a reminder (requires title, date/time)
          - summarize_emails: Summarize recent emails
          - reschedule_meeting: Reschedule an existing meeting
          
          Languages supported: English (en), Urdu (ur), Roman Urdu (roman-ur)
          
          Respond with JSON in this format:
          {
            "intent": {
              "action": "action_name",
              "parameters": { "key": "value" },
              "language": "detected_language",
              "confidence": 0.95
            },
            "response": "Natural response in the detected language",
            "language": "detected_language"
          }
          
          For Roman Urdu, respond in Roman Urdu. For Urdu, respond in Urdu script. For English, respond in English.
          
          User command: ${input}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const parsedResult = JSON.parse(text);

    return {
      intent: {
        action: parsedResult.intent?.action || "unknown",
        parameters: parsedResult.intent?.parameters || {},
        language: parsedResult.intent?.language || language,
        confidence: parsedResult.intent?.confidence || 0.5,
      },
      response: parsedResult.response || "Command processed.",
      language: parsedResult.language || language,
    };
  } catch (error) {
    console.error("Gemini processing error:", error);
    return {
      intent: {
        action: "error",
        parameters: { error: "Failed to process command" },
        language,
        confidence: 0,
      },
      response:
        language === "ur"
          ? "کمانڈ پروسیس نہیں ہو سکا"
          : language === "roman-ur"
            ? "Command process nahi ho saka"
            : "Could not process command",
      language,
    };
  }
}

export async function generateEmailContent(
  subject: string,
  context: string,
  language: string = "en"
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: TEXT_MODEL });

    const prompt = `Generate professional email content based on the subject and context provided. 
          Language: ${language === "ur"
        ? "Urdu"
        : language === "roman-ur"
          ? "Roman Urdu"
          : "English"
      }
          
          Subject: ${subject}
          Context: ${context}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Gemini email generation error:", error);
    return language === "ur"
      ? "ای میل کا مواد تیار نہیں ہو سکا"
      : language === "roman-ur"
        ? "Email ka content tayyar nahi ho saka"
        : "Could not generate email content";
  }
}

export async function summarizeEmails(
  emails: Array<{ subject: string; content: string; sender: string }>,
  language: string = "en"
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: TEXT_MODEL });

    const emailText = emails
      .map(
        (email) =>
          `From: ${email.sender}\nSubject: ${email.subject}\nContent: ${email.content}`
      )
      .join("\n\n---\n\n");

    const prompt = `Summarize the following emails concisely, highlighting key points and action items.
          Language: ${language === "ur"
        ? "Urdu"
        : language === "roman-ur"
          ? "Roman Urdu"
          : "English"
      }
          
          Emails:
          ${emailText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Gemini email summarization error:", error);
    return language === "ur"
      ? "ای میلز کا خلاصہ تیار نہیں ہو سکا"
      : language === "roman-ur"
        ? "Emails ka summary tayyar nahi ho saka"
        : "Could not summarize emails";
  }
}
