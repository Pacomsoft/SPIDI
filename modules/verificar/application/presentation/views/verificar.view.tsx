'use client';

import Link from 'next/link';
import { SpidiLogo } from '@/modules/shared/application/presentation/components/spidi-logo';
import { type IVerifyOtpUseCase } from '../../../domain/contracts/verify-otp.use-case.interface';
import { type IResendOtpUseCase } from '../../../domain/contracts/resend-otp.use-case.interface';
import { type ISubmitRegistrationUseCase } from '../../../domain/contracts/submit-registration.use-case.interface';
import { useVerificar } from '../../hooks/use-verificar.hook';
import { OtpInput } from '../components/otp-input';
import { VerifySteps } from '../components/verify-steps';
import { VerifySuccess } from '../components/verify-success';
import styles from './verificar.view.module.scss';

interface IVerificarViewProps {
  verifyOtpUseCase: IVerifyOtpUseCase;
  resendOtpUseCase: IResendOtpUseCase;
  submitRegistrationUseCase: ISubmitRegistrationUseCase;
}

export function VerificarView({
  verifyOtpUseCase,
  resendOtpUseCase,
  submitRegistrationUseCase,
}: IVerificarViewProps) {
  const {
    phase, otp, inputRefs, isVerifying, isSubmitting, isBlocked,
    showSuccess, showError, showToast, errorMessage,
    countdown, canResend, isDuplicateContact, userData,
    handleOtpChange, handleKeyDown, handlePaste,
    handleVerify, handleResend, handleSubmit,
    maskEmail, maskPhone, formatTime,
  } = useVerificar(verifyOtpUseCase, resendOtpUseCase, submitRegistrationUseCase);

  if (isDuplicateContact) {
    return (
      <div className="reg-page">
        <nav className="navbar">
          <div className="navbar__inner">
            <Link href="/" className="navbar__logo" aria-label="SPIDI inicio">
              <SpidiLogo />
            </Link>
          </div>
        </nav>
        <div className="reg-container" style={{ paddingTop: '80px' }}>
          <div className="reg-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ fontSize: '64px', color: '#ff9800', marginBottom: '16px' }}>
              <span className="icon">warning</span>
            </div>
            <h2 style={{ marginBottom: '16px' }}>Datos ya registrados</h2>
            <p style={{ marginBottom: '24px', color: '#666' }}>
              Los datos de contacto han sido registrados previamente. Te sugerimos contactar al
              equipo de soporte.
            </p>
            <Link href="/" className="btn btn--primary">Volver al inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  const phaseConfig =
    phase === 'phone'
      ? { icon: 'phone_android', title: 'Verifica tu teléfono', target: maskPhone(userData.telefono), successText: 'Teléfono verificado' }
      : phase === 'email'
        ? { icon: 'mail', title: 'Verifica tu correo electrónico', target: maskEmail(userData.email), successText: 'Correo verificado' }
        : null;

  return (
    <div className="reg-page">
      <nav className="navbar">
        <div className="navbar__inner">
          <Link href="/" className="navbar__logo" aria-label="SPIDI inicio">
            <SpidiLogo />
          </Link>
        </div>
      </nav>

      <header className="reg-header">
        <h1 className="reg-header__title">Verifica tu identidad</h1>
        <p className="reg-header__subtitle">
          {phase === 'completed'
            ? 'Verificación completada'
            : 'Ingresa los códigos que enviamos a tu teléfono y correo'}
        </p>
      </header>

      <div className="reg-container">
        <div className="reg-card">
          {phase !== 'completed' && (
            <>
              <VerifySteps
                phase={phase}
                phoneVerified={phase === 'email'}
                emailVerified={false}
              />

              {phaseConfig && !showSuccess && (
                <>
                  <div className={styles.verifyIcon}>
                    <span className="icon" style={{ fontSize: '32px' }}>{phaseConfig.icon}</span>
                  </div>
                  <h2 className={styles.verifyTitle}>{phaseConfig.title}</h2>
                  <p className={styles.verifyDesc}>
                    Enviamos un código de 6 dígitos a <strong>{phaseConfig.target}</strong>
                  </p>

                  <OtpInput
                    otp={otp}
                    inputRefs={inputRefs}
                    hasError={showError}
                    isDisabled={isBlocked}
                    onChange={handleOtpChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                  />

                  <div className={`${styles.errorMsg} ${showError ? styles.visible : ''}`}>
                    {showError && <><span className="icon" style={{ fontSize: '16px' }}>error</span>{errorMessage}</>}
                  </div>

                  <button
                    type="button"
                    className="btn btn--primary btn--lg btn--full"
                    onClick={() => handleVerify()}
                    disabled={isVerifying || isBlocked}
                  >
                    {isVerifying ? (
                      <><div className={styles.spinner}></div>Verificando...</>
                    ) : 'Verificar código'}
                  </button>

                  <p className={styles.resend}>
                    {countdown > 0 ? (
                      <>Código expira en: <strong>{formatTime(countdown)}</strong></>
                    ) : (
                      <>
                        ¿No recibiste el código?{' '}
                        <button type="button" onClick={handleResend} disabled={!canResend}>
                          {canResend ? 'Reenviar código' : 'Límite alcanzado'}
                        </button>
                      </>
                    )}
                  </p>
                </>
              )}

              {showSuccess && phaseConfig && (
                <VerifySuccess text={phaseConfig.successText} />
              )}
            </>
          )}

          {phase === 'completed' && (
            <div className={styles.submitSection}>
              <div className={styles.submitIcon}>
                <span className="icon" style={{ fontSize: '40px' }}>check_circle</span>
              </div>
              <h2 style={{ marginBottom: '8px', color: 'var(--color-text)' }}>
                ¡Verificación completada!
              </h2>
              <p style={{ marginBottom: '32px', color: '#666' }}>
                Teléfono y correo verificados correctamente
              </p>
              <button
                type="button"
                className="btn btn--primary btn--lg"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><div className={styles.spinner}></div>Enviando...</>
                ) : (
                  <>Enviar <span className="icon" style={{ fontSize: '20px' }}>send</span></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`${styles.toast} ${showToast ? styles.visible : ''}`}>
        Código reenviado
      </div>

      <footer className="reg-footer">
        <span>&copy; {new Date().getFullYear()} SPIDI Inc.</span>
        <a href="#">Términos</a>
        <a href="#">Privacidad</a>
      </footer>
    </div>
  );
}
