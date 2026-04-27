import { type IAdmSessionPort } from '../../domain/contracts/adm-session-port.interface';
import { type ISessionInfoDTO } from '../../domain/contracts/adm.dto';
import { type ISessionRepository } from '@/modules/login/domain/contracts/session-repository.interface';

export class AdmSessionAdapter implements IAdmSessionPort {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async getSessionInfo(): Promise<ISessionInfoDTO | null> {
    const session = await this.sessionRepository.findCurrent();
    if (!session) return null;
    return {
      userId: session.userId,
      userName: session.userName,
      userRole: session.userRole,
      role: session.role,
      menus: session.menus,
      expiresAt: session.expiresAt,
    };
  }

  async clearSession(): Promise<void> {
    await this.sessionRepository.clear();
  }
}
