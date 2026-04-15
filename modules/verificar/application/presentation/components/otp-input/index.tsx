import { type RefObject } from 'react';
import styles from './style.module.scss';

interface IOtpInputProps {
  otp: string[];
  inputRefs: RefObject<HTMLInputElement>[];
  hasError: boolean;
  isDisabled: boolean;
  onChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
}

export function OtpInput({
  otp,
  inputRefs,
  hasError,
  isDisabled,
  onChange,
  onKeyDown,
  onPaste,
}: IOtpInputProps) {
  return (
    <div className={styles.group}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={inputRefs[index]}
          className={`${styles.input} ${hasError ? styles.error : ''} ${digit ? styles.filled : ''}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => onChange(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          onPaste={index === 0 ? onPaste : undefined}
          onFocus={() => inputRefs[index].current?.select()}
          aria-label={`Dígito ${index + 1} de 6`}
          disabled={isDisabled}
        />
      ))}
    </div>
  );
}
