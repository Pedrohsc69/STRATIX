export type UserRole = 'Diretor' | 'Gestor' | 'Colaborador';

export type SessionState = {
  authenticated: boolean;
  role: UserRole;
};

export const initialSessionState: SessionState = {
  authenticated: true,
  role: 'Diretor',
};
