import { type IAdmSessionPort } from '../../domain/contracts/adm-session-port.interface';
import { type ISessionInfoDTO } from '../../domain/contracts/adm.dto';
import { type ISessionRepository } from '@/modules/login/domain/contracts/session-repository.interface';
import { type IHttpClient } from '@/modules/shared/domain/contracts/http-client.interface';
import { API_ENDPOINTS } from '@/modules/shared/domain/contracts/api-endpoints.constants';

export class AdmSessionAdapter implements IAdmSessionPort {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly httpClient: IHttpClient,
  ) {}

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

  async logout(): Promise<void> {
    try {
      await this.httpClient.post(API_ENDPOINTS.LOGOUT_URL);
    } catch {
      // silencioso: si el backend falla, continuamos con el cierre de sesión local
    }
  }

  async clearSession(): Promise<void> {
    await this.sessionRepository.clear();
  }
}
