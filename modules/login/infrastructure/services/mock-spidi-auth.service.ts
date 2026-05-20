import { type ITokenDto } from '@/modules/shared/domain/contracts/token.dto';
import {
  type ISpidiAuthService,
  type ISpidiAuthResultDTO,
  type IRoleDto,
} from '../../domain/contracts/spidi-auth-service.interface';

const DEFAULT_EXPIRATION_MS = 60 * 60 * 1000; // 1 hora

/**
 * @description Mock implementation of ISpidiAuthService for local development.
 * @implements {ISpidiAuthService}
 *
 * Returns a full role with ALL application modules so they appear in the sidebar.
 * This service is used when NEXT_PUBLIC_USE_MOCK_AUTH=true in .env.local
 *
 * TO REPLACE WITH REAL BACKEND:
 * The backend endpoint /api/v1/authorization/me must return an IRoleDto with
 * the menus array containing ALL module codes listed in MOCK_ROLE below.
 * Each menu entry maps to a sidebar item via `displayMenu: true` and `code`.
 *
 * MODULE CODES (backend must register these):
 *  - DRIVERS         → /adm/drivers
 *  - ASPIRANTES      → /adm/aspirantes
 *  - PAGOS           → /adm/pagos/pedidos
 *  - CAPACITACION    → /adm/capacitacion
 *  - COMUNICACION    → /adm/comunicacion
 *  - CONTRATOS       → /adm/contratos
 */
export class MockSpidiAuthService implements ISpidiAuthService {
  async authenticateWithEntraToken(_msAccessToken: string): Promise<ISpidiAuthResultDTO> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 400));

    const spidiToken: ITokenDto = {
      accessToken: 'mock-spidi-token-dev',
      uuid: 'mock-uuid-dev',
      refreshToken: 'mock-refresh-token-dev',
      expirationToken: new Date(Date.now() + DEFAULT_EXPIRATION_MS),
    };

    return {
      spidiToken,
      roles: [MOCK_ROLE],
    };
  }
}

const MOCK_ROLE: IRoleDto = {
  name: 'coordinator',
  label: 'Coordinador de Operaciones',
  description: 'Coordinador de Última Milla con acceso completo',
  menus: [
    {
      label: 'Drivers',
      code: 'DRIVERS',
      icon: 'local_shipping',
      path: '/adm/drivers',
      displayMenu: true,
      order: 1,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    {
      label: 'Aspirantes',
      code: 'ASPIRANTES',
      icon: 'person_add',
      path: '/adm/aspirantes',
      displayMenu: true,
      order: 2,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    {
      label: 'Pagos',
      code: 'PAGOS',
      icon: 'payments',
      path: '/adm/pagos/pedidos',
      displayMenu: false,
      order: 3,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    },
    {
      label: 'Capacitación',
      code: 'CAPACITACION',
      icon: 'school',
      path: '/adm/capacitacion',
      displayMenu: true,
      order: 4,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
    {
      label: 'Comunicación',
      code: 'COMUNICACION',
      icon: 'forum',
      path: '/adm/comunicacion',
      displayMenu: true,
      order: 5,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    },
    {
      label: 'Contratos',
      code: 'CONTRATOS',
      icon: 'description',
      path: '/adm/contratos',
      displayMenu: true,
      order: 6,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    // Home
    {
      label: 'Home',
      code: 'HOME',
      icon: 'home',
      path: '/adm/home',
      displayMenu: false,
      order: 0,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    // Quejas y Aclaraciones
    {
      label: 'Quejas y Aclaraciones',
      code: 'COMUNICACION_QUEJAS',
      icon: 'forum',
      path: '/adm/complaints',
      displayMenu: false,
      order: 7,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    // Hidden entries — needed for access control but not shown in sidebar
    {
      label: 'Documentos Vencidos',
      code: 'DRIVERS_EXPIRED_DOCS',
      icon: 'warning',
      path: '/adm/drivers/expired',
      displayMenu: false,
      order: 10,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    {
      label: 'Pedidos',
      code: 'PAGOS_PEDIDOS',
      icon: 'receipt_long',
      path: '/adm/pagos/pedidos',
      displayMenu: true,
      order: 11,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    {
      label: 'Bonos',
      code: 'PAGOS_BONOS',
      icon: 'card_giftcard',
      path: '/adm/pagos/bonos',
      displayMenu: true,
      order: 12,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    },
    {
      label: 'Ajustes',
      code: 'PAGOS_AJUSTES',
      icon: 'tune',
      path: '/adm/pagos/ajustes',
      displayMenu: true,
      order: 13,
      canView: true,
      canCreate: true,
      canEdit: false,
      canDelete: false,
    },
    {
      label: 'Resúmenes Diarios',
      code: 'PAGOS_RESUMENES_DIARIOS',
      icon: 'today',
      path: '/adm/pagos/resumenes-diarios',
      displayMenu: true,
      order: 14,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    {
      label: 'Resúmenes Semanales',
      code: 'PAGOS_RESUMENES_SEMANALES',
      icon: 'date_range',
      path: '/adm/pagos/resumenes-semanales',
      displayMenu: true,
      order: 15,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
  ],
};
