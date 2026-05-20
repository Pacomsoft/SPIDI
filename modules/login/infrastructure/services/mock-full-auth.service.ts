import {
  type IAuthService,
  type ITokenResultDTO,
  type IMsSessionDTO,
} from '../../domain/contracts/auth-service.interface';

const MOCK_MS_ACCESS_TOKEN_KEY = 'mock_ms_access_token';
const MOCK_MS_USER_INFO_KEY = 'mock_ms_user_info';

/**
 * MockFullAuthService
 *
 * Implementación de IAuthService para el despliegue en Vercel (rama demo/mock).
 * Activo cuando NEXT_PUBLIC_USE_MOCK_AUTH=true.
 *
 * Comportamiento:
 *  - initiateRedirect(): NO redirige a Microsoft. Guarda una sesión mock en
 *    sessionStorage y navega directamente a /auth/spidi-token, simulando que
 *    el intercambio de código ya ocurrió.
 *  - getCallbackToken(): nunca se llama en este flujo (no hay code en la URL).
 *  - getMsSession(): devuelve la sesión mock guardada en sessionStorage.
 *
 * Credenciales mock:
 *  - userId:    'mock-admin-001'
 *  - userName:  'Administrador Demo'
 *  - userEmail: 'admin.demo@example.com'
 *
 * El token de acceso ficticio es procesado por MockSpidiAuthService, que devuelve
 * el rol 'coordinator' con todos los módulos habilitados.
 */
export class MockFullAuthService implements IAuthService {
  async initiateRedirect(): Promise<void> {
    // Simula latencia de red para que la UI muestre el estado de carga
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Limpiar IndexedDB antes de crear la sesión mock.
    // Esto garantiza que siempre se use el MOCK_ROLE más reciente,
    // evitando que una sesión vieja (con menus desactualizados) bloquee rutas.
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      await new Promise<void>((resolve) => {
        const req = window.indexedDB.deleteDatabase('spidi_db');
        req.onsuccess = () => resolve();
        req.onerror = () => resolve(); // no bloquear si falla
        req.onblocked = () => resolve();
      });
    }

    const mockTokenResult: ITokenResultDTO = {
      accessToken: 'mock-ms-access-token-demo',
      userId: 'mock-admin-001',
      userName: 'Administrador Demo',
      userEmail: 'admin.demo@example.com',
    };

    // Persistir sesión mock como lo haría el flujo real después del callback
    this.saveMsSession(mockTokenResult);

    // Navegar directo al paso de intercambio de token SPIDI (sin pasar por /validate-token)
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/spidi-token';
    }
  }

  async getCallbackToken(_code: string, _state: string): Promise<ITokenResultDTO> {
    // En el flujo mock este método no se invoca, pero debe implementarse por contrato.
    return {
      accessToken: 'mock-ms-access-token-demo',
      userId: 'mock-admin-001',
      userName: 'Administrador Demo',
      userEmail: 'admin.demo@example.com',
    };
  }

  saveMsSession(tokenResult: ITokenResultDTO): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(MOCK_MS_ACCESS_TOKEN_KEY, tokenResult.accessToken);
    sessionStorage.setItem(
      MOCK_MS_USER_INFO_KEY,
      JSON.stringify({
        userId: tokenResult.userId,
        userName: tokenResult.userName,
        userEmail: tokenResult.userEmail,
      }),
    );
  }

  getMsSession(): IMsSessionDTO | null {
    if (typeof window === 'undefined') return null;
    const msAccessToken = sessionStorage.getItem(MOCK_MS_ACCESS_TOKEN_KEY);
    if (!msAccessToken) return null;

    let userId = '';
    let userName = '';
    let userEmail = '';
    try {
      const userInfo = JSON.parse(sessionStorage.getItem(MOCK_MS_USER_INFO_KEY) ?? '{}');
      userId = userInfo.userId ?? '';
      userName = userInfo.userName ?? '';
      userEmail = userInfo.userEmail ?? '';
    } catch {
      // non-fatal
    }

    return { msAccessToken, userId, userName, userEmail };
  }

  clearMsSession(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(MOCK_MS_ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(MOCK_MS_USER_INFO_KEY);
  }
}
