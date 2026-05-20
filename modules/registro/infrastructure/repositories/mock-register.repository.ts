/**
 * MockRegisterRepository
 *
 * Implementación 100% en memoria del contrato IRegisterRepository.
 * Activo en el despliegue Vercel (demo). No realiza ninguna llamada HTTP.
 *
 * Comportamiento:
 *  - getStates()                    → 32 estados + ciudades principales de México
 *  - requestVerificationCodeSMS()   → simula envío exitoso (latencia 600ms)
 *  - validateVerificationCodeSMS()  → acepta cualquier código excepto los incorrectos;
 *                                     el código válido demo es "123456"
 *  - requestVerificationCodeEmail() → simula envío exitoso
 *  - validateVerificationCodeEmail()→ acepta "123456"
 *  - checkDuplicate()               → siempre retorna { isDuplicate: false }
 *  - guardarDriver()                → simula registro exitoso con ID generado
 */

import type { IRegisterRepository } from '../../domain/contracts/register-repository.interface';
import type { IStateDTO } from '../../domain/contracts/state.dto';
import type { IVerificationResult } from '../../domain/contracts/verification-result.dto';
import type { ICheckDuplicateResult } from '../../domain/contracts/check-duplicate-result.dto';
import type { IRegistroDTO } from '../../domain/contracts/registro.dto';
import type { IRegisterApplicantDto } from '../../domain/contracts/register-applicant.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

// ─────────────────────────────────────────────────────────────────────────────
//  Estados y ciudades de México (datos ficticios seguros para demo)
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_STATES: IStateDTO[] = [
  { id: 1,  state: 'Aguascalientes',      cities: [{ id: 101, city: 'Aguascalientes' }, { id: 102, city: 'Calvillo' }] },
  { id: 2,  state: 'Baja California',     cities: [{ id: 201, city: 'Mexicali' }, { id: 202, city: 'Tijuana' }, { id: 203, city: 'Ensenada' }] },
  { id: 3,  state: 'Baja California Sur', cities: [{ id: 301, city: 'La Paz' }, { id: 302, city: 'Los Cabos' }] },
  { id: 4,  state: 'Campeche',            cities: [{ id: 401, city: 'Campeche' }, { id: 402, city: 'Ciudad del Carmen' }] },
  { id: 5,  state: 'Chiapas',             cities: [{ id: 501, city: 'Tuxtla Gutiérrez' }, { id: 502, city: 'San Cristóbal de las Casas' }] },
  { id: 6,  state: 'Chihuahua',           cities: [{ id: 601, city: 'Chihuahua' }, { id: 602, city: 'Ciudad Juárez' }] },
  { id: 7,  state: 'Ciudad de México',    cities: [{ id: 701, city: 'Álvaro Obregón' }, { id: 702, city: 'Coyoacán' }, { id: 703, city: 'Cuauhtémoc' }, { id: 704, city: 'Iztapalapa' }] },
  { id: 8,  state: 'Coahuila',            cities: [{ id: 801, city: 'Saltillo' }, { id: 802, city: 'Torreón' }, { id: 803, city: 'Monclova' }] },
  { id: 9,  state: 'Colima',              cities: [{ id: 901, city: 'Colima' }, { id: 902, city: 'Manzanillo' }] },
  { id: 10, state: 'Durango',             cities: [{ id: 1001, city: 'Durango' }, { id: 1002, city: 'Gómez Palacio' }] },
  { id: 11, state: 'Estado de México',    cities: [{ id: 1101, city: 'Toluca' }, { id: 1102, city: 'Naucalpan' }, { id: 1103, city: 'Ecatepec' }, { id: 1104, city: 'Nezahualcóyotl' }] },
  { id: 12, state: 'Guanajuato',          cities: [{ id: 1201, city: 'León' }, { id: 1202, city: 'Guanajuato' }, { id: 1203, city: 'Irapuato' }] },
  { id: 13, state: 'Guerrero',            cities: [{ id: 1301, city: 'Acapulco' }, { id: 1302, city: 'Chilpancingo' }] },
  { id: 14, state: 'Hidalgo',             cities: [{ id: 1401, city: 'Pachuca' }, { id: 1402, city: 'Tulancingo' }] },
  { id: 15, state: 'Jalisco',             cities: [{ id: 1501, city: 'Guadalajara' }, { id: 1502, city: 'Zapopan' }, { id: 1503, city: 'Puerto Vallarta' }] },
  { id: 16, state: 'Michoacán',           cities: [{ id: 1601, city: 'Morelia' }, { id: 1602, city: 'Uruapan' }, { id: 1603, city: 'Zamora' }] },
  { id: 17, state: 'Morelos',             cities: [{ id: 1701, city: 'Cuernavaca' }, { id: 1702, city: 'Jiutepec' }] },
  { id: 18, state: 'Nayarit',             cities: [{ id: 1801, city: 'Tepic' }, { id: 1802, city: 'Bahía de Banderas' }] },
  { id: 19, state: 'Nuevo León',          cities: [{ id: 1901, city: 'Monterrey' }, { id: 1902, city: 'San Nicolás de los Garza' }, { id: 1903, city: 'Guadalupe' }] },
  { id: 20, state: 'Oaxaca',              cities: [{ id: 2001, city: 'Oaxaca de Juárez' }, { id: 2002, city: 'Salina Cruz' }] },
  { id: 21, state: 'Puebla',              cities: [{ id: 2101, city: 'Puebla' }, { id: 2102, city: 'Tehuacán' }, { id: 2103, city: 'San Andrés Cholula' }] },
  { id: 22, state: 'Querétaro',           cities: [{ id: 2201, city: 'Querétaro' }, { id: 2202, city: 'San Juan del Río' }] },
  { id: 23, state: 'Quintana Roo',        cities: [{ id: 2301, city: 'Cancún' }, { id: 2302, city: 'Playa del Carmen' }, { id: 2303, city: 'Chetumal' }] },
  { id: 24, state: 'San Luis Potosí',     cities: [{ id: 2401, city: 'San Luis Potosí' }, { id: 2402, city: 'Ciudad Valles' }] },
  { id: 25, state: 'Sinaloa',             cities: [{ id: 2501, city: 'Culiacán' }, { id: 2502, city: 'Mazatlán' }, { id: 2503, city: 'Los Mochis' }] },
  { id: 26, state: 'Sonora',              cities: [{ id: 2601, city: 'Hermosillo' }, { id: 2602, city: 'Ciudad Obregón' }, { id: 2603, city: 'Nogales' }] },
  { id: 27, state: 'Tabasco',             cities: [{ id: 2701, city: 'Villahermosa' }, { id: 2702, city: 'Cárdenas' }] },
  { id: 28, state: 'Tamaulipas',          cities: [{ id: 2801, city: 'Tampico' }, { id: 2802, city: 'Reynosa' }, { id: 2803, city: 'Matamoros' }] },
  { id: 29, state: 'Tlaxcala',            cities: [{ id: 2901, city: 'Tlaxcala' }, { id: 2902, city: 'Apizaco' }] },
  { id: 30, state: 'Veracruz',            cities: [{ id: 3001, city: 'Veracruz' }, { id: 3002, city: 'Xalapa' }, { id: 3003, city: 'Coatzacoalcos' }] },
  { id: 31, state: 'Yucatán',             cities: [{ id: 3101, city: 'Mérida' }, { id: 3102, city: 'Valladolid' }] },
  { id: 32, state: 'Zacatecas',           cities: [{ id: 3201, city: 'Zacatecas' }, { id: 3202, city: 'Fresnillo' }] },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Código OTP válido para la demo
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_VALID_OTP = '123456';

export class MockRegisterRepository implements IRegisterRepository {
  // ── Estados ───────────────────────────────────────────────────────────────
  async getStates(): Promise<IStateDTO[]> {
    await this._delay(400);
    return MOCK_STATES;
  }

  // ── SMS ───────────────────────────────────────────────────────────────────
  async requestVerificationCodeSMS(
    _formId: string,
    _phoneNumber: string,
  ): Promise<IResultApi<IVerificationResult>> {
    await this._delay(600);
    // status 200 indica envío exitoso según el contrato del backend
    return { success: true, data: { status: 200 } };
  }

  async validateVerificationCodeSMS(
    _formId: string,
    _phoneNumber: string,
    code: string,
  ): Promise<IResultApi<IVerificationResult>> {
    await this._delay(500);
    if (code === MOCK_VALID_OTP) {
      return { success: true, data: { status: 200 } };
    }
    return {
      success: false,
      error: { statusCode: 400, message: 'Código incorrecto. Usa 123456 en la demo.' },
    };
  }

  // ── Email ─────────────────────────────────────────────────────────────────
  async requestVerificationCodeEmail(
    _formId: string,
    _email: string,
  ): Promise<IResultApi<IVerificationResult>> {
    await this._delay(600);
    return { success: true, data: { status: 200 } };
  }

  async validateVerificationCodeEmail(
    _formId: string,
    _email: string,
    code: string,
  ): Promise<IResultApi<IVerificationResult>> {
    await this._delay(500);
    if (code === MOCK_VALID_OTP) {
      return { success: true, data: { status: 200 } };
    }
    return {
      success: false,
      error: { statusCode: 400, message: 'Código incorrecto. Usa 123456 en la demo.' },
    };
  }

  // ── Verificación de duplicado ─────────────────────────────────────────────
  async checkDuplicate(
    _phoneNumber: string,
    _email: string,
  ): Promise<IResultApi<ICheckDuplicateResult>> {
    await this._delay(400);
    // En la demo nunca hay duplicados — el registro siempre avanza
    return {
      success: true,
      data: { duplicatedFields: [], message: 'Sin duplicados (demo)' },
    };
  }

  // ── Registro final del conductor ──────────────────────────────────────────
  async guardarDriver(
    _driver: IRegistroDTO,
  ): Promise<IResultApi<IRegisterApplicantDto>> {
    await this._delay(800);
    return {
      success: true,
      data: {
        applicantId: Math.floor(Math.random() * 90000) + 10000,
        message: 'Registro completado exitosamente (demo)',
      },
    };
  }

  // ── Latencia simulada ─────────────────────────────────────────────────────
  private _delay(ms = 300): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
