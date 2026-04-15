export interface IOtpService {
  verify(code: string, phase: string): Promise<boolean>;
  resend(phone: string, email: string, phase: string): Promise<void>;
  submit(telefono: string, email: string, nombre: string): Promise<void>;
}
