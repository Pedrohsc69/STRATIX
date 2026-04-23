export type UserRole = 'DIRECTOR' | 'MANAGER' | 'EMPLOYEE';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'PENDING' | 'ACTIVE' | 'DISABLED';
  isActive: boolean;
  companyId: string | null;
  departmentId: string | null;
};

export type SessionState = {
  accessToken: string;
  user: SessionUser;
};

const SESSION_STORAGE_KEY = 'stratix.session';

export function getSession(): SessionState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as SessionState;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function saveSession(session: SessionState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getAccessToken() {
  return getSession()?.accessToken ?? null;
}

export function isAuthenticated() {
  return !!getAccessToken();
}
