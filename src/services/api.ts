import type {
  ApiKeyItem,
  CredentialSchema,
  CredentialType,
  IssuedCredentialRecord,
  PresentationRecord,
  ProofRequest,
  TrustedIssuer,
  User,
  UserRole,
  VerificationResult,
  WebhookConfig,
} from '../types/index.ts';

const TOKEN_KEY = 'zeropass_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // fallback
  }
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async getCurrentUser(): Promise<{ user: User | null; authenticated: boolean }> {
    return fetchJson('/api/auth/me');
  },

  async login(payload: { email: string; password?: string; role?: UserRole }): Promise<{ token: string; user: User }> {
    const res = await fetchJson<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'password123', ...payload }),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(payload: {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    organization?: string;
  }): Promise<{ token: string; user: User }> {
    const res = await fetchJson<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ password: 'password123', ...payload }),
    });
    setStoredToken(res.token);
    return res;
  },

  async switchRole(role: UserRole): Promise<{ token: string; user: User }> {
    const res = await fetchJson<{ token: string; user: User }>('/api/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    setStoredToken(res.token);
    return res;
  },

  async logout(): Promise<void> {
    await fetchJson('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setStoredToken(null);
  },

  // Issuers
  async getIssuers(): Promise<{ issuers: TrustedIssuer[] }> {
    return fetchJson('/api/issuers');
  },

  async getIssuer(id: string): Promise<{ issuer: TrustedIssuer }> {
    return fetchJson(`/api/issuers/${id}`);
  },

  async getIssuerStats(id: string): Promise<{ stats: any }> {
    return fetchJson(`/api/issuers/${id}/stats`);
  },

  async getSchemas(): Promise<{ schemas: CredentialSchema[] }> {
    return fetchJson('/api/issuers/schemas');
  },

  async createSchema(schema: Partial<CredentialSchema>): Promise<{ schema: CredentialSchema }> {
    return fetchJson('/api/issuers/schemas', {
      method: 'POST',
      body: JSON.stringify(schema),
    });
  },

  // Credentials
  async getCredentials(params?: { holderDid?: string; issuerDid?: string }): Promise<{ credentials: IssuedCredentialRecord[] }> {
    const query = new URLSearchParams(params as any).toString();
    return fetchJson(`/api/credentials${query ? `?${query}` : ''}`);
  },

  async getCredential(id: string): Promise<{ credential: IssuedCredentialRecord }> {
    return fetchJson(`/api/credentials/${id}`);
  },

  async issueCredential(data: {
    schemaType: CredentialType;
    holderDid: string;
    holderEmail?: string;
    claims: Record<string, unknown>;
    expirationDays?: number;
  }): Promise<{ success: boolean; credential: IssuedCredentialRecord }> {
    return fetchJson('/api/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async revokeCredential(id: string, reason?: string): Promise<{ success: boolean; credential: IssuedCredentialRecord }> {
    return fetchJson(`/api/credentials/${id}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async verifyRawJwt(jwt: string): Promise<any> {
    return fetchJson('/api/credentials/verify-raw', {
      method: 'POST',
      body: JSON.stringify({ jwt }),
    });
  },

  // Verifier & Proof Requests
  async createProofRequest(data: {
    purpose: string;
    policy: {
      credentialType: CredentialType;
      allowedIssuers: string[];
      requiredAttributes: string[];
      predicates: { attribute: string; operator: any; value: any }[];
    };
  }): Promise<{ request: ProofRequest }> {
    return fetchJson('/api/verification-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getProofRequests(): Promise<{ requests: ProofRequest[] }> {
    return fetchJson('/api/verification-requests');
  },

  async getProofRequest(id: string): Promise<{ request: ProofRequest }> {
    return fetchJson(`/api/verification-requests/${id}`);
  },

  async submitVerification(data: {
    requestId: string;
    credentialId: string;
    disclosedAttributes?: string[];
  }): Promise<{ success: boolean; result: VerificationResult }> {
    return fetchJson('/api/verifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getVerificationResult(id: string): Promise<{ result: VerificationResult }> {
    return fetchJson(`/api/verifications/${id}`);
  },

  async getPresentationHistory(): Promise<{ presentations: PresentationRecord[] }> {
    return fetchJson('/api/presentations/history');
  },

  // Developer
  async getApiKeys(): Promise<{ keys: ApiKeyItem[] }> {
    return fetchJson('/api/developer/keys');
  },

  async createApiKey(name: string, environment: 'development' | 'production'): Promise<{ key: ApiKeyItem; warning: string }> {
    return fetchJson('/api/developer/keys', {
      method: 'POST',
      body: JSON.stringify({ name, environment }),
    });
  },

  async revokeApiKey(id: string): Promise<{ success: boolean }> {
    return fetchJson(`/api/developer/keys/${id}`, { method: 'DELETE' });
  },

  async getWebhooks(): Promise<{ webhooks: WebhookConfig[] }> {
    return fetchJson('/api/developer/webhooks');
  },

  async createWebhook(url: string, events: string[]): Promise<{ webhook: WebhookConfig }> {
    return fetchJson('/api/developer/webhooks', {
      method: 'POST',
      body: JSON.stringify({ url, events }),
    });
  },

  async getAuditLogs(): Promise<{ logs: any[] }> {
    return fetchJson('/api/developer/logs');
  },

  // DigiLocker
  async getDigiLockerStatus(): Promise<any> {
    return fetchJson('/api/digilocker/status');
  },

  async validateDigiLockerSchema(docType: string, orgId: string): Promise<any> {
    return fetchJson('/api/digilocker/validate-schema', {
      method: 'POST',
      body: JSON.stringify({ docType, orgId }),
    });
  },

  // Health
  async getHealth(): Promise<any> {
    return fetchJson('/api/health');
  },
};
