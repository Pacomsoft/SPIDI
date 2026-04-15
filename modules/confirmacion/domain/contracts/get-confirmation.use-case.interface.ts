import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IConfirmationDataDTO } from './confirmation.dto';

export interface IGetConfirmationUseCase extends IUseCase<void, IConfirmationDataDTO> {}
