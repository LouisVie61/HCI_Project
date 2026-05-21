import { useCallback, useEffect, useState } from "react";

import { chatApi } from "../api/endpoints";
import { ChatAttachment, ChatConversationDetail, ChatConversationSummary, ChatHistoryMessage, ChatMessage, ChatMessageResponse, ComposerAttachment } from "../types";

const toHistoryMessage = (message: ChatMessage): ChatHistoryMessage => ({
  role: message.sender === "ai" ? "assistant" : "user",
  content: message.content,
});

const normalizeAttachments = (attachments: ChatAttachment[] | undefined) => attachments ?? [];

const normalizeMessage = (message: ChatMessage): ChatMessage => ({
  ...message,
  attachments: normalizeAttachments(message.attachments),
});

const toChatMessage = (message: ChatMessageResponse): ChatMessage => ({
  id: message.id,
  content: message.content,
  sender: "ai",
  timestamp: message.timestamp,
  attachments: normalizeAttachments(message.attachments),
});

const toOptimisticAttachment = (attachment: ComposerAttachment): ChatAttachment => ({
  id: attachment.id,
  name: attachment.file.name,
  kind: attachment.kind,
  media_type: attachment.file.type || "application/octet-stream",
  size_bytes: attachment.file.size,
  url: attachment.preview_url,
  text_excerpt: null,
});

const sortConversations = (items: ChatConversationSummary[]) => [...items].sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());

const upsertConversation = (items: ChatConversationSummary[], conversation: ChatConversationSummary) => sortConversations([conversation, ...items.filter((item) => item.id !== conversation.id)]);

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversationDetail = useCallback(async (conversationId: string) => {
    const result = await chatApi.getConversation(conversationId);
    if (result.error) {
      return { error: result.error, conversation: null };
    }

    return {
      error: null,
      conversation: result.data as ChatConversationDetail,
    };
  }, []);

  const applyConversationDetail = useCallback((conversation: ChatConversationDetail) => {
    setActiveConversationId(conversation.id);
    setMessages(conversation.messages.map(normalizeMessage));
    setConversations((prev) => upsertConversation(prev, conversation));
  }, []);

  const selectConversation = useCallback(
    async (conversationId: string) => {
      setLoadingHistory(true);
      setError(null);

      const detailResult = await fetchConversationDetail(conversationId);
      if (detailResult.error || !detailResult.conversation) {
        setError(detailResult.error || "Failed to load conversation");
        setLoadingHistory(false);
        return false;
      }

      applyConversationDetail(detailResult.conversation);
      setLoadingHistory(false);
      return true;
    },
    [applyConversationDetail, fetchConversationDetail],
  );

  useEffect(() => {
    let ignore = false;

    const initialize = async () => {
      setLoadingHistory(true);
      setError(null);

      const result = await chatApi.listConversations();
      if (ignore) {
        return;
      }

      if (result.error) {
        setError(result.error);
        setLoadingHistory(false);
        return;
      }

      const items = ((result.data as ChatConversationSummary[] | undefined) ?? []).slice();
      const sortedItems = sortConversations(items);
      setConversations(sortedItems);

      if (!sortedItems.length) {
        setActiveConversationId(null);
        setMessages([]);
        setLoadingHistory(false);
        return;
      }

      const detailResult = await fetchConversationDetail(sortedItems[0].id);
      if (ignore) {
        return;
      }

      if (detailResult.error || !detailResult.conversation) {
        setError(detailResult.error || "Failed to load conversation");
        setLoadingHistory(false);
        return;
      }

      applyConversationDetail(detailResult.conversation);
      setLoadingHistory(false);
    };

    void initialize();

    return () => {
      ignore = true;
    };
  }, [applyConversationDetail, fetchConversationDetail]);

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (content: string, attachments: ComposerAttachment[] = []) => {
      const trimmedContent = content.trim();
      if ((!trimmedContent && !attachments.length) || loading) {
        return false;
      }

      setLoading(true);
      setError(null);

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        content: trimmedContent,
        sender: "user",
        timestamp: new Date().toISOString(),
        attachments: attachments.map(toOptimisticAttachment),
      };
      const placeholderId = `assistant-${Date.now()}`;
      const placeholderMessage: ChatMessage = {
        id: placeholderId,
        content: "",
        sender: "ai",
        timestamp: new Date().toISOString(),
        attachments: [],
      };

      let completed = false;
      let receivedDelta = false;
      let finalConversationId: string | null = null;
      let refreshedHistory = attachments.length === 0;

      try {
        const history = activeConversationId ? [] : messages.map(toHistoryMessage);
        setMessages((prev) => [...prev, userMessage, placeholderMessage]);

        await chatApi.streamMessage(
          trimmedContent,
          history,
          activeConversationId,
          attachments.map((attachment) => attachment.file),
          {
            onConversation: (conversation) => {
              setActiveConversationId(conversation.id);
              setConversations((prev) => upsertConversation(prev, conversation));
            },
            onDelta: (delta) => {
              receivedDelta = true;
              setMessages((prev) => prev.map((message) => (message.id === placeholderId ? { ...message, content: `${message.content}${delta}` } : message)));
            },
            onDone: (message, conversation) => {
              completed = true;
              finalConversationId = message.conversation_id;
              setActiveConversationId(message.conversation_id);
              setConversations((prev) => upsertConversation(prev, conversation));
              setMessages((prev) => prev.map((item) => (item.id === placeholderId ? toChatMessage(message) : item)));
            },
            onError: (detail) => {
              setError(detail);
            },
          },
        );

        if (completed && attachments.length && finalConversationId) {
          const detailResult = await fetchConversationDetail(finalConversationId);
          if (detailResult.error || !detailResult.conversation) {
            setError(detailResult.error || "Failed to refresh conversation attachments");
          } else {
            applyConversationDetail(detailResult.conversation);
            refreshedHistory = true;
          }
        }

        if (!completed) {
          setError((current) => current || "Chat stream ended before completion.");
        }
      } catch (err: any) {
        setError(err?.message || "Failed to send message");
      } finally {
        setLoading(false);

        if (!completed && !receivedDelta) {
          setMessages((prev) => prev.filter((message) => message.id !== placeholderId));
        }
      }

      return completed && refreshedHistory;
    },
    [activeConversationId, applyConversationDetail, fetchConversationDetail, loading, messages],
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (loading) {
        return;
      }

      const result = await chatApi.deleteConversation(conversationId);
      if (result.error) {
        setError(result.error);
        return;
      }

      const remaining = conversations.filter((conversation) => conversation.id !== conversationId);
      setConversations(remaining);

      if (activeConversationId !== conversationId) {
        return;
      }

      if (remaining.length) {
        await selectConversation(remaining[0].id);
        return;
      }

      startNewConversation();
    },
    [activeConversationId, conversations, loading, selectConversation, startNewConversation],
  );

  return {
    messages,
    conversations,
    activeConversationId,
    loading,
    loadingHistory,
    error,
    sendMessage,
    selectConversation,
    startNewConversation,
    deleteConversation,
  };
};
