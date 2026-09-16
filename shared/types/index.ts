// Shared TypeScript types for GhostVault

export interface User {
  id: string;
  email: string;
  name: string;
  lastCheckinAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultItem {
  id: string;
  userId: string;
  title: string;
  type: 'note' | 'password' | 'document';
  encryptedData: string;
  iv: string;
  releaseTier: number;
  createdAt: string;
  updatedAt: string;
  contacts?: TrustedContact[];
}

export interface TrustedContact {
  id: string;
  userId: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckIn {
  id: string;
  userId: string;
  timestamp: string;
  method: 'manual' | 'email_link';
}

export interface Release {
  id: string;
  userId: string;
  vaultItemId: string;
  contactId: string;
  triggeredAt: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  details?: any;
}
