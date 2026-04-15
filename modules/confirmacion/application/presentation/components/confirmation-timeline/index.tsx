import styles from './style.module.scss';

interface ITimelineStep {
  day: string;
  text: string;
  done: boolean;
}

const STEPS: ITimelineStep[] = [
  { day: 'Hoy', text: 'Solicitud recibida — en revisión', done: true },
  { day: 'Días 1-2', text: 'Verificación de documentos', done: false },
  { day: 'Días 3-4', text: 'Verificación de antecedentes', done: false },
  { day: 'Días 5-6', text: 'Entrenamiento online', done: false },
  { day: 'Día 7', text: '¡Primera entrega!', done: false },
];

export function ConfirmationTimeline() {
  return (
    <div className={styles.timeline}>
      <h4>Próximos pasos</h4>
      {STEPS.map((step) => (
        <div key={step.day} className={styles.item}>
          <div className={`${styles.dot} ${step.done ? styles.dotDone : styles.dotPending}`}>
            {step.done && <span className="icon" style={{ fontSize: '16px' }}>check</span>}
          </div>
          <div className={styles.content}>
            <div className={styles.day}>{step.day}</div>
            <div className={styles.text}>{step.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
