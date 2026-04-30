import { Suspense } from 'react';
import { SpidiTokenClient } from './spidi-token-client';

export default function SpidiTokenPage() {
  return (
    <Suspense>
      <SpidiTokenClient />
    </Suspense>
  );
}
