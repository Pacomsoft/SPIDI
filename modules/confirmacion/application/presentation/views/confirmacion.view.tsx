'use client';

import Link from 'next/link';
import { SpidiLogo } from '@/modules/shared/application/presentation/components/spidi-logo';
import { type IGetConfirmationUseCase } from '../../../domain/contracts/get-confirmation.use-case.interface';
import { useConfirmacion } from '../../hooks/use-confirmacion.hook';
import { ConfirmationTimeline } from '../components/confirmation-timeline';
import { ConfirmationInfoCards } from '../components/confirmation-info-cards';
import styles from './confirmacion.view.module.scss';

interface IConfirmacionViewProps {
  getConfirmationUseCase: IGetConfirmationUseCase;
}

export function ConfirmacionView({ getConfirmationUseCase }: IConfirmacionViewProps) {
  const { data, isLoading } = useConfirmacion(getConfirmationUseCase);

  return (
    <div className="reg-page">
      <nav className="navbar">
        <div className="navbar__inner">
          <Link href="/" className="navbar__logo" aria-label="SPIDI inicio">
            <SpidiLogo />
          </Link>
        </div>
      </nav>

      <div className={styles.confirm}>
        <div className={styles.inner}>
          <div className={styles.icon}>
            <span className={`icon ${styles.iconText}`}>check_circle</span>
          </div>

          <h1 className={styles.title}>¡Tu solicitud fue enviada exitosamente!</h1>

          <p className={styles.solicitud}>
            Número de solicitud:{' '}
            <strong>{isLoading ? '...' : (data?.solicitudNumber ?? '')}</strong>
          </p>

          <p className={styles.desc}>
            Hemos recibido tu solicitud y la estamos revisando. Recibirás un correo de confirmación
            en los próximos minutos en el correo que registraste.
          </p>

          <ConfirmationTimeline />
          <ConfirmationInfoCards />

          <div className={styles.cta}>
            <Link href="/" className={styles.ctaBtn}>
              <span className="icon" style={{ fontSize: '20px' }}>home</span>
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>

      <footer className="reg-footer">
        <span>&copy; {new Date().getFullYear()} SPIDI Inc.</span>
        <a href="#">Términos</a>
        <a href="#">Privacidad</a>
      </footer>
    </div>
  );
}
