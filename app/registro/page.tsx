"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import "../landing.css"  
import "./registro.css"

// Ubicaciones HEB / Mi Tienda
const CIUDADES_POR_ESTADO: Record<string, string[]> = {
  'Aguascalientes': ['Aguascalientes'],
  'Coahuila': ['Piedras Negras', 'Saltillo', 'Torreón'],
  'Guanajuato': ['León'],
  'Nuevo León': ['Apodaca', 'Escobedo', 'García', 'Guadalupe', 'Juárez', 'Monterrey', 'Pesquería', 'San Nicolás de los Garza', 'San Pedro Garza García', 'Santa Catarina'],
  'Querétaro': ['Querétaro'],
  'San Luis Potosí': ['San Luis Potosí'],
  'Tamaulipas': ['Matamoros', 'Nuevo Laredo', 'Reynosa', 'Tampico'],
}

type FieldConfig = {
  id: string
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (val: string) => boolean
  transform?: (val: string) => string
  type?: 'text' | 'select'
  msg: string
}

const yearValidator = (val: string) => {
  const n = parseInt(val, 10)
  return n >= 1990 && n <= 2026
}

const FIELDS: FieldConfig[] = [
  { id: 'firstName', required: true, min: 2, max: 100, msg: 'Ingresa tu primer nombre' },
  { id: 'middleName', required: false, min: 0, max: 100, msg: 'Ingresa tu segundo nombre' },
  { id: 'paternalSurname', required: true, min: 2, max: 100, msg: 'Ingresa tu apellido paterno' },
  { id: 'maternalSurname', required: false, min: 0, max: 100, msg: 'Ingresa tu apellido materno' },
  { id: 'telefono', required: true, pattern: /^\d{10}$/, msg: 'Ingresa 10 dígitos' },
  { id: 'email', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, max: 255, msg: 'Ingresa un correo válido' },
  { id: 'marca', required: true, min: 2, max: 30, msg: 'Ingresa la marca del vehículo' },
  { id: 'modelo', required: true, min: 1, max: 50, msg: 'Ingresa el modelo del vehículo' },
  { id: 'anio', required: true, pattern: /^\d{4}$/, custom: yearValidator, msg: 'Ingresa un año válido (1990–2026)' },
  { id: 'placas', required: true, min: 2, max: 10, transform: (v) => v.toUpperCase(), msg: 'Ingresa las placas del vehículo' },
  { id: 'color', required: true, min: 2, max: 30, msg: 'Ingresa el color del vehículo' },
  { id: 'estado', required: true, type: 'select', msg: 'Selecciona un estado' },
  { id: 'ciudad', required: true, type: 'select', msg: 'Selecciona una ciudad' },
  { id: 'comoTeEnteraste', required: true, type: 'select', msg: 'Selecciona una opción' },
]

type FormData = {
  firstName: string
  middleName: string
  paternalSurname: string
  maternalSurname: string
  telefono: string
  email: string
  marca: string
  modelo: string
  anio: string
  placas: string
  color: string
  estado: string
  ciudad: string
  comoTeEnteraste: string
}

export default function RegistroWizardPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [solicitudNum, setSolicitudNum] = useState('')
  
  const [formData, setFormData] = useState<FormData>({
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
    comoTeEnteraste: ""
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validFields, setValidFields] = useState<Set<string>>(new Set())
  const [ciudades, setCiudades] = useState<string[]>([])
  
  // OTP States
  const [phoneOtp, setPhoneOtp] = useState(['', '', '', '', '', ''])
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', ''])
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneOtpError, setPhoneOtpError] = useState('')
  const [emailOtpError, setEmailOtpError] = useState('')
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(600) // 10 min
  const [emailOtpTimer, setEmailOtpTimer] = useState(600)
  const [phoneResendCount, setPhoneResendCount] = useState(0)
  const [emailResendCount, setEmailResendCount] = useState(0)
  
  const phoneOtpRefs = useRef<(HTMLInputElement | null)[]>([])
  const emailOtpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Cargar datos desde localStorage
  useEffect(() => {
    const cachedData = localStorage.getItem('spidi_registro_cache')
    const cachedVerification = localStorage.getItem('spidi_verification_state')
    
    if (cachedData) {
      try {
        const { data, timestamp } = JSON.parse(cachedData)
        const now = Date.now()
        const twentyFourHours = 24 * 60 * 60 * 1000
        
        if (now - timestamp < twentyFourHours) {
          // Hacer merge con valores por defecto para evitar undefined
          // Ensuring all values are strings, never undefined
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
            comoTeEnteraste: String(data.comoTeEnteraste ?? "")
          })
          if (data.estado) {
            setCiudades(CIUDADES_POR_ESTADO[data.estado] || [])
          }
          
          // Restaurar estado de verificación solo si los datos coinciden
          if (cachedVerification) {
            try {
              const verificationState = JSON.parse(cachedVerification)
              if (verificationState.telefono === data.telefono && verificationState.phoneVerified) {
                setPhoneVerified(true)
                setPhoneOtpSent(true)
              }
              if (verificationState.email === data.email && verificationState.emailVerified) {
                setEmailVerified(true)
                setEmailOtpSent(true)
              }
            } catch (e) {
              console.error('Error loading verification state:', e)
            }
          }
        } else {
          localStorage.removeItem('spidi_registro_cache')
          localStorage.removeItem('spidi_verification_state')
        }
      } catch (e) {
        console.error('Error loading cached data:', e)
      }
    }
  }, [])

  // Timer countdown para phone OTP
  useEffect(() => {
    if (phoneOtpSent && phoneOtpTimer > 0 && !phoneVerified) {
      const interval = setInterval(() => {
        setPhoneOtpTimer(prev => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [phoneOtpSent, phoneOtpTimer, phoneVerified])

  // Timer countdown para email OTP
  useEffect(() => {
    if (emailOtpSent && emailOtpTimer > 0 && !emailVerified) {
      const interval = setInterval(() => {
        setEmailOtpTimer(prev => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [emailOtpSent, emailOtpTimer, emailVerified])

  const validateField = (id: string, value?: string) => {
    const cfg = FIELDS.find(f => f.id === id)
    if (!cfg) return true

    let val = value !== undefined ? value : formData[id as keyof FormData]
    // Ensuring val is always a string, never undefined or null
    val = String(val ?? "").trim()

    let err: string | null = null

    if (cfg.required && !val) {
      err = cfg.msg
    } else if (val) {
      if (cfg.min && val.length < cfg.min) err = cfg.msg
      if (cfg.max && val.length > cfg.max) err = cfg.msg
      if (cfg.pattern && !cfg.pattern.test(val)) err = cfg.msg
      if (cfg.custom && !cfg.custom(val)) err = cfg.msg
      if (cfg.type === 'select' && !val) err = cfg.msg
    }

    setErrors(prev => {
      const newErrors = { ...prev }
      if (err) {
        newErrors[id] = err
      } else {
        delete newErrors[id]
      }
      return newErrors
    })

    setValidFields(prev => {
      const newSet = new Set(prev)
      if (!err && val) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })

    return !err
  }

  const handleInputChange = (id: string, value: string) => {
    const cfg = FIELDS.find(f => f.id === id)
    let newValue = value ?? ""

    if (cfg?.transform) {
      newValue = cfg.transform(newValue)
    }

    // Detectar cambio en teléfono - invalidar verificación si ya estaba verificado
    if (id === 'telefono' && formData.telefono !== newValue) {
      if (phoneVerified || phoneOtpSent) {
        setPhoneVerified(false)
        setPhoneOtpSent(false)
        setPhoneOtp(['', '', '', '', '', ''])
        setPhoneOtpError('')
        setPhoneOtpTimer(600)
        setPhoneResendCount(0)
        
        // Limpiar estado de verificación en localStorage
        localStorage.removeItem('spidi_verification_state')
      }
    }

    // Detectar cambio en email - invalidar verificación si ya estaba verificado
    if (id === 'email' && formData.email !== newValue) {
      if (emailVerified || emailOtpSent) {
        setEmailVerified(false)
        setEmailOtpSent(false)
        setEmailOtp(['', '', '', '', '', ''])
        setEmailOtpError('')
        setEmailOtpTimer(600)
        setEmailResendCount(0)
        
        // Limpiar estado de verificación en localStorage
        localStorage.removeItem('spidi_verification_state')
      }
    }

    const updatedData = { ...formData, [id]: newValue ?? "" }
    setFormData(updatedData)

    localStorage.setItem('spidi_registro_cache', JSON.stringify({
      data: updatedData,
      timestamp: Date.now()
    }))

    if (errors[id]) {
      validateField(id, newValue)
    }
  }

  const handleBlur = (id: string) => {
    validateField(id)
  }

  const handleEstadoChange = (estado: string) => {
    const safeEstado = estado ?? ""
    const updatedData = { ...formData, estado: safeEstado, ciudad: "" }
    setFormData(updatedData)
    setCiudades(CIUDADES_POR_ESTADO[safeEstado] || [])
    
    localStorage.setItem('spidi_registro_cache', JSON.stringify({
      data: updatedData,
      timestamp: Date.now()
    }))
    
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.estado
      delete newErrors.ciudad
      return newErrors
    })
    
    validateField('estado', estado)
  }

  const validateAllStep1 = () => {
    const newErrors: Record<string, string> = {}
    let firstErrorField: string | null = null

    FIELDS.forEach(f => {
      if (!validateField(f.id)) {
        if (!firstErrorField) firstErrorField = f.id
      }
    })

    return firstErrorField === null
  }

  // OTP Handlers
  const handlePhoneOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    
    const newOtp = [...phoneOtp]
    newOtp[index] = value.slice(-1)
    setPhoneOtp(newOtp)
    setPhoneOtpError('')
    
    if (value && index < 5) {
      phoneOtpRefs.current[index + 1]?.focus()
    }

    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      verifyPhoneOtp(newOtp.join(''))
    }
  }

  const handleEmailOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    
    const newOtp = [...emailOtp]
    newOtp[index] = value.slice(-1)
    setEmailOtp(newOtp)
    setEmailOtpError('')
    
    if (value && index < 5) {
      emailOtpRefs.current[index + 1]?.focus()
    }

    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      verifyEmailOtp(newOtp.join(''))
    }
  }

  const handlePhoneOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !phoneOtp[index] && index > 0) {
      phoneOtpRefs.current[index - 1]?.focus()
    }
  }

  const handleEmailOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !emailOtp[index] && index > 0) {
      emailOtpRefs.current[index - 1]?.focus()
    }
  }

  const sendPhoneOtp = async () => {
    // Simular envío de OTP
    setPhoneOtpSent(true)
    setPhoneOtpTimer(600)
    console.log('OTP enviado a:', formData.telefono)
    // TODO: Implementar llamada real a API
  }

  const sendEmailOtp = async () => {
    // Simular envío de OTP
    setEmailOtpSent(true)
    setEmailOtpTimer(600)
    console.log('OTP enviado a:', formData.email)
    // TODO: Implementar llamada real a API
  }

  const verifyPhoneOtp = async (code: string) => {
    // Simular verificación (en producción, validar con backend)
    setTimeout(() => {
      if (code === '123456') {
        setPhoneVerified(true)
        setPhoneOtpError('')
        
        // Guardar estado de verificación en localStorage
        const verificationState = {
          telefono: formData.telefono,
          email: formData.email,
          phoneVerified: true,
          emailVerified: emailVerified
        }
        localStorage.setItem('spidi_verification_state', JSON.stringify(verificationState))
      } else {
        setPhoneOtpError('Código incorrecto. Intenta nuevamente.')
        setPhoneOtp(['', '', '', '', '', ''])
        phoneOtpRefs.current[0]?.focus()
      }
    }, 500)
  }

  const verifyEmailOtp = async (code: string) => {
    // Simular verificación (en producción, validar con backend)
    setTimeout(() => {
      if (code === '123456') {
        setEmailVerified(true)
        setEmailOtpError('')
        
        // Guardar estado de verificación en localStorage
        const verificationState = {
          telefono: formData.telefono,
          email: formData.email,
          phoneVerified: phoneVerified,
          emailVerified: true
        }
        localStorage.setItem('spidi_verification_state', JSON.stringify(verificationState))
      } else {
        setEmailOtpError('Código incorrecto. Intenta nuevamente.')
        setEmailOtp(['', '', '', '', '', ''])
        emailOtpRefs.current[0]?.focus()
      }
    }, 500)
  }

  const resendPhoneOtp = () => {
    if (phoneResendCount >= 1) {
      alert('Ya usaste tu reenvío. Contacta a soporte si necesitas ayuda.')
      return
    }
    setPhoneResendCount(prev => prev + 1)
    sendPhoneOtp()
  }

  const resendEmailOtp = () => {
    if (emailResendCount >= 1) {
      alert('Ya usaste tu reenvío. Contacta a soporte si necesitas ayuda.')
      return
    }
    setEmailResendCount(prev => prev + 1)
    sendEmailOtp()
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateAllStep1()) {
        setCurrentStep(2)
      } else {
        const firstError = FIELDS.find(f => !validateField(f.id))
        if (firstError) {
          const el = document.getElementById(firstError.id)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.focus()
          }
        }
      }
    } else if (currentStep === 2) {
      if (phoneVerified) {
        setCurrentStep(3)
      }
    } else if (currentStep === 3) {
      if (emailVerified) {
        setCurrentStep(4)
      }
    } else if (currentStep === 4) {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Simular envío
    setTimeout(() => {
      const num = Math.floor(Math.random() * 9000 + 1000)
      setSolicitudNum(`SPD-2026-${String(num).padStart(6, '0')}`)
      setCurrentStep(5) // Ir a confirmación
      setIsSubmitting(false)
      
      // Limpiar cache y estado de verificación
      localStorage.removeItem('spidi_registro_cache')
      localStorage.removeItem('spidi_verification_state')
    }, 2000)
    
    // TODO: Implementar llamada real a API
    console.log('Enviando formulario:', formData)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStepTitle = () => {
    switch(currentStep) {
      case 1: return 'Cuéntanos sobre ti'
      case 2: return 'Verifica tu teléfono'
      case 3: return 'Verifica tu email'
      case 4: return 'Confirma tu información'
      case 5: return '¡Registro exitoso!'
      default: return ''
    }
  }

  const getStepDescription = () => {
    switch(currentStep) {
      case 1: return 'Solo toma 2 minutos. Completa tus datos y verificaremos tu correo y teléfono.'
      case 2: return phoneOtpSent 
        ? `Se envió un código de 6 dígitos por SMS al <strong>${formData.telefono}</strong>`
        : `Se enviará un código de 6 dígitos por SMS al <strong>${formData.telefono}</strong>`
      case 3: return emailOtpSent
        ? `Se envió un código de 6 dígitos al correo <strong>${formData.email}</strong>`
        : `Se enviará un código de 6 dígitos al correo <strong>${formData.email}</strong>`
      case 4: return 'Revisa tu información antes de enviar'
      case 5: return `Tu número de solicitud es: <strong>${solicitudNum}</strong>`
      default: return ''
    }
  }

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
        <p className="reg-header__subtitle">Completa el formulario y comienza a generar ingresos</p>
      </header>

      {/* Form Container */}
      <div className="reg-container">
        <div className="reg-card">
          {/* Progress Steps */}
          {currentStep < 5 && (
            <div className="verify-steps">
              <div className={`verify-step ${currentStep === 1 ? 'active' : currentStep > 1 ? 'done' : ''}`}>
                <span className="icon">{currentStep > 1 ? 'check' : 'assignment'}</span>
                <span>Datos</span>
              </div>
              <span className="verify-step-divider">→</span>
              <div className={`verify-step ${currentStep === 2 ? 'active' : currentStep > 2 ? 'done' : ''}`}>
                <span className="icon">{currentStep > 2 ? 'check' : 'phone_iphone'}</span>
                <span>SMS</span>
              </div>
              <span className="verify-step-divider">→</span>
              <div className={`verify-step ${currentStep === 3 ? 'active' : currentStep > 3 ? 'done' : ''}`}>
                <span className="icon">{currentStep > 3 ? 'check' : 'email'}</span>
                <span>Email</span>
              </div>
              <span className="verify-step-divider">→</span>
              <div className={`verify-step ${currentStep === 4 ? 'active' : ''}`}>
                <span className="icon">send</span>
                <span>Enviar</span>
              </div>
            </div>
          )}

          {/* Card Header */}
          <div className="reg-card__header">
            <div className="reg-card__icon">
              <span className="icon">
                {currentStep === 1 && 'person_add'}
                {currentStep === 2 && 'phone_iphone'}
                {currentStep === 3 && 'email'}
                {currentStep === 4 && 'fact_check'}
                {currentStep === 5 && 'check_circle'}
              </span>
            </div>
            <h2 className="reg-card__title">{getStepTitle()}</h2>
            <p 
              className="reg-card__desc" 
              dangerouslySetInnerHTML={{ __html: getStepDescription() }}
            />
            {currentStep === 1 && (
              <div className="reg-card__benefits">
                <span className="reg-card__benefit"><span className="icon">check_circle</span> 100% en línea</span>
                <span className="reg-card__benefit"><span className="icon">check_circle</span> Sin costo</span>
                <span className="reg-card__benefit"><span className="icon">check_circle</span> Respuesta en 24-48h</span>
              </div>
            )}
          </div>

          {/* Step Content */}
          <div className="wizard-content">
            {/* STEP 1: Datos Básicos */}
            {currentStep === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} noValidate>
                {/* Datos personales */}
                <div className="form-section">
                  <h3 className="form-section__title">Datos personales</h3>
                  <div className="form-group__row">
                    <div className={`form-group ${errors.firstName ? 'form-group--error' : ''} ${validFields.has('firstName') && !errors.firstName ? 'form-group--success' : ''}`}>
                      <label className="form-group__label" htmlFor="firstName">Primer nombre<span className="req">*</span></label>
                      <input 
                        className="form-input" 
                        type="text" 
                        id="firstName" 
                        placeholder="Ej. Juan" 
                        maxLength={100}
                        autoComplete="given-name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        onBlur={() => handleBlur('firstName')}
                      />
                      {errors.firstName && <div className="form-group__error"><span className="icon">error</span><span>{errors.firstName}</span></div>}
                    </div>
                    <div className={`form-group ${errors.middleName ? 'form-group--error' : ''} ${validFields.has('middleName') && !errors.middleName ? 'form-group--success' : ''}`}>
                      <label className="form-group__label" htmlFor="middleName">Segundo nombre</label>
                      <input 
                        className="form-input" 
                        type="text" 
                        id="middleName" 
                        placeholder="Ej. Carlos (opcional)" 
                        maxLength={100}
                        autoComplete="additional-name"
                        value={formData.middleName}
                        onChange={(e) => handleInputChange('middleName', e.target.value)}
                        onBlur={() => handleBlur('middleName')}
                      />
                      {errors.middleName && <div className="form-group__error"><span className="icon">error</span><span>{errors.middleName}</span></div>}
                    </div>
                  </div>
                  <div className="form-group__row">
                    <div className={`form-group ${errors.paternalSurname ? 'form-group--error' : ''} ${validFields.has('paternalSurname') && !errors.paternalSurname ? 'form-group--success' : ''}`}>
                      <label className="form-group__label" htmlFor="paternalSurname">Apellido paterno<span className="req">*</span></label>
                      <input 
                        className="form-input" 
                        type="text" 
                        id="paternalSurname" 
                        placeholder="Ej. García" 
                        maxLength={100}
                        autoComplete="family-name"
                        value={formData.paternalSurname}
                        onChange={(e) => handleInputChange('paternalSurname', e.target.value)}
                        onBlur={() => handleBlur('paternalSurname')}
                      />
                      {errors.paternalSurname && <div className="form-group__error"><span className="icon">error</span><span>{errors.paternalSurname}</span></div>}
                    </div>
                    <div className={`form-group ${errors.maternalSurname ? 'form-group--error' : ''} ${validFields.has('maternalSurname') && !errors.maternalSurname ? 'form-group--success' : ''}`}>
                      <label className="form-group__label" htmlFor="maternalSurname">Apellido materno</label>
                      <input 
                        className="form-input" 
                        type="text" 
                        id="maternalSurname" 
                        placeholder="Ej. López (opcional)" 
                        maxLength={100}
                        autoComplete="additional-name"
                        value={formData.maternalSurname}
                        onChange={(e) => handleInputChange('maternalSurname', e.target.value)}
                        onBlur={() => handleBlur('maternalSurname')}
                      />
                      {errors.maternalSurname && <div className="form-group__error"><span className="icon">error</span><span>{errors.maternalSurname}</span></div>}
                    </div>
                  </div>
                </div>

                {/* Contacto */}
                <div className="form-section">
                  <h3 className="form-section__title">Contacto</h3>
                  <div className="form-group__row">
                    <div className={`form-group ${errors.telefono ? 'form-group--error' : ''} ${validFields.has('telefono') && !errors.telefono ? 'form-group--success' : ''}`}>
                      <label className="form-group__label" htmlFor="telefono">Teléfono celular<span className="req">*</span></label>
                      <input 
                        className="form-input" 
                        type="tel" 
                        id="telefono" 
                        placeholder="10 dígitos" 
                        maxLength={10}
                        autoComplete="tel"
                        inputMode="numeric"
                        value={formData.telefono}
                        onChange={(e) => handleInputChange('telefono', e.target.value.replace(/\D/g, ''))}
                        onBlur={() => handleBlur('telefono')}
                      />
                      {errors.telefono && <div className="form-group__error"><span className="icon">error</span><span>{errors.telefono}</span></div>}
                    </div>
                    <div className={`form-group ${errors.email ? 'form-group--error' : ''} ${validFields.has('email') && !errors.email ? 'form-group--success' : ''}`}>
                      <label className="form-group__label" htmlFor="email">Correo electrónico<span className="req">*</span></label>
                      <input 
                        className="form-input" 
                        type="email" 
                        id="email" 
                        placeholder="tu@correo.com" 
                        maxLength={255}
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                      />
                      {errors.email && <div className="form-group__error"><span className="icon">error</span><span>{errors.email}</span></div>}
                    </div>
                  </div>
                </div>

                {/* Datos del vehículo */}
                <div className="form-section">
                  <h3 className="form-section__title">Datos del vehículo</h3>
                  <div className="form-group__row">
                    <div className={`form-group ${errors.marca ? 'form-group--error' : ''} ${validFields.has('marca') && !errors.marca ? 'form-group--success' : ''}`}>
                      <label className="form-group__label" htmlFor="marca">Marca<span className="req">*</span></label>
                      <input 
                        className="form-input" 
                        type="text" 
                        id="marca" 
                        placeholder="Ej. Toyota" 
                        maxLength={30}
                        value={formData.marca}
                        onChange={(e) => handleInputChange('marca', e.target.value)}
                        onBlur={() => handleBlur('marca')}
                      />
                      {errors.marca && <div className="form-group__error"><span className="icon">error</span><span>{errors.marca}</span></div>}
                    </div>
                    <div className={`form-group ${errors.modelo ? 'form-group--error' : ''} ${validFields.has('modelo') && !errors.modelo ? 'form-group--success' : ''}`}>
                      <label className="form-group__label" htmlFor="modelo">Modelo<span className="req">*</span></label>
                      <input 
                        className="form-input" 
                        type="text" 
                        id="modelo" 
                        placeholder="Ej. Corolla" 
                        maxLength={50}
                        value={formData.modelo}
                        onChange={(e) => handleInputChange('modelo', e.target.value)}
                        onBlur={() => handleBlur('modelo')}
                      />
                      {errors.modelo && <div className="form-group__error"><span className="icon">error</span><span>{errors.modelo}</span></div>}
                    </div>
                  </div>
                  <div className="form-group__row">
                    <div className={`form-group ${errors.anio ? 'form-group--error' : ''} ${validFields.has('anio') && !errors.anio ? 'form-group--success' : ''}`}>
                      <label className="form-group__label" htmlFor="anio">Año<span className="req">*</span></label>
                      <input 
                        className="form-input" 
                        type="text" 
                        id="anio" 
                        placeholder="Ej. 2020" 
                        maxLength={4}
                        inputMode="numeric"
                        value={formData.anio}
                        onChange={(e) => handleInputChange('anio', e.target.value.replace(/\D/g, ''))}
                        onBlur={() => handleBlur('anio')}
                      />
                      {errors.anio && <div className="form-group__error"><span className="icon">error</span><span>{errors.anio}</span></div>}
                    </div>
                    <div className={`form-group ${errors.placas ? 'form-group--error' : ''} ${validFields.has('placas') && !errors.placas ? 'form-group--success' : ''}`}>
                      <label className="form-group__label" htmlFor="placas">Placas<span className="req">*</span></label>
                      <input 
                        className="form-input" 
                        type="text" 
                        id="placas" 
                        placeholder="Ej. ABC1234" 
                        maxLength={10}
                        style={{textTransform:'uppercase'}}
                        value={formData.placas}
                        onChange={(e) => handleInputChange('placas', e.target.value)}
                        onBlur={() => handleBlur('placas')}
                      />
                      {errors.placas && <div className="form-group__error"><span className="icon">error</span><span>{errors.placas}</span></div>}
                    </div>
                  </div>
                  <div className={`form-group ${errors.color ? 'form-group--error' : ''} ${validFields.has('color') && !errors.color ? 'form-group--success' : ''}`}>
                    <label className="form-group__label" htmlFor="color">Color<span className="req">*</span></label>
                    <input 
                      className="form-input" 
                      type="text" 
                      id="color" 
                      placeholder="Ej. Blanco" 
                      maxLength={30}
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      onBlur={() => handleBlur('color')}
                    />
                    {errors.color && <div className="form-group__error"><span className="icon">error</span><span>{errors.color}</span></div>}
                  </div>
                </div>

                {/* Ubicación */}
                <div className="form-section">
                  <h3 className="form-section__title">Ubicación</h3>
                  <div className="form-group__row">
                    <div className={`form-group ${errors.estado ? 'form-group--error' : ''} ${validFields.has('estado') && !errors.estado ? 'form-group--success' : ''}`}>
                      <label className="form-group__label" htmlFor="estado">Estado<span className="req">*</span></label>
                      <select 
                        className="form-select" 
                        id="estado"
                        value={formData.estado}
                        onChange={(e) => handleEstadoChange(e.target.value)}
                      >
                        <option value="">Selecciona un estado</option>
                        <option>Aguascalientes</option>
                        <option>Coahuila</option>
                        <option>Guanajuato</option>
                        <option>Nuevo León</option>
                        <option>Querétaro</option>
                        <option>San Luis Potosí</option>
                        <option>Tamaulipas</option>
                      </select>
                      {errors.estado && <div className="form-group__error"><span className="icon">error</span><span>{errors.estado}</span></div>}
                    </div>
                    <div className={`form-group ${errors.ciudad ? 'form-group--error' : ''} ${validFields.has('ciudad') && !errors.ciudad ? 'form-group--success' : ''}`}>
                      <label className="form-group__label" htmlFor="ciudad">Ciudad / Municipio<span className="req">*</span></label>
                      <select 
                        className="form-select" 
                        id="ciudad"
                        value={formData.ciudad}
                        onChange={(e) => {
                          handleInputChange('ciudad', e.target.value)
                          validateField('ciudad', e.target.value)
                        }}
                        disabled={!formData.estado}
                      >
                        <option value="">{formData.estado ? 'Selecciona una ciudad' : 'Primero selecciona un estado'}</option>
                        {ciudades.map(ciudad => (
                          <option key={ciudad}>{ciudad}</option>
                        ))}
                      </select>
                      {errors.ciudad && <div className="form-group__error"><span className="icon">error</span><span>{errors.ciudad}</span></div>}
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="form-section">
                  <h3 className="form-section__title">Información adicional</h3>
                  <div className={`form-group ${errors.comoTeEnteraste ? 'form-group--error' : ''} ${validFields.has('comoTeEnteraste') && !errors.comoTeEnteraste ? 'form-group--success' : ''}`}>
                    <label className="form-group__label" htmlFor="comoTeEnteraste">¿Cómo te enteraste de SPIDI?<span className="req">*</span></label>
                    <select 
                      className="form-select" 
                      id="comoTeEnteraste"
                      value={formData.comoTeEnteraste}
                      onChange={(e) => {
                        handleInputChange('comoTeEnteraste', e.target.value)
                        validateField('comoTeEnteraste', e.target.value)
                      }}
                    >
                      <option value="">Selecciona una opción</option>
                      <option>Redes sociales</option>
                      <option>Recomendación de amigo o familiar</option>
                      <option>Búsqueda en internet</option>
                      <option>Volante o cartel</option>
                      <option>Otro</option>
                    </select>
                    {errors.comoTeEnteraste && <div className="form-group__error"><span className="icon">error</span><span>{errors.comoTeEnteraste}</span></div>}
                  </div>
                </div>

                <div className="form-actions">
                  <Link href="/" className="btn btn--ghost">← Cancelar</Link>
                  <button type="submit" className="btn btn--primary btn--lg">
                    Siguiente <span className="icon" style={{fontSize: "20px"}}>arrow_forward</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Validación SMS */}
            {currentStep === 2 && (
              <div className="verify-content">
                {!phoneOtpSent ? (
                  <button onClick={sendPhoneOtp} className="btn btn--primary btn--lg btn--full">
                    Enviar código por SMS
                  </button>
                ) : !phoneVerified ? (
                  <>
                    <div className="otp-group">
                      {phoneOtp.map((digit, index) => (
                        <input
                          key={index}
                          ref={el => { phoneOtpRefs.current[index] = el }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className={`otp-input ${phoneOtpError ? 'error' : ''}`}
                          value={digit}
                          onChange={(e) => handlePhoneOtpChange(index, e.target.value)}
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
                      Expira en {formatTime(phoneOtpTimer)} • {' '}
                      <button 
                        onClick={resendPhoneOtp} 
                        disabled={phoneOtpTimer > 0 || phoneResendCount >= 1}
                      >
                        Reenviar código
                      </button>
                    </div>
                    {phoneResendCount >= 1 && (
                      <p style={{textAlign: 'center', fontSize: '13px', color: '#E1251B', marginTop: '12px'}}>
                        Ya usaste tu reenvío. Contacta a soporte si necesitas ayuda.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="verify-success">
                    <div className="verify-icon" style={{background: '#E6F4ED'}}>
                      <span className="icon" style={{color: '#1A7F4B', fontSize: '48px'}}>check_circle</span>
                    </div>
                    <p style={{textAlign: 'center', color: '#1A7F4B', fontWeight: 600, marginTop: '16px'}}>
                      ✓ Teléfono verificado correctamente
                    </p>
                  </div>
                )}
                <div className="form-actions" style={{marginTop: '32px'}}>
                  <button onClick={handleBack} className="btn btn--ghost">← Atrás</button>
                  <button 
                    onClick={handleNext} 
                    className="btn btn--primary btn--lg"
                    disabled={!phoneVerified}
                  >
                    Siguiente <span className="icon" style={{fontSize: "20px"}}>arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Validación Email */}
            {currentStep === 3 && (
              <div className="verify-content">
                {!emailOtpSent ? (
                  <button onClick={sendEmailOtp} className="btn btn--primary btn--lg btn--full">
                    Enviar código por email
                  </button>
                ) : !emailVerified ? (
                  <>
                    <div className="otp-group">
                      {emailOtp.map((digit, index) => (
                        <input
                          key={index}
                          ref={el => { emailOtpRefs.current[index] = el }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className={`otp-input ${emailOtpError ? 'error' : ''}`}
                          value={digit}
                          onChange={(e) => handleEmailOtpChange(index, e.target.value)}
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
                      Expira en {formatTime(emailOtpTimer)} • {' '}
                      <button 
                        onClick={resendEmailOtp} 
                        disabled={emailOtpTimer > 0 || emailResendCount >= 1}
                      >
                        Reenviar código
                      </button>
                    </div>
                    {emailResendCount >= 1 && (
                      <p style={{textAlign: 'center', fontSize: '13px', color: '#E1251B', marginTop: '12px'}}>
                        Ya usaste tu reenvío. Contacta a soporte si necesitas ayuda.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="verify-success">
                    <div className="verify-icon" style={{background: '#E6F4ED'}}>
                      <span className="icon" style={{color: '#1A7F4B', fontSize: '48px'}}>check_circle</span>
                    </div>
                    <p style={{textAlign: 'center', color: '#1A7F4B', fontWeight: 600, marginTop: '16px'}}>
                      ✓ Email verificado correctamente
                    </p>
                  </div>
                )}
                <div className="form-actions" style={{marginTop: '32px'}}>
                  <button onClick={handleBack} className="btn btn--ghost">← Atrás</button>
                  <button 
                    onClick={handleNext} 
                    className="btn btn--primary btn--lg"
                    disabled={!emailVerified}
                  >
                    Siguiente <span className="icon" style={{fontSize: "20px"}}>arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Resumen */}
            {currentStep === 4 && (
              <div className="summary-content">
                <div className="form-section">
                  <h3 className="form-section__title">Tus datos personales</h3>
                  <div className="summary-item" style={{marginBottom: '16px'}}>
                    <strong>Nombre completo:</strong> {formData.firstName} {formData.middleName} {formData.paternalSurname} {formData.maternalSurname}
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
                  <div className="summary-item" style={{marginTop: '8px'}}>
                    <strong>Placas:</strong> {formData.placas}
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="form-section__title">Zona de trabajo deseada</h3>
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
                  <button onClick={handleBack} className="btn btn--ghost">← Atrás</button>
                  <button 
                    onClick={handleNext} 
                    className="btn btn--primary btn--lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar solicitud'} {!isSubmitting && <span className="icon" style={{fontSize: "20px"}}>send</span>}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Confirmación */}
            {currentStep === 5 && (
              <div className="confirm-content">
                <div className="verify-icon" style={{background: '#E6F4ED', width: '80px', height: '80px', margin: '0 auto 24px'}}>
                  <span className="icon" style={{color: '#1A7F4B', fontSize: '64px'}}>check_circle</span>
                </div>
                <div style={{textAlign: 'center', maxWidth: '400px', margin: '0 auto'}}>
                  <p style={{fontSize: '16px', color: '#2A3545', marginBottom: '16px'}}>
                    Recibirás un correo de confirmación en <strong>{formData.email}</strong> con los próximos pasos.
                  </p>
                  <p style={{fontSize: '14px', color: '#5C6E84', marginBottom: '32px'}}>
                    Nuestro equipo revisará tu solicitud en las próximas <strong>24-48 horas</strong>.
                  </p>
                  <Link href="/" className="btn btn--primary btn--lg btn--full">
                    Regresar al inicio
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
  )
}

function SpidiLogo() {
  return (
    <svg width="607" height="325" viewBox="0 0 607 325" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M108.405 19.2979C123.111 17.756 141.489 22.8443 152.023 33.5297C167.375 49.1028 166.088 71.5854 163.577 91.6318C162.253 102.199 161.799 112.852 153.579 120.618C143.972 130.042 124.91 129.856 115.609 120.002C105.772 109.499 112.685 93.5137 113.424 80.9867C113.65 77.1447 115.308 67.1779 108.792 67.0666C103.274 66.9723 100.542 74.6153 99.806 79.213C97.7704 91.9239 94.9991 105.776 98.3363 118.486C99.9766 124.539 104.669 131.805 108.37 136.37C125.428 157.407 147.037 174.92 147.523 204.427C148.661 229.431 144.801 261.897 127.766 281.459C115.439 295.614 99.8708 300.642 81.8067 301.837C80.4298 301.945 79.0511 302.022 77.6707 302.071C61.5613 302.551 45.197 299.553 33.1928 288.074C16.7542 272.501 19.4398 249.798 21.8844 229.431C23.1948 218.515 25.5501 207.716 36.1707 201.993C45.426 197.007 62.0204 197.343 69.7314 205.114C80.3083 215.777 73.1135 232.789 72.9937 245.767C72.9384 247.529 73.4584 252.425 75.2058 253.395C86.3128 259.554 88.4171 243.015 89.2586 238.277C93.5966 213.872 91.0133 198.229 73.7599 179.889C58.1113 163.257 40.9399 143.953 40.2311 119.935C39.9804 111.782 40.0077 103.791 41.2372 95.6419C43.284 75.6172 47.7463 57.022 61.2913 41.2532C73.6951 26.8134 89.7166 20.643 108.405 19.2979Z" fill="#3E4C5E"/>
      <path d="M556.7 22.4541C564.176 22.4629 570.868 23.546 576.649 28.6245C587.116 37.8216 584.791 51.9417 583.229 64.2008C582.242 71.9555 581.233 79.5161 580.214 87.172L572.024 150.539L560.566 239.089C558.853 251.801 557.386 264.622 555.306 277.243C553.671 287.167 547.024 295.764 537.184 298.517C533.945 299.424 531.182 299.441 527.859 299.536C519.787 299.595 512.899 299.641 506.396 294.139C496.234 285.542 499.645 271.517 501.175 260.153L504.204 237.415L514.503 159.702L524.269 84.2717L527.263 60.5165C528.549 50.3133 528.822 39.7616 536.063 31.7555C541.901 25.2984 548.19 22.9944 556.7 22.4541Z" fill="#3E4C5E"/>
      <path d="M348.776 22.4587C364.058 22.7333 375.789 30.213 375.863 47.0454C375.912 58.2004 373.579 70.9764 372.06 82.2078L365.119 135.415L353.118 228.972L349.193 258.479C346.409 279.971 345.726 299.095 318.548 299.567C316.062 299.567 313.509 299.599 311.121 299.406C300.479 298.853 290.806 290.039 290.762 279.053C290.726 269.836 292.786 258.816 293.952 249.423L304.096 172.43L315.285 87.1469C317.092 73.385 318.223 59.2467 320.723 45.6064C323.524 30.3388 334.114 23.3279 348.776 22.4587Z" fill="#3E4C5E"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M235.8 22.9583C255.646 22.9856 273.948 21.8885 289.613 37.1751C300.451 47.7509 303.511 64.7876 303.192 79.3255C302.975 89.1465 301.351 101.173 300.065 111.132C296.784 136.558 295.537 165.517 275.938 184.484C258.602 201.261 239.905 200.946 217.915 200.848C215.742 218.967 213.436 237.069 210.996 255.153C209.746 263.074 209.161 271.349 207.563 279.179C205.645 288.564 197.212 297.949 187.257 299.098C142.173 304.301 151.948 273.709 155.842 244.269L162.155 195.532L176.457 86.7053C177.758 77.2138 179.01 67.7153 180.213 58.2112C182.179 42.6287 181.28 25.551 200.794 23.1311C202.297 22.9666 204.944 22.9606 206.531 22.9505L235.8 22.9583ZM247.227 79.0208C247.616 69.3864 242.119 69.7417 234.625 69.928C232.272 94.7806 227.601 119.929 224.95 144.809C224.669 147.445 224.266 150.311 223.857 152.925C227.729 152.956 231.547 153.403 234.858 151.297C239.345 146.611 240.072 136.578 240.949 130.129L243.699 109.695C245.053 99.5598 246.814 89.2085 247.227 79.0208Z" fill="#3E4C5E"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M408.668 23.1422C414.078 22.4733 424.269 22.8242 429.97 22.9615C445.892 23.3439 463.376 21.3268 478.665 26.1021C502.323 33.4922 511.41 54.661 510.805 77.9742C510.514 89.1802 509.005 99.2513 507.573 110.365L494.382 211.41C490.106 243.33 487.539 275.825 454.874 292.41C441.136 298.237 432.802 298.734 418.115 298.765C405.989 298.79 393.193 298.625 381.165 298.752C355.511 299.014 358.423 284.362 360.668 265.847C361.687 257.205 362.804 248.569 364.013 239.951L373.985 164.475L385.248 77.6099C386.848 65.5337 388.266 53.2216 390.013 41.192C390.931 34.8823 394.514 28.68 400.06 25.4713C403.24 23.6295 404.998 23.5603 408.668 23.1422ZM442.271 69.9029L427.231 185.783C425.316 199.976 423.47 214.184 421.702 228.398C420.781 235.591 419.439 244.219 418.812 251.349C422.864 251.346 426.009 251.727 429.458 249.353C431.755 246.835 432.676 244.612 433.32 241.289C435.691 229.008 437.327 216.32 438.966 203.926L452.094 102.799C453.144 94.847 454.601 86.5579 454.688 78.5572C454.786 69.4145 449.362 69.8094 442.271 69.9029Z" fill="#3E4C5E"/>
    </svg>
  )
}
