import { type VerificationPhase } from '../../../../domain/contracts/verification-state.dto';
import styles from './style.module.scss';

interface IVerifyStepsProps {
  phase: VerificationPhase;
  phoneVerified: boolean;
  emailVerified: boolean;
}

export function VerifySteps({ phase, phoneVerified, emailVerified }: IVerifyStepsProps) {
  const phoneClass =
    phase === 'phone' ? styles.active : phoneVerified ? styles.done : '';
  const emailClass =
    phase === 'email' ? styles.active : emailVerified ? styles.done : '';

  return (
    <div className={styles.steps}>
      <span className={`${styles.step} ${phoneClass}`}>
        <span className="icon">phone_android</span> Teléfono
      </span>
      <span className={styles.divider}>&mdash;</span>
      <span className={`${styles.step} ${emailClass}`}>
        <span className="icon">mail</span> Correo
      </span>
    </div>
  );
}
