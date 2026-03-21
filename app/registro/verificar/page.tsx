"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import "../../landing.css"
import "../registro.css"
import "./verificar.css"

type Phase = 'email' | 'phone'

export default function VerificarPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('email')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [showError, setShowError] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const [userData, setUserData] = useState({ email: '', telefono: '' })

  useEffect(() => {
    const step1Data = sessionStorage.getItem('spidi_step1')
    if (!step1Data) {
      router.push('/registro')
      return
    }
    
    const data = JSON.parse(step1Data)
    setUserData({
      email: data.email,
      telefono: data.telefono
    })

    inputRefs[0].current?.focus()
  }, [router])

  useEffect(() => {
    if (countdown > 0 && !showSuccess) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown, showSuccess])

  // Reset when phase changes
  useEffect(() => {
    if (showSuccess) return
    setOtp(['', '', '', '', '', ''])
    setShowError(false)
    setCountdown(60)
    setIsVerifying(false)
    inputRefs[0].current?.focus()
  }, [phase, showSuccess])

  const maskEmail = (email: string) => {
    if (!email) return '***@***.com'
    const [user, domain] = email.split('@')
    return user[0] + '***@' + domain
  }

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 7) return '*** **** ****'
    return '*** ' + phone.slice(-7, -4) + ' ' + phone.slice(-4)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setShowError(false)

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus()
    }

    // Auto-submit cuando se completan 6 dígitos
    if (value && index === 5 && newOtp.every(d => d !== '')) {
      setTimeout(() => handleVerify(newOtp.join('')), 300)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs[index - 1].current?.focus()
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
      } else {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pastedData) return

    const newOtp = pastedData.split('')
    while (newOtp.length < 6) newOtp.push('')
    setOtp(newOtp)

    const lastIndex = Math.min(pastedData.length - 1, 5)
    inputRefs[lastIndex].current?.focus()

    if (pastedData.length === 6) {
      setTimeout(() => handleVerify(pastedData), 300)
    }
  }

  const handleVerify = async (code?: string) => {
    if (isVerifying) return
    
    const fullCode = code || otp.join('')
    if (fullCode.length < 6) {
      setShowError(true)
      setTimeout(() => setShowError(false), 3000)
      return
    }

    setIsVerifying(true)

    // Simular verificación API
    await new Promise(resolve => setTimeout(resolve, 1200))

    // Success
    setShowSuccess(true)
    
    setTimeout(() => {
      if (phase === 'email') {
        setPhase('phone')
        setShowSuccess(false)
      } else {
        router.push('/registro/confirmacion')
      }
    }, 1800)
  }

  const handleResend = () => {
    if (countdown > 0) return
    setCountdown(60)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const phaseConfig = phase === 'email' ? {
    icon: 'mail',
    title: 'Verifica tu correo electrónico',
    target: maskEmail(userData.email),
    successText: 'Correo verificado'
  } : {
    icon: 'phone_android',
    title: 'Verifica tu teléfono',
    target: maskPhone(userData.telefono),
    successText: 'Teléfono verificado'
  }

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
        <p className="reg-header__subtitle">Ingresa los códigos que enviamos a tu correo y teléfono</p>
      </header>

      <div className="reg-container">
        <div className="reg-card">
          {/* Phase indicator */}
          <div className="verify-steps">
            <span className={`verify-step ${phase === 'email' ? 'active' : 'done'}`}>
              <span className="icon">mail</span> Correo
            </span>
            <span className="verify-step-divider">&mdash;</span>
            <span className={`verify-step ${phase === 'phone' ? 'active' : ''}`}>
              <span className="icon">phone_android</span> Teléfono
            </span>
          </div>

          {/* Verify content */}
          <div style={{display: showSuccess ? 'none' : 'block'}}>
            <div className="verify-icon">
              <span className="icon">{phaseConfig.icon}</span>
            </div>
            <h2 className="verify-title">{phaseConfig.title}</h2>
            <p className="verify-desc">
              Enviamos un código de 6 dígitos a <strong>{phaseConfig.target}</strong>
            </p>

            <div className="otp-group">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  className={`otp-input ${showError ? 'error' : ''} ${digit ? 'success' : ''}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  onFocus={() => inputRefs[index].current?.select()}
                  aria-label={`Dígito ${index + 1} de 6`}
                />
              ))}
            </div>

            <div className={`verify-error ${showError ? 'visible' : ''}`}>
              <span className="icon" style={{fontSize: '16px'}}>error</span>
              Código incorrecto. Intenta de nuevo.
            </div>

            <button 
              type="button" 
              className="btn btn--primary btn--lg btn--full" 
              onClick={() => handleVerify()}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <div style={{
                    width: '20px', 
                    height: '20px', 
                    border: '3px solid var(--color-primary-subtle)', 
                    borderTopColor: 'var(--color-accent)', 
                    borderRadius: '50%', 
                    animation: 'spin 0.8s linear infinite',
                    margin: 0
                  }}></div>
                  Verificando...
                </>
              ) : 'Verificar código'}
            </button>

            <p className="verify-resend">
              ¿No recibiste el código?{' '}
              <button type="button" onClick={handleResend} disabled={countdown > 0}>
                {countdown > 0 ? `Reenviar código (${countdown}s)` : 'Reenviar código'}
              </button>
            </p>
            <p className={`verify-toast ${showToast ? 'visible' : ''}`}>Código reenviado</p>
          </div>

          {/* Success state */}
          <div style={{display: showSuccess ? 'block' : 'none', textAlign: 'center', padding: '32px 0'}}>
            <div className="verify-success-icon">
              <span className="icon">check</span>
            </div>
            <p className="verify-success-text">{phaseConfig.successText}</p>
          </div>
        </div>
      </div>

      <footer className="reg-footer">
        <span>&copy; 2026 SPIDI Inc.</span>
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
