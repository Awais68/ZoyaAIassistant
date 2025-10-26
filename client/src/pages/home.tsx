import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import VoiceInterface from "@/components/voice-interface";
import Dashboard from "@/components/dashboard";
import TextInput from "@/components/text-input";
import { useWebSocket } from "@/hooks/use-websocket";

export default function Home() {
  const [currentLanguage, setCurrentLanguage] = useState<"en" | "ur" | "roman-ur">("en");
  const [isOnline, setIsOnline] = useState(true);

  // Real-time updates via WebSocket
  const { lastMessage, sendMessage } = useWebSocket();

  // Dashboard data
  const { data: dashboardData, refetch: refetchDashboard } = useQuery({
    queryKey: ['/api/dashboard'],
  });

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage.data);
        switch (message.type) {
          case 'email_created':
          case 'event_created':
          case 'task_created':
          case 'reminder_created':
          case 'command_executed':
            refetchDashboard();
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    }
  }, [lastMessage, refetchDashboard]);

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case "en": return "EN";
      case "ur": return "اردو";
      case "roman-ur": return "Roman";
      default: return "EN";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50 glassmorphism">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"
              data-testid="logo-container"
            >
              <i className="fas fa-robot text-primary-foreground text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground" data-testid="app-title">
                Zoya
              </h1>
              <p className="text-sm text-muted-foreground" data-testid="app-subtitle">
                AI Personal Assistant
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <div className="flex items-center space-x-2 bg-secondary rounded-lg p-1">
              {["en", "ur", "roman-ur"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCurrentLanguage(lang as "en" | "ur" | "roman-ur")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentLanguage === lang
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`button-language-${lang}`}
                >
                  {getLanguageLabel(lang)}
                </button>
              ))}
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center space-x-2">
              <div 
                className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
                data-testid="status-indicator"
              />
              <span className="text-sm text-muted-foreground" data-testid="status-text">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Voice Interface & Quick Actions */}
          <div className="lg:col-span-1">
            <VoiceInterface 
              language={currentLanguage}
              onLanguageDetected={setCurrentLanguage}
            />
          </div>

          {/* Dashboard Content */}
          <div className="lg:col-span-3">
            <Dashboard 
              data={dashboardData}
              currentDate={currentDate}
              language={currentLanguage}
            />
          </div>
        </div>
      </main>

      {/* Text Input Section */}
      <TextInput language={currentLanguage} />
    </div>
  );
}
