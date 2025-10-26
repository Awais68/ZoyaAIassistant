import { useState, useEffect, useRef } from "react";
import { detectLanguage } from "@/lib/language-utils";

interface UseVoiceRecognitionProps {
  language: "en" | "ur" | "roman-ur";
  onStart?: () => void;
  onEnd?: () => void;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecognition({
  language,
  onStart,
  onEnd,
  onResult,
  onError
}: UseVoiceRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      // Set language based on current language setting
      const speechLang = language === "ur" ? "ur-PK" : 
                        language === "roman-ur" ? "en-US" : "en-US";
      recognition.lang = speechLang;

      recognition.onstart = () => {
        setIsListening(true);
        onStart?.();
      };

      recognition.onend = () => {
        setIsListening(false);
        onEnd?.();
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);

        if (finalTranscript) {
          // Clear any existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          // Set a timeout to process the result after a pause
          timeoutRef.current = setTimeout(() => {
            onResult?.(finalTranscript.trim());
            setTranscript("");
          }, 1000);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        onError?.(event.error);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      console.warn("Speech recognition is not supported in this browser");
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [language, onStart, onEnd, onResult, onError]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        onError?.("Failed to start voice recognition");
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening
  };
}
