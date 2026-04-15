'use client';

import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from '../config/msal.config';

interface IMsalProviderAdapterProps {
  children: React.ReactNode;
}

export function MsalProviderAdapter({ children }: IMsalProviderAdapterProps) {
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
