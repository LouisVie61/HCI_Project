import api, { API_BASE_URL, getStoredToken, readErrorMessage } from "./client";
import type { UserUpdate, ChatConversationSummary, ChatHistoryMessage, ChatMessageResponse, Flashcard, UserScore } from "../types";

type ChatStreamPayload = { type: "conversation"; conversation: ChatConversationSummary } | { type: "delta"; delta: string } | { type: "done"; message: ChatMessageResponse; conversation: ChatConversationSummary } | { type: "error"; detail: string };

interface ChatStreamCallbacks {
  onConversation?: (conversation: ChatConversationSummary) => void;
  onDelta?: (delta: string) => void;
  onDone?: (message: ChatMessageResponse, conversation: ChatConversationSummary) => void;
  onError?: (detail: string) => void;
  signal?: AbortSignal;
}

function takeNextStreamBlock(buffer: string): { block: string; rest: string } | null {
  const match = buffer.match(/\r?\n\r?\n/);
  if (!match || match.index === undefined) {
    return null;
  }

  return {
    block: buffer.slice(0, match.index),
    rest: buffer.slice(match.index + match[0].length),
  };
}

function parseStreamPayload(block: string): ChatStreamPayload | null {
  const dataLines = block.split(/\r?\n/).filter((line) => line.startsWith("data:"));
  if (!dataLines.length) {
    return null;
  }

  const payloadText = dataLines.map((line) => line.slice(5).trimStart()).join("\n");
  if (!payloadText) {
    return null;
  }

  return JSON.parse(payloadText) as ChatStreamPayload;
}

async function streamChatMessage(message: string, history: ChatHistoryMessage[], conversationId: string | null, attachments: File[], callbacks: ChatStreamCallbacks) {
  const token = getStoredToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  let body: BodyInit;

  if (attachments.length) {
    const formData = new FormData();
    formData.append("message", message);
    formData.append("history", JSON.stringify(history));
    if (conversationId) {
      formData.append("conversation_id", conversationId);
    }

    attachments.forEach((file) => {
      formData.append("files", file, file.name);
    });

    body = formData;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({
      message,
      history,
      conversation_id: conversationId,
    });
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/chat/stream`, {
    method: "POST",
    headers,
    body,
    signal: callbacks.signal,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (!response.body) {
    throw new Error("Chat stream is not available.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

    let blockResult = takeNextStreamBlock(buffer);
    while (blockResult) {
      const payload = parseStreamPayload(blockResult.block);
      if (payload) {
        if (payload.type === "conversation") {
          callbacks.onConversation?.(payload.conversation);
        }

        if (payload.type === "delta") {
          callbacks.onDelta?.(payload.delta);
        }

        if (payload.type === "done") {
          callbacks.onDone?.(payload.message, payload.conversation);
        }

        if (payload.type === "error") {
          callbacks.onError?.(payload.detail);
        }
      }

      buffer = blockResult.rest;
      blockResult = takeNextStreamBlock(buffer);
    }

    if (done) {
      break;
    }
  }
}

export const authApi = {
  login: (email: string, password: string) => api.post("/api/v1/auth/login", { email, password }),

  signup: (email: string, password: string) => api.post("/api/v1/auth/signup", { email, password }),

  logout: () => api.post("/api/v1/auth/logout", {}),

  getCurrentUser: () =>
    api.get('/api/v1/auth/me'),

  updateProfile: (profile: UserUpdate) =>
    api.put('/api/v1/auth/me', profile),

  uploadAvatar: (avatar: File) => {
    const formData = new FormData();
    formData.append('avatar', avatar);
    return api.postForm('/api/v1/auth/me/avatar', formData);
  },
};

export const lessonApi = {
  getAll: (search?: string, filter?: string) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (filter) params.append("filter", filter);
    return api.get(`/api/v1/lessons?${params}`);
  },

  getById: (id: string) => api.get(`/api/v1/lessons/${id}`),
};

export const translationApi = {
  textToSign: (text: string) => api.post("/api/v1/translation/text-to-sign", { text }),

  signToText: (keypoints: unknown) =>
    api.post('/api/v1/translation/sign-to-text', { keypoints }),
};

export const flashcardApi = {
  getRandomCards: (limit: number = 10) => api.get<Flashcard[]>(`/api/v1/flashcards?limit=${limit}`),

  getScore: () => api.get<UserScore>("/api/v1/flashcards/score"),

  recordScore: (score: number, total: number) => api.post<UserScore>("/api/v1/flashcards/score", { score, total }),
};

export const chatApi = {
  sendMessage: (message: string, history: ChatHistoryMessage[] = [], conversationId: string | null = null) => api.post("/api/v1/chat", { message, history, conversation_id: conversationId }),

  streamMessage: (message: string, history: ChatHistoryMessage[] = [], conversationId: string | null = null, attachments: File[] = [], callbacks: ChatStreamCallbacks) => streamChatMessage(message, history, conversationId, attachments, callbacks),

  listConversations: () => api.get("/api/v1/chat/conversations"),

  getConversation: (conversationId: string) => api.get(`/api/v1/chat/conversations/${conversationId}`),

  deleteConversation: (conversationId: string) => api.delete(`/api/v1/chat/conversations/${conversationId}`),

  explainSign: (sign: string) => api.post("/api/v1/chat/explain-sign", { sign }),
};
