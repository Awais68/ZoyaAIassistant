import { useRef, useCallback } from "react";

interface UseTextToSpeechProps {
  language: "en" | "ur" | "roman-ur";
}

export function useTextToSpeech({ language }: UseTextToSpeechProps) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string) => {
    // Check if Speech Synthesis is supported
    if (!('speechSynthesis' in window)) {
      console.warn("Text-to-speech is not supported in this browser");
      return;
    }

    // Stop any ongoing speech
    if (utteranceRef.current) {
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language and voice properties
    const speechLang = language === "ur" ? "ur-PK" : 
                      language === "roman-ur" ? "en-US" : "en-US";
    utterance.lang = speechLang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    // Try to find an appropriate voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith(speechLang.split('-')[0])
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error);
    };

    utterance.onend = () => {
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [language]);

  const stop = useCallback(() => {
    if (utteranceRef.current) {
      speechSynthesis.cancel();
      utteranceRef.current = null;
    }
  }, []);

  const isSupported = 'speechSynthesis' in window;

  return {
    speak,
    stop,
    isSupported
  };
}
