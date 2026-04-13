import { Navigate } from 'react-router-dom';

type AuthGuardProps = {
  isAuthenticated: boolean;
  children: JSX.Element;
};

export function AuthGuard({ isAuthenticated, children }: AuthGuardProps) {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
