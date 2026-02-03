'use client';

import { RecoilRoot } from 'recoil';
import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/auth-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <RecoilRoot>
      <AuthProvider>
        {children}
      </AuthProvider>
    </RecoilRoot>
  );
}