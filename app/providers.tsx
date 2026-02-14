'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="notesio-theme">
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}