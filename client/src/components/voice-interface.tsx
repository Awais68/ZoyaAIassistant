import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VoiceInterfaceProps {
  language: "en" | "ur" | "roman-ur";
  onLanguageDetected?: (language: "en" | "ur" | "roman-ur") => void;
}

export default function VoiceInterface({ language, onLanguageDetected }: VoiceInterfaceProps) {
  const [voiceStatus, setVoiceStatus] = useState("Ready to listen...");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { 
    isListening, 
    startListening, 
    stopListening, 
    transcript, 
    isSupported 
  } = useVoiceRecognition({
    language,
    onStart: () => setVoiceStatus("Listening..."),
    onEnd: () => setVoiceStatus("Ready to listen..."),
    onResult: (result) => {
      if (result) {
        processVoiceCommand(result);
      }
    },
    onError: (error) => {
      setVoiceStatus("Error occurred");
      toast({
        title: "Voice Recognition Error",
        description: error,
        variant: "destructive",
      });
    }
  });

  const { speak } = useTextToSpeech({ language });

  const processCommandMutation = useMutation({
    mutationFn: async (data: { input: string; language: string; inputType: string }) => {
      const response = await apiRequest("POST", "/api/commands/process", data);
      return response.json();
    },
    onSuccess: (data) => {
      setVoiceStatus("Command processed");
      if (data.response) {
        speak(data.response);
      }
      if (data.language && onLanguageDetected) {
        onLanguageDetected(data.language);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/commands/history'] });
    },
    onError: (error) => {
      setVoiceStatus("Failed to process");
      toast({
        title: "Command Processing Failed",
        description: "Could not process your voice command",
        variant: "destructive",
      });
    }
  });

  const processVoiceCommand = (input: string) => {
    setVoiceStatus("Processing...");
    processCommandMutation.mutate({
      input,
      language,
      inputType: "voice"
    });
  };

  const toggleVoiceRecognition = () => {
    if (!isSupported) {
      toast({
        title: "Voice Recognition Not Supported",
        description: "Your browser doesn't support voice recognition",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleQuickAction = (action: string) => {
    const commands = {
      checkCalendar: {
        en: "Check my calendar for today",
        ur: "آج کے لیے میرا کیلنڈر چیک کریں",
        "roman-ur": "Aaj ke liye mera calendar check karo"
      },
      checkEmails: {
        en: "Check my unread emails",
        ur: "میری نئی ایمیلز چیک کریں",
        "roman-ur": "Meri nayi emails check karo"
      },
      setReminder: {
        en: "Set a reminder for 5 PM",
        ur: "5 بجے کے لیے ریمائنڈر سیٹ کریں",
        "roman-ur": "5 baje ke liye reminder set karo"
      },
      viewTasks: {
        en: "Show my pending tasks",
        ur: "میرے پینڈنگ ٹاسک دکھائیں",
        "roman-ur": "Mere pending tasks dikhao"
      }
    };

    const command = commands[action as keyof typeof commands]?.[language] || commands[action as keyof typeof commands].en;
    processVoiceCommand(command);
  };

  return (
    <div className="space-y-6">
      {/* Voice Input */}
      <Card data-testid="voice-input-card">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <i className="fas fa-microphone text-primary mr-2"></i>
            Voice Commands
          </h2>
          
          {/* Voice Button */}
          <div className="text-center mb-4">
            <Button
              onClick={toggleVoiceRecognition}
              disabled={!isSupported || processCommandMutation.isPending}
              className={`w-20 h-20 rounded-full transition-all duration-200 voice-pulse ${
                isListening ? 'voice-listening' : ''
              }`}
              data-testid="button-voice-toggle"
            >
              <i className="fas fa-microphone text-2xl"></i>
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              {isSupported ? "Tap to speak" : "Voice not supported"}
            </p>
          </div>
          
          {/* Voice Status */}
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground" data-testid="voice-status">
              {voiceStatus}
            </p>
            {transcript && (
              <p className="text-sm text-foreground mt-1" data-testid="voice-transcript">
                "{transcript}"
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card data-testid="quick-actions-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button
              onClick={() => handleQuickAction("checkCalendar")}
              variant="secondary"
              className="w-full justify-start"
              disabled={processCommandMutation.isPending}
              data-testid="button-check-calendar"
            >
              <i className="fas fa-calendar text-blue-500 mr-3"></i>
              Check Calendar
            </Button>
            <Button
              onClick={() => handleQuickAction("checkEmails")}
              variant="secondary"
              className="w-full justify-start"
              disabled={processCommandMutation.isPending}
              data-testid="button-check-emails"
            >
              <i className="fas fa-envelope text-orange-500 mr-3"></i>
              New Emails
            </Button>
            <Button
              onClick={() => handleQuickAction("setReminder")}
              variant="secondary"
              className="w-full justify-start"
              disabled={processCommandMutation.isPending}
              data-testid="button-set-reminder"
            >
              <i className="fas fa-bell text-green-500 mr-3"></i>
              Set Reminder
            </Button>
            <Button
              onClick={() => handleQuickAction("viewTasks")}
              variant="secondary"
              className="w-full justify-start"
              disabled={processCommandMutation.isPending}
              data-testid="button-view-tasks"
            >
              <i className="fas fa-tasks text-purple-500 mr-3"></i>
              View Tasks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
