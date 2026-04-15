import styles from './style.module.scss';

export function ConfirmationInfoCards() {
  return (
    <div className={styles.cards}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <span className="icon" style={{ fontSize: '24px', color: 'var(--color-primary-mid)' }}>
            mail
          </span>
        </div>
        <h5 className={styles.cardTitle}>Revisa tu correo</h5>
        <p className={styles.cardText}>
          Te enviamos instrucciones detalladas a tu correo registrado
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <span className="icon" style={{ fontSize: '24px', color: 'var(--color-primary-mid)' }}>
            phone_android
          </span>
        </div>
        <h5 className={styles.cardTitle}>Descarga la app</h5>
        <p className={styles.cardText}>
          Mientras tanto, descarga la app SPIDI para estar listo
        </p>
        <div className={styles.badges}>
          <span className={styles.badge}>
            <span className="icon">apple</span> App Store
          </span>
          <span className={styles.badge}>
            <span className="icon">shop</span> Google Play
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <span className="icon" style={{ fontSize: '24px', color: 'var(--color-primary-mid)' }}>
            support_agent
          </span>
        </div>
        <h5 className={styles.cardTitle}>¿Tienes dudas?</h5>
        <p className={styles.cardText}>Estamos disponibles de Lun-Sab 8am-8pm</p>
        <button className={styles.supportBtn}>
          <span className="icon" style={{ fontSize: '16px' }}>
            chat
          </span>{' '}
          Chatear con soporte
        </button>
      </div>
    </div>
  );
}
