'use client';

import { type IValidateTokenUseCase } from '../../../domain/contracts/validate-token-use-case.interface';
import { useValidateToken } from '../../hooks/use-validate-token.hook';
import { ValidateTokenLoader } from '../components/validate-token-loader';

interface IValidateTokenViewProps {
  validateTokenUseCase: IValidateTokenUseCase;
}

export function ValidateTokenView({ validateTokenUseCase }: IValidateTokenViewProps) {
  const { isProcessing } = useValidateToken(validateTokenUseCase);
  return <ValidateTokenLoader isProcessing={isProcessing} />;
}
