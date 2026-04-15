"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { type IUseCase } from "@/modules/shared/domain/contracts/use-case.interface";
import { type IConfiguracionRepository } from "@/modules/shared/domain/contracts/configuracion-repository.interface";
import { useGlobalLoading } from "@/modules/shared/application/hooks/use-global-loading.hook";
import { type IStateDTO } from "../../../domain/contracts/state.dto";
import { type IRegistroDTO } from "../../../domain/contracts/registro.dto";
import { type IVerificationResult } from "../../../domain/contracts/verification-result.dto";
import { type IRegisterApplicantDto } from "../../../domain/contracts/register-applicant.dto";
import { type IRequestVerificationCodeSmsInput } from "../../use-cases/request-verification-code-sms.use-case";
import { type IValidateVerificationCodeSmsInput } from "../../use-cases/validate-verification-code-sms.use-case";
import { type IRequestVerificationCodeEmailInput } from "../../use-cases/request-verification-code-email.use-case";
import { type IValidateVerificationCodeEmailInput } from "../../use-cases/validate-verification-code-email.use-case";
import { useStates } from "../../hooks/use-states.hook";
import { useToast } from "@/modules/shared/application/hooks/use-toast.hook";
import { type IRegisterRepository } from "../../../domain/contracts/register-repository.interface";
import { SpidiLogo } from "@/modules/shared/application/presentation/components/spidi-logo";
import "@/app/landing.css";
import "@/app/registro/registro.css";
import { EstadoVerificacionOtp } from "@/modules/registro/domain/value-objects/estado-verificacion-otp";
import { v7 as uuidV7 } from "uuid";
import { IndexedDbConstantes } from "@/modules/shared/domain/value-objects/configuration-repository.constants";

type FieldConfig = {
  id: string;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (val: string) => boolean;
  transform?: (val: string) => string;
  type?: "text" | "select";
  msg: string;
};

const yearValidator = (val: string) => {
  const n = parseInt(val, 10);
  return n >= 1990 && n <= 2026;
};

const FIELDS: FieldConfig[] = [
  {
    id: "firstName",
    required: true,
    min: 2,
    max: 100,
    msg: "Ingresa tu primer nombre",
  },
  {
    id: "middleName",
    required: false,
    min: 0,
    max: 100,
    msg: "Ingresa tu segundo nombre",
  },
  {
    id: "paternalSurname",
    required: true,
    min: 2,
    max: 100,
    msg: "Ingresa tu apellido paterno",
  },
  {
    id: "maternalSurname",
    required: false,
    min: 0,
    max: 100,
    msg: "Ingresa tu apellido materno",
  },
  {
    id: "telefono",
    required: true,
    pattern: /^\d{10}$/,
    msg: "Ingresa 10 dígitos",
  },
  {
    id: "email",
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    max: 255,
    msg: "Ingresa un correo válido",
  },
  {
    id: "marca",
    required: true,
    min: 2,
    max: 30,
    msg: "Ingresa la marca del vehículo",
  },
  {
    id: "modelo",
    required: true,
    min: 1,
    max: 50,
    msg: "Ingresa el modelo del vehículo",
  },
  {
    id: "anio",
    required: true,
    pattern: /^\d{4}$/,
    custom: yearValidator,
    msg: "Ingresa un año válido (1990–2026)",
  },
  {
    id: "placas",
    required: true,
    min: 2,
    max: 10,
    transform: (v) => v.toUpperCase(),
    msg: "Ingresa las placas del vehículo",
  },
  {
    id: "color",
    required: true,
    min: 2,
    max: 30,
    msg: "Ingresa el color del vehículo",
  },
  { id: "estado", required: true, type: "select", msg: "Selecciona un estado" },
  {
    id: "ciudad",
    required: true,
    type: "select",
    msg: "Selecciona una ciudad",
  },
  {
    id: "comoTeEnteraste",
    required: true,
    type: "select",
    msg: "Selecciona una opción",
  },
];

const getMessageFromEstadoVerificacion = (estado: EstadoVerificacionOtp) => {
  switch (estado) {
    case EstadoVerificacionOtp.Pendiente:
      return "No se recibió el código. Intenta nuevamente.";
    case EstadoVerificacionOtp.Aprobado:
      return "";
    case EstadoVerificacionOtp.Cancelado:
      return "Código de verificación fue cancelado por otra solicitud.";
    case EstadoVerificacionOtp.MaximoDeIntentosAlcanzado:
      return "Has alcanzado el máximo de intentos. Contacta a soporte.";
    case EstadoVerificacionOtp.Eliminado:
      return "Código de verificación ya fue eliminado. Intenta nuevamente.";
    case EstadoVerificacionOtp.FalloAlVerificar:
      return "Código incorrecto. Intenta nuevamente.";
    case EstadoVerificacionOtp.CodigoExpirado:
      return "Código expirado. Solicita un nuevo código.";
  }
};

interface IRegistroViewProps {
  getStatesUseCase: IUseCase<void, IStateDTO[]>;
  requestVerificationCodeSmsUseCase: IUseCase<
    IRequestVerificationCodeSmsInput,
    IResultApi<IVerificationResult>
  >;
  validateVerificationCodeSmsUseCase: IUseCase<
    IValidateVerificationCodeSmsInput,
    IResultApi<IVerificationResult>
  >;
  requestVerificationCodeEmailUseCase: IUseCase<
    IRequestVerificationCodeEmailInput,
    IResultApi<IVerificationResult>
  >;
  validateVerificationCodeEmailUseCase: IUseCase<
    IValidateVerificationCodeEmailInput,
    IResultApi<IVerificationResult>
  >;
  guardarDriverUseCase: IUseCase<
    IRegistroDTO,
    IResultApi<IRegisterApplicantDto>
  >;
  configuracionRepository: IConfiguracionRepository;
  registerRepository: IRegisterRepository;
}

export function RegistroView({
  getStatesUseCase,
  requestVerificationCodeSmsUseCase,
  validateVerificationCodeSmsUseCase,
  requestVerificationCodeEmailUseCase,
  validateVerificationCodeEmailUseCase,
  guardarDriverUseCase,
  configuracionRepository,
  registerRepository,
}: IRegistroViewProps) {
  const router = useRouter();
  const { showLoading, hideLoading } = useGlobalLoading();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [solicitudNum, setSolicitudNum] = useState("");

  const { states, isLoading: statesLoading } = useStates(getStatesUseCase);
  const [formId, setFormId] = useState("");
  const [formData, setFormData] = useState<IRegistroDTO>({
    firstName: "",
    middleName: "",
    paternalSurname: "",
    maternalSurname: "",
    telefono: "",
    email: "",
    marca: "",
    modelo: "",
    anio: "",
    placas: "",
    color: "",
    estado: "",
    ciudad: "",
    comoTeEnteraste: "",
    verifiedSms: false,
    verifiedEmail: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validFields, setValidFields] = useState<Set<string>>(new Set());
  const [ciudades, setCiudades] = useState<string[]>([]);

  // OTP States
  const [phoneOtp, setPhoneOtp] = useState(["", "", "", "", "", ""]);
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState("");
  const [emailOtpError, setEmailOtpError] = useState("");
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(600);
  const [emailOtpTimer, setEmailOtpTimer] = useState(600);
  const [phoneResendCount, setPhoneResendCount] = useState(0);
  const [emailResendCount, setEmailResendCount] = useState(0);

  const phoneOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const emailOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Restore cached form data on mount
  useEffect(() => {
    const load = async () => {
      const cacheFormId = await configuracionRepository.get(
        IndexedDbConstantes.REGISTRO_FORM_ID,
      );
      const cachedData = await configuracionRepository.get(
        IndexedDbConstantes.REGISTRO_CACHE,
      );
      const cachedVerification = await configuracionRepository.get(
        IndexedDbConstantes.REGISTRO_VERIFICATION_STATE,
      );
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          const now = Date.now();
          const twentyFourHours = 24 * 60 * 60 * 1000;
          let phoneVerified = false;
          let emailVerified = false;

          if (now - timestamp < twentyFourHours) {
            if (cachedVerification) {
              try {
                const verificationState = JSON.parse(cachedVerification);
                if (
                  verificationState.telefono === data.telefono &&
                  verificationState.phoneVerified
                ) {
                  phoneVerified = true;
                  setPhoneOtpSent(true);
                }
                if (
                  verificationState.email === data.email &&
                  verificationState.emailVerified
                ) {
                  emailVerified = true;
                  setEmailOtpSent(true);
                }
              } catch (e) {
                console.error("Error loading verification state:", e);
              }
            }

            setFormData({
              firstName: String(data.firstName ?? ""),
              middleName: String(data.middleName ?? ""),
              paternalSurname: String(data.paternalSurname ?? ""),
              maternalSurname: String(data.maternalSurname ?? ""),
              telefono: String(data.telefono ?? ""),
              email: String(data.email ?? ""),
              marca: String(data.marca ?? ""),
              modelo: String(data.modelo ?? ""),
              anio: String(data.anio ?? ""),
              placas: String(data.placas ?? ""),
              color: String(data.color ?? ""),
              estado: String(data.estado ?? ""),
              ciudad: String(data.ciudad ?? ""),
              comoTeEnteraste: String(data.comoTeEnteraste ?? ""),
              verifiedSms: phoneVerified,
              verifiedEmail: emailVerified,
            });
          } else {
            void configuracionRepository.remove(
              IndexedDbConstantes.REGISTRO_CACHE,
            );
            void configuracionRepository.remove(
              IndexedDbConstantes.REGISTRO_VERIFICATION_STATE,
            );
          }
        } catch (e) {
          console.error("Error loading cached data:", e);
        }
      }
      if (cacheFormId) {
        setFormId(cacheFormId);
      } else {
        if (formId.length > 0) return;
        const newFormId = uuidV7();
        setFormId(newFormId);
        await configuracionRepository.set(
          IndexedDbConstantes.REGISTRO_FORM_ID,
          newFormId,
        );
      }
    };
    void load();
  });

  // Sync ciudades when states load (populates cities for cached/selected estado)
  useEffect(() => {
    if (states.length > 0 && formData.estado) {
      const match = states.find((s) => s.state === formData.estado);
      setCiudades(match ? match.cities.map((c) => c.city) : []);
    }
  }, [formData.estado, states]);

  // Timer countdown para phone OTP
  useEffect(() => {
    if (phoneOtpSent && phoneOtpTimer > 0 && !formData.verifiedSms) {
      const interval = setInterval(() => {
        setPhoneOtpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phoneOtpSent, phoneOtpTimer, formData]);

  // Timer countdown para email OTP
  useEffect(() => {
    if (emailOtpSent && emailOtpTimer > 0 && !formData.verifiedEmail) {
      const interval = setInterval(() => {
        setEmailOtpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [emailOtpSent, emailOtpTimer, formData]);

  const validateField = (id: string, value?: string) => {
    const cfg = FIELDS.find((f) => f.id === id);
    if (!cfg) return true;

    let val = value !== undefined ? value : formData[id as keyof IRegistroDTO];
    val = String(val ?? "").trim();

    let err: string | null = null;

    if (cfg.required && !val) {
      err = cfg.msg;
    } else if (val) {
      if (cfg.min && val.length < cfg.min) err = cfg.msg;
      if (cfg.max && val.length > cfg.max) err = cfg.msg;
      if (cfg.pattern && !cfg.pattern.test(val)) err = cfg.msg;
      if (cfg.custom && !cfg.custom(val)) err = cfg.msg;
      if (cfg.type === "select" && !val) err = cfg.msg;
    }

    setErrors((prev) => {
      const newErrors = { ...prev };
      if (err) {
        newErrors[id] = err;
      } else {
        delete newErrors[id];
      }
      return newErrors;
    });

    setValidFields((prev) => {
      const newSet = new Set(prev);
      if (!err && val) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });

    return !err;
  };

  const handleInputChange = (id: string, value: string) => {
    const cfg = FIELDS.find((f) => f.id === id);
    let newValue = value ?? "";

    if (cfg?.transform) newValue = cfg.transform(newValue);

    if (id === "telefono" && formData.telefono !== newValue) {
      if (formData.verifiedSms || phoneOtpSent) {
        formData.verifiedSms = false;
        setPhoneOtpSent(false);
        setPhoneOtp(["", "", "", "", "", ""]);
        setPhoneOtpError("");
        setPhoneOtpTimer(600);
        setPhoneResendCount(0);
        void configuracionRepository.remove(
          IndexedDbConstantes.REGISTRO_VERIFICATION_STATE,
        );
      }
    }

    if (id === "email" && formData.email !== newValue) {
      if (formData.verifiedEmail || emailOtpSent) {
        formData.verifiedEmail = false;
        setEmailOtpSent(false);
        setEmailOtp(["", "", "", "", "", ""]);
        setEmailOtpError("");
        setEmailOtpTimer(600);
        setEmailResendCount(0);
        void configuracionRepository.remove(
          IndexedDbConstantes.REGISTRO_VERIFICATION_STATE,
        );
      }
    }

    const updatedData = { ...formData, [id]: newValue ?? "" };
    setFormData(updatedData);

    void configuracionRepository.set(
      IndexedDbConstantes.REGISTRO_CACHE,
      JSON.stringify({
        data: updatedData,
        timestamp: Date.now(),
      }),
    );

    if (errors[id]) validateField(id, newValue);
  };

  const handleBlur = (id: string) => {
    validateField(id);
  };

  const handleEstadoChange = (estado: string) => {
    const safeEstado = estado ?? "";
    const updatedData = { ...formData, estado: safeEstado, ciudad: "" };
    setFormData(updatedData);

    const match = states.find((s) => s.state === safeEstado);
    setCiudades(match ? match.cities.map((c) => c.city) : []);

    void configuracionRepository.set(
      IndexedDbConstantes.REGISTRO_CACHE,
      JSON.stringify({
        data: updatedData,
        timestamp: Date.now(),
      }),
    );

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.estado;
      delete newErrors.ciudad;
      return newErrors;
    });

    validateField("estado", estado);
  };

  const validateAllStep1 = () => {
    FIELDS.forEach((f) => validateField(f.id));
    return FIELDS.every((f) => validateField(f.id));
  };

  // OTP Handlers
  const handlePhoneOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...phoneOtp];
    newOtp[index] = value.slice(-1);
    setPhoneOtp(newOtp);
    setPhoneOtpError("");
    if (value && index < 5) phoneOtpRefs.current[index + 1]?.focus();
    if (newOtp.every((digit) => digit !== "") && newOtp.join("").length === 6) {
      verifyPhoneOtp(newOtp.join(""));
    }
  };

  const handleEmailOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...emailOtp];
    newOtp[index] = value.slice(-1);
    setEmailOtp(newOtp);
    setEmailOtpError("");
    if (value && index < 5) emailOtpRefs.current[index + 1]?.focus();
    if (newOtp.every((digit) => digit !== "") && newOtp.join("").length === 6) {
      verifyEmailOtp(newOtp.join(""));
    }
  };

  const handlePhoneOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !phoneOtp[index] && index > 0) {
      phoneOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleEmailOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !emailOtp[index] && index > 0) {
      emailOtpRefs.current[index - 1]?.focus();
    }
  };

  const sendPhoneOtp = async () => {
    try {
      showLoading();
      const result = await requestVerificationCodeSmsUseCase.execute({
        formId: formId,
        phoneNumber: formData.telefono,
      });
      if (result.success) {
        const verifiedResult = result.data!;
        if (verifiedResult.status === EstadoVerificacionOtp.Pendiente) {
          showToast({
            type: "success",
            message:
              "Se le ha enviado el código vía SMS a su teléfono. Tiene 10 minutos para ingresarlo.",
          });
          setPhoneOtpSent(true);
          setPhoneOtpTimer(600);
          return;
        }
      }
      showToast({
        type: "danger",
        message: "No se pudo enviar el código SMS. Intenta más tarde.",
      });
      setPhoneOtpSent(false);
      return;
    } finally {
      hideLoading();
    }
  };

  const sendEmailOtp = async () => {
    try {
      showLoading();
      const result = await requestVerificationCodeEmailUseCase.execute({
        formId: formId,
        email: formData.email,
      });
      if (result.success) {
        const verifiedResult = result.data!;
        if (verifiedResult.status === EstadoVerificacionOtp.Pendiente) {
          showToast({
            type: "success",
            message:
              "Se le ha enviado el código a su correo electrónico. Tiene 10 minutos para ingresarlo.",
          });
          setEmailOtpSent(true);
          setEmailOtpTimer(600);
          return;
        }
      }
      showToast({
        type: "danger",
        message:
          "No se pudo enviar el código a su correo electrónico. Intenta más tarde.",
      });
      setEmailOtpSent(false);
      return;
    } finally {
      hideLoading();
    }
  };

  const verifyPhoneOtp = async (code: string) => {
    try {
      showLoading();
      const result = await validateVerificationCodeSmsUseCase.execute({
        formId: formId,
        phoneNumber: formData.telefono,
        code,
      });
      if (result.success) {
        const verifiedResult = result.data!;
        switch (verifiedResult.status) {
          case EstadoVerificacionOtp.Aprobado:
            formData.verifiedSms = true;
            setPhoneOtpError("");
            const verificationState = {
              telefono: formData.telefono,
              email: formData.email,
              phoneVerified: formData.verifiedSms,
              emailVerified: formData.verifiedEmail,
            };
            void configuracionRepository.set(
              IndexedDbConstantes.REGISTRO_VERIFICATION_STATE,
              JSON.stringify(verificationState),
            );
            return;
          default:
            setPhoneOtpError(
              getMessageFromEstadoVerificacion(verifiedResult.status),
            );
            setPhoneOtp(["", "", "", "", "", ""]);
            phoneOtpRefs.current[0]?.focus();
            return;
        }
      }
    } finally {
      hideLoading();
    }
    setPhoneOtpError(
      getMessageFromEstadoVerificacion(EstadoVerificacionOtp.FalloAlVerificar),
    );
    setPhoneOtp(["", "", "", "", "", ""]);
    phoneOtpRefs.current[0]?.focus();
    return;
  };

  const verifyEmailOtp = async (code: string) => {
    try {
      showLoading();
      const result = await validateVerificationCodeEmailUseCase.execute({
        formId: formId,
        email: formData.email,
        code,
      });
      if (result.success) {
        const verifiedResult = result.data!;
        switch (verifiedResult.status) {
          case EstadoVerificacionOtp.Aprobado:
            formData.verifiedEmail = true;
            setEmailOtpError("");
            const verificationState = {
              telefono: formData.telefono,
              email: formData.email,
              phoneVerified: formData.verifiedSms,
              emailVerified: formData.verifiedEmail,
            };
            void configuracionRepository.set(
              IndexedDbConstantes.REGISTRO_VERIFICATION_STATE,
              JSON.stringify(verificationState),
            );
            return;
          default:
            setEmailOtpError(
              getMessageFromEstadoVerificacion(verifiedResult.status),
            );
            setEmailOtp(["", "", "", "", "", ""]);
            emailOtpRefs.current[0]?.focus();
            return;
        }
      }
    } finally {
      hideLoading();
    }
    setEmailOtpError(
      getMessageFromEstadoVerificacion(EstadoVerificacionOtp.FalloAlVerificar),
    );
    setEmailOtp(["", "", "", "", "", ""]);
    emailOtpRefs.current[0]?.focus();
    return;
  };

  const resendPhoneOtp = () => {
    if (phoneResendCount >= 1) {
      showToast({
        message: "Ya usaste tu reenvío. Contacta a soporte si necesitas ayuda.",
        type: "warning",
      });
      return;
    }
    setPhoneResendCount((prev) => prev + 1);
    sendPhoneOtp();
  };

  const resendEmailOtp = () => {
    if (emailResendCount >= 1) {
      showToast({
        message: "Ya usaste tu reenvío. Contacta a soporte si necesitas ayuda.",
        type: "warning",
      });
      return;
    }
    setEmailResendCount((prev) => prev + 1);
    sendEmailOtp();
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (validateAllStep1()) {
        const result = await registerRepository.checkDuplicate(
          formData.telefono,
          formData.email,
        );
        if (result.success && result.data?.duplicatedFields.length === 0) {
          setCurrentStep(2);
        } else {
          const defaultError =
            "Los datos de contacto han sido registrados previamente, te sugerimos contactar al equipo de soporte.";
          showToast({
            type: "danger",
            message:
              (result.data?.message?.length ?? 0) > 0
                ? result.data?.message!
                : defaultError,
          });
        }
      } else {
        const firstError = FIELDS.find((f) => !validateField(f.id));
        if (firstError) {
          const el = document.getElementById(firstError.id);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.focus();
          }
        }
      }
    } else if (currentStep === 2) {
      if (formData.verifiedSms) setCurrentStep(3);
    } else if (currentStep === 3) {
      if (formData.verifiedEmail) setCurrentStep(4);
    } else if (currentStep === 4) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const nameParts =  formData.firstName.split(/\s+/);
      const registroDto: IRegistroDTO = {
        firstName: nameParts[0],
        middleName: nameParts.length > 1 ? nameParts.splice(1).join(" ") : "",
        paternalSurname: formData.paternalSurname,
        maternalSurname: formData.maternalSurname,
        telefono: formData.telefono,
        email: formData.email,
        marca: formData.marca,
        modelo: formData.modelo,
        anio: formData.anio,
        placas: formData.placas,
        color: formData.color,
        estado: formData.estado,
        ciudad: formData.ciudad,
        comoTeEnteraste: formData.comoTeEnteraste,
        verifiedSms: formData.verifiedSms,
        verifiedEmail: formData.verifiedEmail,
      };
      const result = await guardarDriverUseCase.execute(registroDto);
      console.log("Resultado de registro:", result);

      if (result.success && result.data) {
        setSolicitudNum(`SPD-${result.data.applicantId}`);
        setCurrentStep(5);
        void configuracionRepository.remove(IndexedDbConstantes.REGISTRO_CACHE);
        void configuracionRepository.remove(
          IndexedDbConstantes.REGISTRO_VERIFICATION_STATE,
        );
        void configuracionRepository.remove(
          IndexedDbConstantes.REGISTRO_FORM_ID,
        );
      } else {
        showToast({
          type: "danger",
          message: "Ocurrió un error al registrar. Por favor, intenta nuevamente.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Cuéntanos sobre ti";
      case 2:
        return "Verifica tu teléfono";
      case 3:
        return "Verifica tu email";
      case 4:
        return "Confirma tu información";
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Solo toma 2 minutos. Completa tus datos y verificaremos tu correo y teléfono.";
      case 2:
        return phoneOtpSent
          ? `Se envió un código de 6 dígitos por SMS al <strong>${formData.telefono}</strong>`
          : `Se enviará un código de 6 dígitos por SMS al <strong>${formData.telefono}</strong>`;
      case 3:
        return emailOtpSent
          ? `Se envió un código de 6 dígitos al correo <strong>${formData.email}</strong>`
          : `Se enviará un código de 6 dígitos al correo <strong>${formData.email}</strong>`;
      case 4:
        return "Revisa tu información antes de enviar";
      default:
        return "";
    }
  };

  return (
    <div className="reg-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar__inner">
          <Link href="/" className="navbar__logo" aria-label="SPIDI inicio">
            <SpidiLogo />
          </Link>
        </div>
      </nav>

      {/* Branded Header */}
      <header className="reg-header">
        <h1 className="reg-header__title">Regístrate como repartidor SPIDI</h1>
        <p className="reg-header__subtitle">
          Completa el formulario y comienza a generar ingresos
        </p>
      </header>

      {/* Form Container */}
      <div className="reg-container">
        <div
          className={`reg-card ${currentStep === 5 ? "reg-card--confirm" : ""}`}
        >
          {currentStep < 5 && (
            <div className="verify-steps">
              <div
                className={`verify-step ${currentStep === 1 ? "active" : currentStep > 1 ? "done" : ""}`}
              >
                <span className="icon">
                  {currentStep > 1 ? "check" : "assignment"}
                </span>
                <span>Datos</span>
              </div>
              <span className="verify-step-divider">→</span>
              <div
                className={`verify-step ${currentStep === 2 ? "active" : currentStep > 2 ? "done" : ""}`}
              >
                <span className="icon">
                  {currentStep > 2 ? "check" : "phone_iphone"}
                </span>
                <span>SMS</span>
              </div>
              <span className="verify-step-divider">→</span>
              <div
                className={`verify-step ${currentStep === 3 ? "active" : currentStep > 3 ? "done" : ""}`}
              >
                <span className="icon">
                  {currentStep > 3 ? "check" : "email"}
                </span>
                <span>Email</span>
              </div>
              <span className="verify-step-divider">→</span>
              <div
                className={`verify-step ${currentStep === 4 ? "active" : ""}`}
              >
                <span className="icon">send</span>
                <span>Enviar</span>
              </div>
            </div>
          )}

          {/* Card Header */}
          {currentStep < 5 && (
            <div className="reg-card__header">
              <div className="reg-card__icon">
                <span className="icon">
                  {currentStep === 1 && "person_add"}
                  {currentStep === 2 && "phone_iphone"}
                  {currentStep === 3 && "email"}
                  {currentStep === 4 && "fact_check"}
                </span>
              </div>
              <h2 className="reg-card__title">{getStepTitle()}</h2>
              <p
                className="reg-card__desc"
                dangerouslySetInnerHTML={{ __html: getStepDescription() }}
              />
              {currentStep === 1 && (
                <div className="reg-card__benefits">
                  <span className="reg-card__benefit">
                    <span className="icon">check_circle</span> 100% en línea
                  </span>
                  <span className="reg-card__benefit">
                    <span className="icon">check_circle</span> Sin costo
                  </span>
                  <span className="reg-card__benefit">
                    <span className="icon">check_circle</span> Respuesta en
                    24-48h
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step Content */}
          <div className="wizard-content">
            {/* STEP 1: Datos Básicos */}
            {currentStep === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleNext();
                }}
                noValidate
              >
                {/* Datos personales */}
                <div className="form-section">
                  <h3 className="form-section__title">Datos personales</h3>
                  <div className="form-group__row">
                    <div
                      className={`form-group form-group--full-width ${errors.firstName ? "form-group--error" : ""} ${validFields.has("firstName") && !errors.firstName ? "form-group--success" : ""}`}
                    >
                      <label className="form-group__label" htmlFor="firstName">
                        Nombre(s)<span className="req">*</span>
                      </label>
                      <input
                        className="form-input"
                        type="text"
                        id="firstName"
                        placeholder="Ej. Juan"
                        maxLength={255}
                        autoComplete="given-name"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        onBlur={() => handleBlur("firstName")}
                      />
                      {errors.firstName && (
                        <div className="form-group__error">
                          <span className="icon">error</span>
                          <span>{errors.firstName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-group__row">
                    <div
                      className={`form-group ${errors.paternalSurname ? "form-group--error" : ""} ${validFields.has("paternalSurname") && !errors.paternalSurname ? "form-group--success" : ""}`}
                    >
                      <label
                        className="form-group__label"
                        htmlFor="paternalSurname"
                      >
                        Apellido paterno<span className="req">*</span>
                      </label>
                      <input
                        className="form-input"
                        type="text"
                        id="paternalSurname"
                        placeholder="Ej. García"
                        maxLength={255}
                        autoComplete="family-name"
                        value={formData.paternalSurname}
                        onChange={(e) =>
                          handleInputChange("paternalSurname", e.target.value)
                        }
                        onBlur={() => handleBlur("paternalSurname")}
                      />
                      {errors.paternalSurname && (
                        <div className="form-group__error">
                          <span className="icon">error</span>
                          <span>{errors.paternalSurname}</span>
                        </div>
                      )}
                    </div>
                    <div
                      className={`form-group ${errors.maternalSurname ? "form-group--error" : ""} ${validFields.has("maternalSurname") && !errors.maternalSurname ? "form-group--success" : ""}`}
                    >
                      <label
                        className="form-group__label"
                        htmlFor="maternalSurname"
                      >
                        Apellido materno
                      </label>
                      <input
                        className="form-input"
                        type="text"
                        id="maternalSurname"
                        placeholder="Ej. López (opcional)"
                        maxLength={255}
                        autoComplete="additional-name"
                        value={formData.maternalSurname}
                        onChange={(e) =>
                          handleInputChange("maternalSurname", e.target.value)
                        }
                        onBlur={() => handleBlur("maternalSurname")}
                      />
                      {errors.maternalSurname && (
                        <div className="form-group__error">
                          <span className="icon">error</span>
                          <span>{errors.maternalSurname}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contacto */}
                <div className="form-section">
                  <h3 className="form-section__title">Contacto</h3>
                  <div className="form-group__row">
                    <div
                      className={`form-group ${errors.telefono ? "form-group--error" : ""} ${validFields.has("telefono") && !errors.telefono ? "form-group--success" : ""}`}
                    >
                      <label className="form-group__label" htmlFor="telefono">
                        Teléfono celular<span className="req">*</span>
                      </label>
                      <input
                        className="form-input"
                        type="tel"
                        id="telefono"
                        placeholder="10 dígitos"
                        maxLength={10}
                        autoComplete="tel"
                        inputMode="numeric"
                        value={formData.telefono}
                        onChange={(e) =>
                          handleInputChange(
                            "telefono",
                            e.target.value.replace(/\D/g, ""),
                          )
                        }
                        onBlur={() => handleBlur("telefono")}
                      />
                      {errors.telefono && (
                        <div className="form-group__error">
                          <span className="icon">error</span>
                          <span>{errors.telefono}</span>
                        </div>
                      )}
                    </div>
                    <div
                      className={`form-group ${errors.email ? "form-group--error" : ""} ${validFields.has("email") && !errors.email ? "form-group--success" : ""}`}
                    >
                      <label className="form-group__label" htmlFor="email">
                        Correo electrónico<span className="req">*</span>
                      </label>
                      <input
                        className="form-input"
                        type="email"
                        id="email"
                        placeholder="tu@correo.com"
                        maxLength={255}
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        onBlur={() => handleBlur("email")}
                      />
                      {errors.email && (
                        <div className="form-group__error">
                          <span className="icon">error</span>
                          <span>{errors.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Datos del vehículo */}
                <div className="form-section">
                  <h3 className="form-section__title">Datos del vehículo</h3>
                  <div className="form-group__row">
                    <div
                      className={`form-group ${errors.marca ? "form-group--error" : ""} ${validFields.has("marca") && !errors.marca ? "form-group--success" : ""}`}
                    >
                      <label className="form-group__label" htmlFor="marca">
                        Marca<span className="req">*</span>
                      </label>
                      <input
                        className="form-input"
                        type="text"
                        id="marca"
                        placeholder="Ej. Toyota"
                        maxLength={30}
                        value={formData.marca}
                        onChange={(e) =>
                          handleInputChange("marca", e.target.value)
                        }
                        onBlur={() => handleBlur("marca")}
                      />
                      {errors.marca && (
                        <div className="form-group__error">
                          <span className="icon">error</span>
                          <span>{errors.marca}</span>
                        </div>
                      )}
                    </div>
                    <div
                      className={`form-group ${errors.modelo ? "form-group--error" : ""} ${validFields.has("modelo") && !errors.modelo ? "form-group--success" : ""}`}
                    >
                      <label className="form-group__label" htmlFor="modelo">
                        Modelo<span className="req">*</span>
                      </label>
                      <input
                        className="form-input"
                        type="text"
                        id="modelo"
                        placeholder="Ej. Corolla"
                        maxLength={50}
                        value={formData.modelo}
                        onChange={(e) =>
                          handleInputChange("modelo", e.target.value)
                        }
                        onBlur={() => handleBlur("modelo")}
                      />
                      {errors.modelo && (
                        <div className="form-group__error">
                          <span className="icon">error</span>
                          <span>{errors.modelo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-group__row">
                    <div
                      className={`form-group ${errors.anio ? "form-group--error" : ""} ${validFields.has("anio") && !errors.anio ? "form-group--success" : ""}`}
                    >
                      <label className="form-group__label" htmlFor="anio">
                        Año<span className="req">*</span>
                      </label>
                      <input
                        className="form-input"
                        type="text"
                        id="anio"
                        placeholder="Ej. 2020"
                        maxLength={4}
                        inputMode="numeric"
                        value={formData.anio}
                        onChange={(e) =>
                          handleInputChange(
                            "anio",
                            e.target.value.replace(/\D/g, ""),
                          )
                        }
                        onBlur={() => handleBlur("anio")}
                      />
                      {errors.anio && (
                        <div className="form-group__error">
                          <span className="icon">error</span>
                          <span>{errors.anio}</span>
                        </div>
                      )}
                    </div>
                    <div
                      className={`form-group ${errors.placas ? "form-group--error" : ""} ${validFields.has("placas") && !errors.placas ? "form-group--success" : ""}`}
                    >
                      <label className="form-group__label" htmlFor="placas">
                        Placas<span className="req">*</span>
                      </label>
                      <input
                        className="form-input"
                        type="text"
                        id="placas"
                        placeholder="Ej. ABC1234"
                        maxLength={10}
                        style={{ textTransform: "uppercase" }}
                        value={formData.placas}
                        onChange={(e) =>
                          handleInputChange("placas", e.target.value)
                        }
                        onBlur={() => handleBlur("placas")}
                      />
                      {errors.placas && (
                        <div className="form-group__error">
                          <span className="icon">error</span>
                          <span>{errors.placas}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className={`form-group ${errors.color ? "form-group--error" : ""} ${validFields.has("color") && !errors.color ? "form-group--success" : ""}`}
                  >
                    <label className="form-group__label" htmlFor="color">
                      Color<span className="req">*</span>
                    </label>
                    <input
                      className="form-input"
                      type="text"
                      id="color"
                      placeholder="Ej. Blanco"
                      maxLength={30}
                      value={formData.color}
                      onChange={(e) =>
                        handleInputChange("color", e.target.value)
                      }
                      onBlur={() => handleBlur("color")}
                    />
                    {errors.color && (
                      <div className="form-group__error">
                        <span className="icon">error</span>
                        <span>{errors.color}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ubicación */}
                <div className="form-section">
                  <h3 className="form-section__title">Ubicación</h3>
                  <div className="form-group__row">
                    <div
                      className={`form-group ${errors.estado ? "form-group--error" : ""} ${validFields.has("estado") && !errors.estado ? "form-group--success" : ""}`}
                    >
                      <label className="form-group__label" htmlFor="estado">
                        Estado<span className="req">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="estado"
                        value={formData.estado}
                        onChange={(e) => handleEstadoChange(e.target.value)}
                        disabled={statesLoading}
                      >
                        <option value="">
                          {statesLoading
                            ? "Cargando estados..."
                            : "Selecciona un estado"}
                        </option>
                        {states.map((s) => (
                          <option key={s.id} value={s.state}>
                            {s.state}
                          </option>
                        ))}
                      </select>
                      {errors.estado && (
                        <div className="form-group__error">
                          <span className="icon">error</span>
                          <span>{errors.estado}</span>
                        </div>
                      )}
                    </div>
                    <div
                      className={`form-group ${errors.ciudad ? "form-group--error" : ""} ${validFields.has("ciudad") && !errors.ciudad ? "form-group--success" : ""}`}
                    >
                      <label className="form-group__label" htmlFor="ciudad">
                        Ciudad / Municipio<span className="req">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="ciudad"
                        value={formData.ciudad}
                        onChange={(e) => {
                          handleInputChange("ciudad", e.target.value);
                          validateField("ciudad", e.target.value);
                        }}
                        disabled={!formData.estado}
                      >
                        <option value="">
                          {formData.estado
                            ? "Selecciona una ciudad"
                            : "Primero selecciona un estado"}
                        </option>
                        {ciudades.map((ciudad) => (
                          <option key={ciudad}>{ciudad}</option>
                        ))}
                      </select>
                      {errors.ciudad && (
                        <div className="form-group__error">
                          <span className="icon">error</span>
                          <span>{errors.ciudad}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="form-section">
                  <h3 className="form-section__title">Información adicional</h3>
                  <div
                    className={`form-group ${errors.comoTeEnteraste ? "form-group--error" : ""} ${validFields.has("comoTeEnteraste") && !errors.comoTeEnteraste ? "form-group--success" : ""}`}
                  >
                    <label
                      className="form-group__label"
                      htmlFor="comoTeEnteraste"
                    >
                      ¿Cómo te enteraste de SPIDI?<span className="req">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="comoTeEnteraste"
                      value={formData.comoTeEnteraste}
                      onChange={(e) => {
                        handleInputChange("comoTeEnteraste", e.target.value);
                        validateField("comoTeEnteraste", e.target.value);
                      }}
                    >
                      <option value="">Selecciona una opción</option>
                      <option>Redes sociales</option>
                      <option>Recomendación de amigo o familiar</option>
                      <option>Búsqueda en internet</option>
                      <option>Volante o cartel</option>
                      <option>Otro</option>
                    </select>
                    {errors.comoTeEnteraste && (
                      <div className="form-group__error">
                        <span className="icon">error</span>
                        <span>{errors.comoTeEnteraste}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <Link href="/" className="btn btn--ghost">
                    ← Cancelar
                  </Link>
                  <button type="submit" className="btn btn--primary btn--lg">
                    Siguiente{" "}
                    <span className="icon" style={{ fontSize: "20px" }}>
                      arrow_forward
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Validación SMS */}
            {currentStep === 2 && (
              <div className="verify-content">
                {!phoneOtpSent ? (
                  <button
                    onClick={sendPhoneOtp}
                    className="btn btn--primary btn--lg btn--full"
                  >
                    Enviar código por SMS
                  </button>
                ) : !formData.verifiedSms ? (
                  <>
                    <div className="otp-group">
                      {phoneOtp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            phoneOtpRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className={`otp-input ${phoneOtpError ? "error" : ""}`}
                          value={digit}
                          onChange={(e) =>
                            handlePhoneOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handlePhoneOtpKeyDown(index, e)}
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>
                    {phoneOtpError && (
                      <div className="verify-error visible">
                        <span className="icon">error</span>
                        {phoneOtpError}
                      </div>
                    )}
                    <div className="verify-resend">
                      Expira en {formatTime(phoneOtpTimer)} •{" "}
                      <button
                        onClick={resendPhoneOtp}
                        disabled={phoneOtpTimer > 0 || phoneResendCount >= 1}
                      >
                        Reenviar código
                      </button>
                    </div>
                    {phoneResendCount >= 1 && (
                      <p
                        style={{
                          textAlign: "center",
                          fontSize: "13px",
                          color: "#E1251B",
                          marginTop: "12px",
                        }}
                      >
                        Ya usaste tu reenvío. Contacta a soporte si necesitas
                        ayuda.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="verify-success">
                    <div
                      className="verify-icon"
                      style={{ background: "#E6F4ED" }}
                    >
                      <span
                        className="icon"
                        style={{ color: "#1A7F4B", fontSize: "48px" }}
                      >
                        check_circle
                      </span>
                    </div>
                    <p
                      style={{
                        textAlign: "center",
                        color: "#1A7F4B",
                        fontWeight: 600,
                        marginTop: "16px",
                      }}
                    >
                      ✓ Teléfono verificado correctamente
                    </p>
                  </div>
                )}
                <div className="form-actions" style={{ marginTop: "32px" }}>
                  <button onClick={handleBack} className="btn btn--ghost">
                    ← Atrás
                  </button>
                  <button
                    onClick={handleNext}
                    className="btn btn--primary btn--lg"
                    disabled={!formData.verifiedSms}
                  >
                    Siguiente{" "}
                    <span className="icon" style={{ fontSize: "20px" }}>
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Validación Email */}
            {currentStep === 3 && (
              <div className="verify-content">
                {!emailOtpSent ? (
                  <button
                    onClick={sendEmailOtp}
                    className="btn btn--primary btn--lg btn--full"
                  >
                    Enviar código por email
                  </button>
                ) : !formData.verifiedEmail ? (
                  <>
                    <div className="otp-group">
                      {emailOtp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            emailOtpRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className={`otp-input ${emailOtpError ? "error" : ""}`}
                          value={digit}
                          onChange={(e) =>
                            handleEmailOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleEmailOtpKeyDown(index, e)}
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>
                    {emailOtpError && (
                      <div className="verify-error visible">
                        <span className="icon">error</span>
                        {emailOtpError}
                      </div>
                    )}
                    <div className="verify-resend">
                      Expira en {formatTime(emailOtpTimer)} •{" "}
                      <button
                        onClick={resendEmailOtp}
                        disabled={emailOtpTimer > 0 || emailResendCount >= 1}
                      >
                        Reenviar código
                      </button>
                    </div>
                    {emailResendCount >= 1 && (
                      <p
                        style={{
                          textAlign: "center",
                          fontSize: "13px",
                          color: "#E1251B",
                          marginTop: "12px",
                        }}
                      >
                        Ya usaste tu reenvío. Contacta a soporte si necesitas
                        ayuda.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="verify-success">
                    <div
                      className="verify-icon"
                      style={{ background: "#E6F4ED" }}
                    >
                      <span
                        className="icon"
                        style={{ color: "#1A7F4B", fontSize: "48px" }}
                      >
                        check_circle
                      </span>
                    </div>
                    <p
                      style={{
                        textAlign: "center",
                        color: "#1A7F4B",
                        fontWeight: 600,
                        marginTop: "16px",
                      }}
                    >
                      ✓ Email verificado correctamente
                    </p>
                  </div>
                )}
                <div className="form-actions" style={{ marginTop: "32px" }}>
                  <button onClick={handleBack} className="btn btn--ghost">
                    ← Atrás
                  </button>
                  <button
                    onClick={handleNext}
                    className="btn btn--primary btn--lg"
                    disabled={!formData.verifiedEmail}
                  >
                    Siguiente{" "}
                    <span className="icon" style={{ fontSize: "20px" }}>
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Resumen */}
            {currentStep === 4 && (
              <div className="summary-content">
                <div className="form-section">
                  <h3 className="form-section__title">Tus datos personales</h3>
                  <div
                    className="summary-item"
                    style={{ marginBottom: "16px" }}
                  >
                    <strong>Nombre completo:</strong> {formData.firstName}{" "}
                    {formData.middleName} {formData.paternalSurname}{" "}
                    {formData.maternalSurname}
                  </div>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <strong>Teléfono:</strong> {formData.telefono} ✓
                    </div>
                    <div className="summary-item">
                      <strong>Email:</strong> {formData.email} ✓
                    </div>
                  </div>
                </div>
                <div className="form-section">
                  <h3 className="form-section__title">Tu vehículo</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <strong>Marca:</strong> {formData.marca}
                    </div>
                    <div className="summary-item">
                      <strong>Modelo:</strong> {formData.modelo}
                    </div>
                    <div className="summary-item">
                      <strong>Año:</strong> {formData.anio}
                    </div>
                    <div className="summary-item">
                      <strong>Color:</strong> {formData.color}
                    </div>
                  </div>
                  <div className="summary-item" style={{ marginTop: "8px" }}>
                    <strong>Placas:</strong> {formData.placas}
                  </div>
                </div>
                <div className="form-section">
                  <h3 className="form-section__title">
                    Zona de trabajo deseada
                  </h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <strong>Estado:</strong> {formData.estado}
                    </div>
                    <div className="summary-item">
                      <strong>Ciudad:</strong> {formData.ciudad}
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button onClick={handleBack} className="btn btn--ghost">
                    ← Atrás
                  </button>
                  <button
                    onClick={handleNext}
                    className="btn btn--primary btn--lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Enviando..." : "Enviar solicitud"}{" "}
                    {!isSubmitting && (
                      <span className="icon" style={{ fontSize: "20px" }}>
                        send
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Confirmación */}
            {currentStep === 5 && (
              <div className="confirm-content">
                <div className="confirm__icon">
                  <span className="icon">check_circle</span>
                </div>
                <h1 className="confirm__title">
                  ¡Tu solicitud fue enviada exitosamente!
                </h1>
                <p className="confirm__solicitud">
                  Número de solicitud: <strong>{solicitudNum}</strong>
                </p>
                <p className="confirm__desc">
                  Hemos recibido tu solicitud y la estamos revisando. Recibirás
                  un correo de confirmación en los próximos minutos en el correo
                  que registraste.
                </p>

                {/* Timeline */}
                <div className="timeline2">
                  <h4>Próximos pasos</h4>
                  <div className="timeline2__item">
                    <div className="timeline2__dot timeline2__dot--done">
                      <span className="icon" style={{ fontSize: "16px" }}>
                        check
                      </span>
                    </div>
                    <div className="timeline2__content">
                      <div className="timeline2__day">Hoy</div>
                      <div className="timeline2__text">
                        Solicitud recibida — en revisión
                      </div>
                    </div>
                  </div>
                  <div className="timeline2__item">
                    <div className="timeline2__dot timeline2__dot--pending"></div>
                    <div className="timeline2__content">
                      <div className="timeline2__day">Días 1-2</div>
                      <div className="timeline2__text">
                        Verificación de documentos
                      </div>
                    </div>
                  </div>
                  <div className="timeline2__item">
                    <div className="timeline2__dot timeline2__dot--pending"></div>
                    <div className="timeline2__content">
                      <div className="timeline2__day">Días 3-4</div>
                      <div className="timeline2__text">
                        Verificación de antecedentes
                      </div>
                    </div>
                  </div>
                  <div className="timeline2__item">
                    <div className="timeline2__dot timeline2__dot--pending"></div>
                    <div className="timeline2__content">
                      <div className="timeline2__day">Días 5-6</div>
                      <div className="timeline2__text">
                        Entrenamiento online
                      </div>
                    </div>
                  </div>
                  <div className="timeline2__item">
                    <div className="timeline2__dot timeline2__dot--pending"></div>
                    <div className="timeline2__content">
                      <div className="timeline2__day">Día 7</div>
                      <div className="timeline2__text">¡Primera entrega!</div>
                    </div>
                  </div>
                </div>

                {/* Info cards */}
                <div className="info-cards">
                  <div className="info-card">
                    <div className="info-card__icon">
                      <span className="icon">mail</span>
                    </div>
                    <h5>Revisa tu correo</h5>
                    <p>
                      Te enviamos instrucciones detalladas a tu correo
                      registrado
                    </p>
                  </div>
                  <div className="info-card">
                    <div className="info-card__icon">
                      <span className="icon">phone_android</span>
                    </div>
                    <h5>Descarga la app</h5>
                    <p>
                      Mientras tanto, descarga la app SPIDI para estar listo
                    </p>
                    <div className="app-badges">
                      <span className="app-badge">
                        <span className="icon">apple</span> App Store
                      </span>
                      <span className="app-badge">
                        <span className="icon">shop</span> Google Play
                      </span>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-card__icon">
                      <span className="icon">support_agent</span>
                    </div>
                    <h5>¿Tienes dudas?</h5>
                    <p>Estamos disponibles de Lun-Sab 8am-8pm</p>
                    <button
                      className="btn btn--secondary"
                      style={{
                        fontSize: "13px",
                        padding: "8px 16px",
                        borderRadius: "50px",
                        marginTop: "12px",
                      }}
                    >
                      <span className="icon" style={{ fontSize: "16px" }}>
                        chat
                      </span>{" "}
                      Chatear con soporte
                    </button>
                  </div>
                </div>

                {/* CTA */}
                <div className="confirm__cta">
                  <Link href="/" className="btn btn--secondary btn--lg">
                    <span className="icon" style={{ fontSize: "20px" }}>
                      home
                    </span>{" "}
                    Volver al inicio
                  </Link>
                </div>
              </div>
            )}
          </div>

          {currentStep < 5 && (
            <div className="form-actions__note">
              <span className="icon">lock</span>
              Tu información está protegida con encriptación SSL
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="reg-footer">
        <span>© 2026 SPIDI Inc.</span>
        <a href="#">Términos</a>
        <a href="#">Privacidad</a>
      </footer>
    </div>
  );
}
