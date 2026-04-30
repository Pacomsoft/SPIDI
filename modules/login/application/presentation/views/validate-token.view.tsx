'use client';

import { useExchangeCode } from '../../hooks/use-exchange-code.hook';
import { ValidateTokenLoader } from '../components/validate-token-loader';

export function ValidateTokenView() {
  const { isProcessing } = useExchangeCode();
  return <ValidateTokenLoader isProcessing={isProcessing} />;
}
