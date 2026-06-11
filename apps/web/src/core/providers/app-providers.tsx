import { PropsWithChildren } from 'react';
import { ThemeProvider } from '../theme/theme-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
