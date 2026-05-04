// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    SIGNUP: '/api/v1/auth/signup',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
  },
  LESSONS: {
    LIST: '/api/v1/lessons',
    DETAIL: (id: string) => `/api/v1/lessons/${id}`,
  },
  TRANSLATION: {
    TEXT_TO_SIGN: '/api/v1/translation/text-to-sign',
    SIGN_TO_TEXT: '/api/v1/translation/sign-to-text',
  },
  FLASHCARDS: {
    LIST: '/api/v1/flashcards',
    SCORE: '/api/v1/flashcards/score',
  },
  CHAT: {
    SEND: '/api/v1/chat',
    EXPLAIN_SIGN: '/api/v1/chat/explain-sign',
  },
};

// Auth keys
export const AUTH_STORAGE_KEY = 'access_token';
export const USER_STORAGE_KEY = 'user';

// Sign Detection settings
export const SIGN_DETECTION_CONFIG = {
  CONFIDENCE_THRESHOLD: 0.7,
  FRAME_RATE: 30,
  MAX_HISTORY: 10,
};

// Canvas rendering config
export const CANVAS_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,
  FPS: 30,
  GESTURE_DURATION: 2000, // ms
};

// UI Messages
export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Đăng nhập thành công',
    SIGNUP: 'Đăng ký thành công',
    LOGOUT: 'Đăng xuất thành công',
  },
  ERROR: {
    NETWORK: 'Lỗi kết nối. Vui lòng thử lại',
    AUTH_FAILED: 'Email hoặc mật khẩu không đúng',
    UNAUTHORIZED: 'Bạn cần đăng nhập',
    SERVER_ERROR: 'Lỗi máy chủ. Vui lòng thử lại',
  },
};
