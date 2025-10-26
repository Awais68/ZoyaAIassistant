export function detectLanguage(text: string): "en" | "ur" | "roman-ur" {
  // Check for Urdu script (Arabic-like characters)
  const urduPattern = /[\u0600-\u06FF]/;
  if (urduPattern.test(text)) {
    return "ur";
  }

  // Check for Roman Urdu patterns (common Urdu words in Latin script)
  const romanUrduPatterns = [
    /\b(aap|ap|main|mai|hoon|hun|hai|hain|ka|ki|ke|ko|se|me|mein|par|pe)\b/i,
    /\b(kya|kaise|kahan|kab|kyun|kyu|kaun|kon)\b/i,
    /\b(achha|acha|theek|thik|bhi|bhe|nahi|nahin)\b/i,
    /\b(jana|jana|karna|karna|dena|lena)\b/i,
    /\b(ghar|office|school|university|hospital)\b/i,
    /\b(meeting|call|email|reminder|task)\b/i
  ];

  const romanUrduScore = romanUrduPatterns.reduce((score, pattern) => {
    return score + (pattern.test(text) ? 1 : 0);
  }, 0);

  // If we have 2 or more Roman Urdu patterns, classify as Roman Urdu
  if (romanUrduScore >= 2) {
    return "roman-ur";
  }

  // Check for common Roman Urdu phrases
  const romanUrduPhrases = [
    /\b(mera|meri|mere|tumhara|tumhari|tumhare)\b/i,
    /\b(calendar|check|karo|kar|do|lagao|dikhao)\b/i,
    /\b(time|waqt|samay|baje|subah|sham|raat)\b/i
  ];

  if (romanUrduPhrases.some(pattern => pattern.test(text))) {
    return "roman-ur";
  }

  // Default to English
  return "en";
}

export function getLanguageDirection(language: "en" | "ur" | "roman-ur"): "ltr" | "rtl" {
  return language === "ur" ? "rtl" : "ltr";
}

export function getLanguageLocale(language: "en" | "ur" | "roman-ur"): string {
  switch (language) {
    case "ur": return "ur-PK";
    case "roman-ur": return "en-US"; // Roman Urdu uses English locale for formatting
    case "en": return "en-US";
    default: return "en-US";
  }
}

export function formatDateTime(date: Date, language: "en" | "ur" | "roman-ur"): string {
  const locale = getLanguageLocale(language);
  
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return date.toLocaleDateString(locale, options);
}

export function translateText(key: string, language: "en" | "ur" | "roman-ur"): string {
  const translations: Record<string, Record<string, string>> = {
    // Common UI elements
    today: {
      en: "Today",
      ur: "آج",
      "roman-ur": "Aaj"
    },
    tomorrow: {
      en: "Tomorrow", 
      ur: "کل",
      "roman-ur": "Kal"
    },
    meeting: {
      en: "Meeting",
      ur: "میٹنگ",
      "roman-ur": "Meeting"
    },
    email: {
      en: "Email",
      ur: "ای میل",
      "roman-ur": "Email"
    },
    task: {
      en: "Task",
      ur: "کام",
      "roman-ur": "Task"
    },
    reminder: {
      en: "Reminder",
      ur: "یاد دہانی",
      "roman-ur": "Reminder"
    },
    completed: {
      en: "Completed",
      ur: "مکمل",
      "roman-ur": "Complete"
    },
    pending: {
      en: "Pending",
      ur: "باقی",
      "roman-ur": "Pending"
    },
    high: {
      en: "High",
      ur: "زیادہ",
      "roman-ur": "High"
    },
    medium: {
      en: "Medium", 
      ur: "درمیانہ",
      "roman-ur": "Medium"
    },
    low: {
      en: "Low",
      ur: "کم",
      "roman-ur": "Low"
    }
  };

  return translations[key]?.[language] || translations[key]?.en || key;
}
