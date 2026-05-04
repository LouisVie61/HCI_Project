// User types
export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
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
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
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
