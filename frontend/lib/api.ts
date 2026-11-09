const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Generic API request helper with auth token
 */
async function request(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// Auth API
export const authApi = {
  signup: (data: { email: string; password: string; name: string; keyHint?: string }) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getMe: () => request('/auth/me'),
};

// Vault API
export const vaultApi = {
  list: () => request('/vault'),
  get: (id: string) => request(`/vault/${id}`),
  create: (data: {
    title: string;
    type: 'note' | 'password' | 'document';
    encryptedData: string;
    iv: string;
    releaseTier?: number;
    contactIds?: string[];
  }) => request('/vault', { method: 'POST', body: JSON.stringify(data) }),
  update: (
    id: string,
    data: {
      title?: string;
      type?: 'note' | 'password' | 'document';
      encryptedData?: string;
      iv?: string;
      releaseTier?: number;
      contactIds?: string[];
    }
  ) => request(`/vault/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/vault/${id}`, { method: 'DELETE' }),
};

// Contacts API
export const contactApi = {
  list: () => request('/contacts'),
  get: (id: string) => request(`/contacts/${id}`),
  create: (data: { name: string; email: string }) =>
    request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; email?: string }) =>
    request(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/contacts/${id}`, { method: 'DELETE' }),
};

// Check-in API
export const checkinApi = {
  checkin: () => request('/checkin', { method: 'POST' }),
  getStatus: () => request('/checkin/status'),
};

// Emergency Releases API
export const releaseApi = {
  get: (id: string) => request(`/releases/${id}`),
};

// AI API (Gemini runs server-side; the API key never reaches the browser)
export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export const aiApi = {
  status: () => request('/ai/status'),
  chat: (messages: ChatMessage[]) =>
    request('/ai/chat', { method: 'POST', body: JSON.stringify({ messages }) }),
  letter: (data: { draft: string; recipientName?: string; relationship?: string; tone: string }) =>
    request('/ai/letter', { method: 'POST', body: JSON.stringify(data) }),
  advisor: () => request('/ai/advisor'),
  passwordTips: (features: object) =>
    request('/ai/password-tips', { method: 'POST', body: JSON.stringify(features) }),
}
