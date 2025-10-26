import { useState, useEffect, useRef } from "react";

interface WebSocketMessage {
  data: string;
  type?: string;
}

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'Connecting' | 'Open' | 'Closing' | 'Closed'>('Closed');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);

  const connect = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setConnectionStatus('Open');
        reconnectAttempts.current = 0;
        console.log('WebSocket connected');
      };

      ws.onclose = () => {
        setConnectionStatus('Closed');
        setSocket(null);
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < 5) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('Closed');
      };

      ws.onmessage = (event) => {
        setLastMessage({
          data: event.data,
          type: 'message'
        });
      };

      setSocket(ws);
      setConnectionStatus('Connecting');
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('Closed');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const sendMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  return {
    socket,
    lastMessage,
    connectionStatus,
    sendMessage
  };
}
