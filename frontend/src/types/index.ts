// User types
export interface User {
  id: string;
  full_name?: string | null;
  email: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

export interface UserUpdate {
  full_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Lesson types
export interface Lesson {
  id: string;
  title: string;
  content: string;
  video_url: string;
  created_at: string;
}

// Flashcard types
export interface Flashcard {
  id: string;
  word: string;
  sign_data: any; // Will be JSON from API
}

export interface UserScore {
  user_id: string;
  total_score: number;
  attempts: number;
}

// Translation types
export interface SignGesture {
  id: string;
  name: string;
  keypoints: number[][];
  animation: any;
}

export interface TranslationResponse {
  original: string;
  gestures: SignGesture[];
}

// Chat types
export type ChatAttachmentKind = "image" | "video" | "text" | "file";

export interface ChatAttachment {
  id: string;
  name: string;
  kind: ChatAttachmentKind;
  media_type: string;
  size_bytes: number;
  url: string | null;
  text_excerpt?: string | null;
}

export interface ComposerAttachment {
  id: string;
  file: File;
  kind: ChatAttachmentKind;
  preview_url: string | null;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: string;
  attachments: ChatAttachment[];
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
  history: ChatHistoryMessage[];
}

export interface ChatMessageResponse {
  id: string;
  conversation_id: string;
  content: string;
  sender: "ai";
  timestamp: string;
  attachments: ChatAttachment[];
}

export interface ChatConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_preview: string | null;
}

export interface ChatConversationDetail extends ChatConversationSummary {
  messages: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
  related_sign?: string;
}

// Common types
export interface ApiError {
  message: string;
  code: string;
  details?: any;
}
