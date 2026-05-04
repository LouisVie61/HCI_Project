import { useState, useCallback } from 'react';
import { ChatMessage } from '../types';
import { chatApi } from '../api/endpoints';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    setLoading(true);
    setError(null);

    try {
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content,
        sender: 'user',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send to API
      const result = await chatApi.sendMessage(content);

      if (result.error) {
        setError(result.error);
        return;
      }

      const aiMessage = result.data as ChatMessage;
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      setError(err?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
  };
};
