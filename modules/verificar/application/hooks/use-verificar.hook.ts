'use client';

import { useState, useEffect, useRef, useCallback, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { type IVerifyOtpUseCase } from '../../domain/contracts/verify-otp.use-case.interface';
import { type IResendOtpUseCase } from '../../domain/contracts/resend-otp.use-case.interface';
import { type ISubmitRegistrationUseCase } from '../../domain/contracts/submit-registration.use-case.interface';
import { type VerificationPhase } from '../../domain/contracts/verification-state.dto';
import { OtpBlockedError } from '../../domain/errors/otp-blocked.error';
import { OtpMaxAttemptsError } from '../../domain/errors/otp-max-attempts.error';

const OTP_EXPIRY_TIME = 600;
const REGISTRATION_SESSION_KEY = 'spidi_step1';

interface IUserData {
  email: string;
  telefono: string;
  nombre: string;
}

interface IUseVerificarResult {
  phase: VerificationPhase;
  otp: string[];
  inputRefs: RefObject<HTMLInputElement>[];
  isVerifying: boolean;
  isSubmitting: boolean;
  isBlocked: boolean;
  showSuccess: boolean;
  showError: boolean;
  showToast: boolean;
  errorMessage: string;
  countdown: number;
  canResend: boolean;
  isDuplicateContact: boolean;
  userData: IUserData;
  handleOtpChange: (index: number, value: string) => void;
  handleKeyDown: (index: number, e: React.KeyboardEvent) => void;
  handlePaste: (e: React.ClipboardEvent) => void;
  handleVerify: (code?: string) => Promise<void>;
  handleResend: () => Promise<void>;
  handleSubmit: () => Promise<void>;
  maskEmail: (email: string) => string;
  maskPhone: (phone: string) => string;
  formatTime: (seconds: number) => string;
}

export function useVerificar(
  verifyOtpUseCase: IVerifyOtpUseCase,
  resendOtpUseCase: IResendOtpUseCase,
  submitRegistrationUseCase: ISubmitRegistrationUseCase,
): IUseVerificarResult {
  const router = useRouter();
  const [phase, setPhase] = useState<VerificationPhase>('phone');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(OTP_EXPIRY_TIME);
  const [canResend, setCanResend] = useState(false);
  const [isDuplicateContact, setIsDuplicateContact] = useState(false);
  const [userData, setUserData] = useState<IUserData>({ email: '', telefono: '', nombre: '' });

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    const raw = sessionStorage.getItem(REGISTRATION_SESSION_KEY);
    if (!raw) { router.push('/registro'); return; }
    const data = JSON.parse(raw);
    setUserData({ email: data.email, telefono: data.telefono, nombre: data.nombre });
    setIsDuplicateContact(false);
    inputRefs[0].current?.focus();
  }, [router]);

  useEffect(() => {
    if (countdown > 0 && !showSuccess && !isBlocked) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (countdown === 0) setCanResend(true);
  }, [countdown, showSuccess, isBlocked]);

  useEffect(() => {
    if (showSuccess) return;
    setOtp(['', '', '', '', '', '']);
    setShowError(false);
    setErrorMessage('');
    setCountdown(OTP_EXPIRY_TIME);
    setCanResend(false);
    setIsVerifying(false);
    inputRefs[0].current?.focus();
  }, [phase, showSuccess]);

  const showErrorFor = (msg: string, duration = 4000) => {
    setErrorMessage(msg);
    setShowError(true);
    if (duration > 0) setTimeout(() => setShowError(false), duration);
  };

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setShowError(false);

    if (value && index < 5) inputRefs[index + 1].current?.focus();
    if (value && index === 5 && newOtp.every((d) => d !== '')) {
      setTimeout(() => handleVerify(newOtp.join('')), 300);
    }
  }, [otp]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  }, [otp]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = pasted.split('');
    while (newOtp.length < 6) newOtp.push('');
    setOtp(newOtp);
    const lastIndex = Math.min(pasted.length - 1, 5);
    inputRefs[lastIndex].current?.focus();
    if (pasted.length === 6) setTimeout(() => handleVerify(pasted), 300);
  }, []);

  const handleVerify = useCallback(async (code?: string) => {
    if (isVerifying || isBlocked) return;
    const fullCode = code ?? otp.join('');
    if (fullCode.length < 6) {
      showErrorFor('Código incorrecto. Intenta de nuevo.', 3000);
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyOtpUseCase.execute({ code: fullCode, phase });
      if (result.success) {
        setShowSuccess(true);
        if (result.allCompleted) {
          setTimeout(() => { setShowSuccess(false); setPhase('completed'); }, 1800);
        } else {
          setTimeout(() => {
            setPhase((p) => p === 'phone' ? 'email' : 'completed');
            setShowSuccess(false);
          }, 1800);
        }
      }
    } catch (err) {
      if (err instanceof OtpBlockedError) {
        setIsBlocked(true);
        showErrorFor(err.message, 0);
      } else if (err instanceof OtpMaxAttemptsError) {
        showErrorFor(err.message);
      } else {
        showErrorFor('Error al verificar el código. Intenta de nuevo.');
      }
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying, isBlocked, otp, phase, verifyOtpUseCase]);

  const handleResend = useCallback(async () => {
    if (!canResend || isBlocked) return;
    try {
      const result = await resendOtpUseCase.execute({ phase });
      if (result.success) {
        setCountdown(OTP_EXPIRY_TIME);
        setCanResend(false);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else if (result.resendLimitReached) {
        showErrorFor('Ya has solicitado el reenvío del código. Por favor espera a que expire.');
      }
    } catch {
      showErrorFor('Error al reenviar el código.');
    }
  }, [canResend, isBlocked, phase, resendOtpUseCase]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitRegistrationUseCase.execute();
      router.push('/registro/confirmacion');
    } catch {
      showErrorFor('Error al enviar la solicitud. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, submitRegistrationUseCase, router]);

  const maskEmail = (email: string) => {
    if (!email) return '***@***.com';
    const [user, domain] = email.split('@');
    return user[0] + '***@' + domain;
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 7) return '*** **** ****';
    return '*** ' + phone.slice(-7, -4) + ' ' + phone.slice(-4);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    phase, otp, inputRefs, isVerifying, isSubmitting, isBlocked,
    showSuccess, showError, showToast, errorMessage,
    countdown, canResend, isDuplicateContact, userData,
    handleOtpChange, handleKeyDown, handlePaste,
    handleVerify, handleResend, handleSubmit,
    maskEmail, maskPhone, formatTime,
  };
}
