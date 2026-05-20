'use client';

import { useExchangeCode } from '../../hooks/use-exchange-code.hook';
import { type IAuthService } from '../../../domain/contracts/auth-service.interface';
import { ValidateTokenLoader } from '../components/validate-token-loader';

interface IValidateTokenViewProps {
  authService: IAuthService;
}

export function ValidateTokenView({ authService }: IValidateTokenViewProps) {
  const { isProcessing } = useExchangeCode(authService);
  return <ValidateTokenLoader isProcessing={isProcessing} />;
}
