import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IRegistrationSessionRepository } from '../../domain/contracts/registration-session-repository.interface';
import { type IConfirmationDataDTO } from '../../domain/contracts/confirmation.dto';
import { SolicitudNumber } from '../../domain/value-objects/solicitud-number';
import { RegistrationSessionNotFoundError } from '../../domain/errors/registration-session-not-found.error';

export class GetRegistrationConfirmationUseCase
  implements IUseCase<void, IConfirmationDataDTO>
{
  constructor(
    private readonly sessionRepository: IRegistrationSessionRepository,
  ) {}

  async execute(): Promise<IConfirmationDataDTO> {
    const session = this.sessionRepository.getSession();
    if (!session) {
      throw new RegistrationSessionNotFoundError();
    }

    const seed = Math.floor(Math.random() * 9000) + 1000;
    const solicitudNumber = SolicitudNumber.generate(seed);

    this.sessionRepository.clearSession();

    return {
      solicitudNumber: solicitudNumber.value,
      userName: session.nombre,
    };
  }
}
