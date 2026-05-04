import api from './client';

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/v1/auth/login', { email, password }),

  signup: (email: string, password: string) =>
    api.post('/api/v1/auth/signup', { email, password }),

  logout: () =>
    api.post('/api/v1/auth/logout', {}),

  getCurrentUser: () =>
    api.get('/api/v1/auth/me'),
};

export const lessonApi = {
  getAll: (search?: string, filter?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filter) params.append('filter', filter);
    return api.get(`/api/v1/lessons?${params}`);
  },

  getById: (id: string) =>
    api.get(`/api/v1/lessons/${id}`),
};

export const translationApi = {
  textToSign: (text: string) =>
    api.post('/api/v1/translation/text-to-sign', { text }),

  signToText: (keypoints: any) =>
    api.post('/api/v1/translation/sign-to-text', { keypoints }),
};

export const flashcardApi = {
  getRandomCards: (limit: number = 10) =>
    api.get(`/api/v1/flashcards?limit=${limit}`),

  getScore: () =>
    api.get('/api/v1/flashcards/score'),

  recordScore: (score: number, total: number) =>
    api.post('/api/v1/flashcards/score', { score, total }),
};

export const chatApi = {
  sendMessage: (message: string) =>
    api.post('/api/v1/chat', { message }),

  explainSign: (sign: string) =>
    api.post('/api/v1/chat/explain-sign', { sign }),
};
