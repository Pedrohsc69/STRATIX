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

export type SessionCompany = {
  id: string;
  name: string;
  businessArea: string;
  logoUrl?: string | null;
};

export type SessionState = {
  accessToken: string;
  user: SessionUser;
  company: SessionCompany | null;
};

const SESSION_STORAGE_KEY = 'stratix.session';
const SESSION_CHANGE_EVENT = 'stratix:session-change';

function emitSessionChange() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function getSession(): SessionState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<SessionState> & { user?: SessionUser };

    if (!parsed.accessToken || !parsed.user) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      user: parsed.user,
      company: parsed.company ?? null,
    };
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
  emitSessionChange();
}

export function clearSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  emitSessionChange();
}

export function getAccessToken() {
  return getSession()?.accessToken ?? null;
}

export function isAuthenticated() {
  return !!getAccessToken();
}

export function subscribeToSessionChanges(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  window.addEventListener(SESSION_CHANGE_EVENT, listener);
  window.addEventListener('storage', listener);

  return () => {
    window.removeEventListener(SESSION_CHANGE_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}
