import styles from './style.module.scss';

interface IVerifySuccessProps {
  text: string;
}

export function VerifySuccess({ text }: IVerifySuccessProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}>
        <span className="icon">check</span>
      </div>
      <p className={styles.text}>{text}</p>
    </div>
  );
}
