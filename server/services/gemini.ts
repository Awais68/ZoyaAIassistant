import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable."
  );
}

const genAI = new GoogleGenerativeAI(apiKey);

const TEXT_MODEL = "gemini-pro";
const CHAT_MODEL = "gemini-pro";

// Fallback system when API is unavailable
let apiAvailable = true;
let lastApiCheck = Date.now();
const API_CHECK_INTERVAL = 60000; // 1 minute

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

// Simple pattern matching fallback
function fallbackCommandProcessing(input: string, language: string): AIResponse {
  const lowerInput = input.toLowerCase();

  // Pattern matching for common commands
  if (lowerInput.includes('meeting') || lowerInput.includes('schedule')) {
    return {
      intent: {
        action: 'check_calendar',
        parameters: { query: input },
        language,
        confidence: 0.6,
      },
      response: language === 'ur'
        ? 'میں آپ کی کیلنڈر چیک کر رہی ہوں'
        : language === 'roman-ur'
          ? 'Main aap ki calendar check kar rahi hun'
          : "Let me check your calendar",
      language,
    };
  }

  if (lowerInput.includes('email') || lowerInput.includes('mail')) {
    return {
      intent: {
        action: 'check_emails',
        parameters: {},
        language,
        confidence: 0.6,
      },
      response: language === 'ur'
        ? 'میں آپ کے ای میل چیک کر رہی ہوں'
        : language === 'roman-ur'
          ? 'Main aap ke emails check kar rahi hun'
          : "Let me check your emails",
      language,
    };
  }

  // Create task/note detection
  if (lowerInput.match(/create|add|make|save|take|write|new.*(?:task|todo|note|reminder)/i) ||
    lowerInput.match(/(?:task|todo|note|reminder).*(?:create|add|make|save|take|write|new)/i)) {
    // Extract the task title from the input
    let title = input;
    const patterns = [
      /(?:create|add|make|save|take|write|new)\s+(?:a\s+)?(?:task|todo|note|reminder)?\s*(?:to|for|about|that|:)?\s*(.+)/i,
      /(?:task|todo|note|reminder)\s*(?:to|for|about|that|:)?\s*(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        title = match[1].trim();
        break;
      }
    }

    return {
      intent: {
        action: 'create_task',
        parameters: {
          title: title,
          description: title
        },
        language,
        confidence: 0.7,
      },
      response: language === 'ur'
        ? `ٹاسک بنایا جا رہا ہے: ${title}`
        : language === 'roman-ur'
          ? `Task banaya ja raha hai: ${title}`
          : `Creating task: ${title}`,
      language,
    };
  }

  // Check tasks/notes
  if (lowerInput.includes('task') || lowerInput.includes('todo') || lowerInput.includes('note')) {
    return {
      intent: {
        action: 'check_tasks',
        parameters: {},
        language,
        confidence: 0.6,
      },
      response: language === 'ur'
        ? 'میں آپ کے ٹاسک چیک کر رہی ہوں'
        : language === 'roman-ur'
          ? 'Main aap ke tasks check kar rahi hun'
          : "Let me check your tasks",
      language,
    };
  }

  // Greeting detection
  if (lowerInput.match(/^(hi|hello|hey|salam|assalam)/)) {
    return {
      intent: {
        action: 'greeting',
        parameters: {},
        language,
        confidence: 0.8,
      },
      response: language === 'ur'
        ? 'السلام علیکم! میں زویا ہوں، آپ کی ذاتی معاون۔ میں کیسے مدد کر سکتی ہوں؟'
        : language === 'roman-ur'
          ? 'Assalam o alaikum! Main Zoya hun, aap ki personal assistant. Main kaise madad kar sakti hun?'
          : "Hello! I'm Zoya, your personal assistant. How can I help you today?",
      language,
    };
  }

  // Default response
  return {
    intent: {
      action: 'unknown',
      parameters: { query: input },
      language,
      confidence: 0.3,
    },
    response: language === 'ur'
      ? 'معذرت، میں آپ کی مدد کرنے کی کوشش کر رہی ہوں۔ براہ کرم زیادہ تفصیل سے بتائیں'
      : language === 'roman-ur'
        ? 'Maazrat, main aap ki madad karne ki koshish kar rahi hun. Meherbani karke zyada tafseel se batayein'
        : "I'm here to help! Could you please be more specific about what you need?",
    language,
  };
}

export async function processNaturalLanguageCommand(
  input: string,
  language: string = "en"
): Promise<AIResponse> {
  // Check if we should retry API (circuit breaker pattern)
  const now = Date.now();
  if (!apiAvailable && (now - lastApiCheck) < API_CHECK_INTERVAL) {
    console.log('Using fallback - API temporarily unavailable');
    return fallbackCommandProcessing(input, language);
  }

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

    // API worked! Mark as available
    apiAvailable = true;
    lastApiCheck = now;

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
  } catch (error: any) {
    console.error("Gemini processing error:", error);

    // Mark API as unavailable if it's a 404 or authentication error
    if (error?.status === 404 || error?.status === 401 || error?.status === 403) {
      apiAvailable = false;
      lastApiCheck = now;
      console.warn('Gemini API unavailable, switching to fallback mode');
    }

    // Use fallback instead of generic error message
    return fallbackCommandProcessing(input, language);
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

    // Return a basic template instead of error message
    return `Dear [Recipient],

${context}

Subject: ${subject}

Best regards,
[Your Name]`;
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

    // Return basic summary instead of error
    const summary = emails.map((email, idx) =>
      `${idx + 1}. From ${email.sender}: ${email.subject}`
    ).join('\n');

    return `You have ${emails.length} email(s):\n\n${summary}`;
  }
}

// Health check function
export async function checkGeminiHealth(): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: CHAT_MODEL });
    await model.generateContent("test");
    return true;
  } catch (error) {
    return false;
  }
}
