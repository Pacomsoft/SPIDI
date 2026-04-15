import { type ISubmitRegistrationUseCase } from '../../domain/contracts/submit-registration.use-case.interface';
import { type IVerificationStateRepository } from '../../domain/contracts/verification-state-repository.interface';
import { type IOtpService } from '../../domain/contracts/otp-service.interface';
import { type IConfiguracionRepository } from '@/modules/shared/domain/contracts/configuracion-repository.interface';

const REGISTRATION_SESSION_KEY = 'spidi_step1';
const CACHE_KEY = 'spidi_registro_cache';

export class SubmitRegistrationUseCase implements ISubmitRegistrationUseCase {
  constructor(
    private readonly stateRepository: IVerificationStateRepository,
    private readonly otpService: IOtpService,
    private readonly configuracionRepository: IConfiguracionRepository,
  ) {}

  async execute(): Promise<void> {
    const sessionRaw = typeof window !== 'undefined'
      ? sessionStorage.getItem(REGISTRATION_SESSION_KEY)
      : null;
    const session = sessionRaw ? JSON.parse(sessionRaw) : {};

    await this.otpService.submit(
      session.telefono ?? '',
      session.email ?? '',
      session.nombre ?? '',
    );

    this.stateRepository.clear();
    await this.configuracionRepository.remove(CACHE_KEY);
  }
}
