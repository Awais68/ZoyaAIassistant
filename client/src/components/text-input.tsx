import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TextInputProps {
  language: "en" | "ur" | "roman-ur";
}

export default function TextInput({ language }: TextInputProps) {
  const [input, setInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { speak } = useTextToSpeech({ language });

  const processCommandMutation = useMutation({
    mutationFn: async (data: { input: string; language: string; inputType: string }) => {
      const response = await apiRequest("POST", "/api/commands/process", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.response) {
        speak(data.response);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/commands/history'] });
      setInput("");
    },
    onError: (error) => {
      toast({
        title: "Command Processing Failed",
        description: "Could not process your command",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (!input.trim()) return;
    
    processCommandMutation.mutate({
      input: input.trim(),
      language,
      inputType: "text"
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const useQuickCommand = (command: string) => {
    setInput(command);
  };

  const quickCommands = [
    {
      en: "Check my calendar for today",
      ur: "آج کے لیے میرا کیلنڈر چیک کریں",
      "roman-ur": "Aaj ke liye mera calendar check karo"
    },
    {
      en: "Summarize unread emails",
      ur: "نئی ایمیلز کا خلاصہ کریں",
      "roman-ur": "Nayi emails ka summary karo"
    },
    {
      en: "Set reminder for 5 PM",
      ur: "5 بجے کے لیے ریمائنڈر سیٹ کریں",
      "roman-ur": "5 baje ke liye reminder set karo"
    }
  ];

  return (
    <div className="sticky bottom-0 bg-card border-t border-border p-4 glassmorphism">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder={
                language === "ur" 
                  ? "اپنا کمانڈ ٹائپ کریں..."
                  : language === "roman-ur"
                  ? "Apna command type karo..."
                  : "Type your command... (e.g., 'Schedule meeting with John tomorrow at 2 PM')"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={processCommandMutation.isPending}
              className="pr-12"
              data-testid="input-text-command"
            />
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || processCommandMutation.isPending}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              variant="ghost"
              data-testid="button-send-command"
            >
              <i className="fas fa-paper-plane"></i>
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="default"
              size="icon"
              className="w-12 h-12"
              data-testid="button-toggle-voice"
            >
              <i className="fas fa-microphone"></i>
            </Button>
            <Button 
              variant="secondary"
              size="icon" 
              className="w-12 h-12"
              data-testid="button-open-settings"
            >
              <i className="fas fa-cog"></i>
            </Button>
          </div>
        </div>
        
        {/* Quick Command Suggestions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {quickCommands.map((cmd, index) => (
            <Button
              key={index}
              onClick={() => useQuickCommand(cmd[language])}
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={processCommandMutation.isPending}
              data-testid={`button-quick-command-${index}`}
            >
              "{cmd[language]}"
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
