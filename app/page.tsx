"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import "./landing.css"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navbarScrolled, setNavbarScrolled] = useState(false)

  useEffect(() => {
    // Navbar scroll effect
    const handleScroll = () => {
      setNavbarScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)

    // Reveal animation on scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, observerOptions)

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))

    // FAQ toggle
    const handleFaqClick = (e: Event) => {
      const button = (e.currentTarget as HTMLElement).closest('.faq__item')
      if (button) {
        button.classList.toggle('active')
      }
    }

    document.querySelectorAll('.faq__question').forEach(btn => {
      btn.addEventListener('click', handleFaqClick)
    })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.querySelectorAll('.faq__question').forEach(btn => {
        btn.removeEventListener('click', handleFaqClick)
      })
    }
  }, [])

  return (
    <>
      {/* Announcement Bar */}
      <div className="announcement" role="banner">
        <span>🎉 ¡Nuevos repartidores ganan $200 en bonos de bienvenida! Aplica hoy</span>
      </div>

      {/* Navbar */}
      <nav className={`navbar ${navbarScrolled ? 'scrolled' : ''}`} id="navbar">
        <div className="navbar__inner">
          <Link href="/" className="navbar__logo" aria-label="SPIDI inicio">
            <SpidiLogo />
          </Link>
          <ul className="navbar__links">
            <li><a href="#inicio">Inicio</a></li>
            <li><a href="#como-funciona">Cómo Funciona</a></li>
            <li><a href="#requisitos">Requisitos</a></li>
          </ul>
          <div className="navbar__ctas">
            <a href="#requisitos" className="btn btn--secondary">Ver Requisitos</a>
            <Link href="/registro" className="btn btn--primary">¡Regístrate ahora!</Link>
          </div>
          <button 
            className="navbar__hamburger" 
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <span className="icon">menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu__panel">
          <button 
            className="mobile-menu__close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <span className="icon">close</span>
          </button>
          <div className="mobile-menu__links">
            <a href="#inicio" onClick={() => setMobileMenuOpen(false)}>Inicio</a>
            <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)}>Cómo Funciona</a>
            <a href="#requisitos" onClick={() => setMobileMenuOpen(false)}>Requisitos</a>
          </div>
          <div className="mobile-menu__ctas">
            <a href="#requisitos" className="btn btn--secondary" onClick={() => setMobileMenuOpen(false)}>Ver Requisitos</a>
            <Link href="/registro" className="btn btn--primary">¡Regístrate ahora!</Link>
          </div>
        </div>
      </div>

      <main>
        {/* Hero Section */}
        <section className="hero" id="inicio">
          <img
            className="hero__bg"
            src="/driver-hero.png"
            alt="Repartidor SPIDI haciendo entregas a domicilio"
            width="1400"
            height="800"
          />
          <div className="hero__overlay"></div>

          <div className="hero__inner">
            <div className="hero__content">
              <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "28px"}}>
                <div className="hero__badge" style={{marginBottom: 0}}>
                  <span className="icon" style={{fontSize: "16px"}}>local_shipping</span>
                  Reclutando repartidores
                </div>
                <div className="hero__badge" style={{marginBottom: 0, background: "rgba(225,37,27,0.75)", borderColor: "rgba(225,37,27,0.4)"}}>
                  <span className="icon" style={{fontSize: "16px", color: "#FFD700"}}>payments</span>
                  Hasta $200 MXN/hr
                </div>
              </div>
              <h1 className="hero__headline">
                Gana dinero,<br/><span className="accent">haciendo entregas</span> a domicilio
              </h1>
              <p className="hero__subtitle">
                Tú decides tus horarios, elige tu zona y recibe pagos semanales. Haz entregas para HEB y Mi Tienda con SPIDI.
              </p>
              <div className="hero__social-proof">
                <span className="icon">group</span>
                <span>Más de 1,000,000 de entregas felices</span>
                <span className="hero__stars">★★★★★</span>
                <span className="hero__stars-text">(4.8/5)</span>
              </div>
              <div className="hero__ctas">
                <Link href="/registro" className="btn btn--primary btn--lg">¡Regístrate ahora!</Link>
                <a href="#requisitos" className="btn btn--secondary btn--lg">Ver Requisitos</a>
              </div>
            </div>
          </div>

          {/* Glassmorphism floating cards */}
          <div className="hero__glass-cards">
            <div className="hero__glass-card">
              <span className="icon card-icon">payments</span>
              <div className="card-text">
                <div className="card-value">$150<span className="unit">MXN</span>/hr</div>
                <div className="card-label">Ganancias promedio</div>
              </div>
            </div>
            <div className="hero__glass-card">
              <span className="icon card-icon">local_shipping</span>
              <div className="card-text">
                <div className="card-value">1M+</div>
                <div className="card-label">Entregas completadas</div>
              </div>
            </div>
            <div className="hero__glass-card">
              <span className="icon card-icon">schedule</span>
              <div className="card-text">
                <div className="card-value">Tú decides</div>
                <div className="card-label">Horario flexible</div>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="hero__stats-bar">
            <div className="hero__stats-bar-inner">
              <div className="hero__stat">
                <span className="hero__stat-number">300+</span>
                <span className="hero__stat-label">Repartidores<br/>activos</span>
              </div>
              <div className="hero__stat-divider"></div>
              <div className="hero__stat">
                <span className="hero__stat-number">1M+</span>
                <span className="hero__stat-label">Entregas<br/>completadas</span>
              </div>
              <div className="hero__stat-divider"></div>
              <div className="hero__stat">
                <span className="hero__stat-number">4.8★</span>
                <span className="hero__stat-label">Calificación<br/>promedio</span>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="benefits" id="por-que">
          <div className="container">
            <div className="section-header reveal">
              <h2>¿Por qué ser repartidor con SPIDI?</h2>
              <p>Descubre las ventajas de ser parte de nuestra comunidad de repartidores</p>
            </div>
            <div className="benefits__grid">
              <div className="benefit-card reveal">
                <div className="benefit-card__icon"><span className="icon">payments</span></div>
                <h3>Pagos semanales directos a tu cuenta</h3>
                <p>Gana con cada pedido que entregas. Disfruta y recibe cada semana en tu cuenta el dinero que has ganado, más dinero extra al completar metas y referir personas.</p>
              </div>
              <div className="benefit-card reveal" style={{transitionDelay: "0.08s"}}>
                <div className="benefit-card__icon"><span className="icon">storefront</span></div>
                <h3>Pedidos constantes</h3>
                <p>Opera en tiendas HEB y Mi Tienda con alto volumen de pedidos todos los días. Siempre habrá trabajo esperándote.</p>
              </div>
              <div className="benefit-card reveal" style={{transitionDelay: "0.16s"}}>
                <div className="benefit-card__icon"><span className="icon">schedule</span></div>
                <h3>Administra tus tiempos</h3>
                <p>Tú decides qué días y horas prestarás el servicio. Haz entregas cuando quieras: solo una hora, los fines de semana o toda la semana.</p>
              </div>
              <div className="benefit-card reveal" style={{transitionDelay: "0.24s"}}>
                <div className="benefit-card__icon"><span className="icon">support_agent</span></div>
                <h3>Soporte y capacitación</h3>
                <p>Soporte cada vez que lo necesites. Acceso a programas de capacitación y un seguro que te cubre en caso de accidente.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="how-it-works" id="como-funciona">
          <div className="container">
            <div className="section-header reveal">
              <h2>Comienza a repartir en 3 pasos</h2>
            </div>
            <div className="steps">
              <div className="step reveal">
                <div className="step__circle">1</div>
                <h3>Llena el formulario</h3>
                <p>Registrarse es fácil y no te toma más de 15 minutos. Solo necesitas tus datos básicos y la información de tu vehículo.</p>
              </div>
              <div className="step reveal" style={{transitionDelay: "0.12s"}}>
                <div className="step__circle">2</div>
                <h3>Sube tus documentos</h3>
                <p>Sube tus documentos para registrarte desde tu celular. Sin citas ni filas — todo en línea.</p>
              </div>
              <div className="step reveal" style={{transitionDelay: "0.24s"}}>
                <div className="step__circle">3</div>
                <h3>¡Comienza a repartir y ganar!</h3>
                <p>Espera la validación de tu información. Puedes empezar a repartir en 24 horas y generar ingresos con cada entrega.</p>
              </div>
            </div>
            <div className="timeline reveal">
              <div className="timeline__item">
                <div className="timeline__day">Día 1</div>
                <div className="timeline__desc">Aplica</div>
              </div>
              <div className="timeline__item">
                <div className="timeline__day">Días 2-3</div>
                <div className="timeline__desc">Verificación</div>
              </div>
              <div className="timeline__item">
                <div className="timeline__day">Día 4-5</div>
                <div className="timeline__desc">Entrenamiento</div>
              </div>
              <div className="timeline__item timeline__item--success">
                <div className="timeline__day">Día 6-7</div>
                <div className="timeline__desc">¡Gana con tu primera entrega!</div>
              </div>
            </div>
          </div>
        </section>

        {/* Requirements Section */}
        <section className="requirements" id="requisitos">
          <div className="container">
            <div className="section-header reveal">
              <span className="section-label">Requisitos</span>
              <h2>Requisitos para ser repartidor</h2>
              <p>Cumple con estos requisitos y comienza a generar ingresos en menos de una semana</p>
            </div>
            <div className="req-cards__grid reveal">
              <div className="req-card">
                <div className="req-card__icon"><span className="icon">badge</span></div>
                <div className="req-card__text">
                  <strong>Ser mayor de 18 años</strong>
                  <span>Identificación oficial INE o pasaporte vigente</span>
                </div>
              </div>
              <div className="req-card">
                <div className="req-card__icon"><span className="icon">description</span></div>
                <div className="req-card__text">
                  <strong>Licencia de conducir vigente</strong>
                  <span>Tipo A o B según tu vehículo</span>
                </div>
              </div>
              <div className="req-card">
                <div className="req-card__icon"><span className="icon">directions_car</span></div>
                <div className="req-card__text">
                  <strong>Vehículo modelo 2015 o más reciente</strong>
                  <span>Auto, moto o bicicleta en buen estado</span>
                </div>
              </div>
              <div className="req-card">
                <div className="req-card__icon"><span className="icon">security</span></div>
                <div className="req-card__text">
                  <strong>Seguro vehicular vigente</strong>
                  <span>Cobertura amplia o al menos RC obligatorio</span>
                </div>
              </div>
              <div className="req-card">
                <div className="req-card__icon"><span className="icon">smartphone</span></div>
                <div className="req-card__text">
                  <strong>Smartphone con GPS</strong>
                  <span>Android 8+ o iOS 14+ con datos móviles</span>
                </div>
              </div>
              <div className="req-card">
                <div className="req-card__icon"><span className="icon">calendar_month</span></div>
                <div className="req-card__text">
                  <strong>Disponibilidad mínima 15 hrs/semana</strong>
                  <span>Tú eliges tus horarios y días de trabajo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq" id="faq">
          <div className="container">
            <div className="section-header reveal">
              <h2>Preguntas frecuentes — trabajo de repartidor</h2>
              <p>Respuestas a las dudas más comunes de nuestros aspirantes</p>
            </div>
            <div className="faq__list">
              <FaqItem 
                question="¿Cuáles son los requisitos para ser repartidor?"
                answer="Ser mayor de 18 años, contar con RFC con homoclave, licencia de conducir vigente, identificación oficial (INE), vehículo con documentación al día, cuenta bancaria para depósitos y seguro de vehículo."
              />
              <FaqItem 
                question="¿Cuánto puedo ganar como repartidor?"
                answer="Tus ganancias dependen de los pedidos que entregues y tu zona. Recibes pagos semanales directos a tu cuenta bancaria. Además puedes ganar dinero extra al completar metas de pedidos y referir personas."
                delay={0.04}
              />
              <FaqItem 
                question="¿Cómo y cuándo recibo mis pagos?"
                answer="Recibes pagos cada semana directamente en tu cuenta bancaria. Puedes consultar el detalle de tus ganancias desde la app SPIDI."
                delay={0.08}
              />
              <FaqItem 
                question="¿Qué documentos necesito para registrarme?"
                answer="INE vigente, licencia de conducir, tarjeta de circulación, Número de Seguro Social, Constancia de Situación Fiscal (RFC con homoclave), seguro de vehículo vigente y carátula de cuenta bancaria con CLABE."
                delay={0.12}
              />
              <FaqItem 
                question="¿Puedo elegir mis propios horarios?"
                answer="Sí. Tú decides qué días y horas prestarás el servicio. Puedes hacer entregas unas horas a la semana, los fines de semana, o de tiempo completo — como mejor te convenga."
                delay={0.16}
              />
              <FaqItem 
                question="¿En qué ciudades están disponibles?"
                answer="SPIDI opera en 7 estados de México donde hay tiendas HEB y Mi Tienda: Nuevo León, Coahuila, Tamaulipas, Guanajuato, Querétaro, Aguascalientes y San Luis Potosí. Principales ciudades: Monterrey y área metropolitana, Saltillo, Torreón, Reynosa, Tampico, León y Querétaro."
                delay={0.20}
              />
              <FaqItem 
                question="¿Puedo trabajar si ya uso otras apps?"
                answer="Sí. Registrarte en SPIDI no te impide trabajar con otras plataformas. Puedes combinar tus actividades como mejor te convenga."
                delay={0.24}
              />
              <FaqItem 
                question="¿Necesito dinero base para empezar?"
                answer="No. No necesitas ningún pago inicial para registrarte ni para comenzar a repartir con SPIDI."
                delay={0.28}
              />
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section className="community">
          <div className="container">
            <div className="section-header reveal">
              <h2>Números que respaldan tu decisión</h2>
              <p>Únete a miles de repartidores que ya generan ingresos estables con SPIDI</p>
            </div>
            <div className="community__stats">
              <div className="community__stat reveal">
                <div className="community__stat-number">92%</div>
                <div className="community__stat-label">Satisfacción laboral</div>
              </div>
              <div className="community__stat reveal" style={{transitionDelay: "0.08s"}}>
                <div className="community__stat-number">$2.1M<small style={{fontSize: "18px"}}> MXN</small></div>
                <div className="community__stat-label">Pagado mensualmente</div>
              </div>
              <div className="community__stat reveal" style={{transitionDelay: "0.16s"}}>
                <div className="community__stat-number">85%</div>
                <div className="community__stat-label">Trabajadores de tiempo completo</div>
              </div>
              <div className="community__stat reveal" style={{transitionDelay: "0.24s"}}>
                <div className="community__stat-number">4.9★</div>
                <div className="community__stat-label">App Store rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="cta-final" id="cta-final">
          <div className="container">
            <h2 className="reveal">¿Listo para salir a la calle? Regístrate hoy</h2>
            <p className="reveal" style={{transitionDelay: "0.08s"}}>Comienza tu aplicación hoy y podrías estar entregando esta semana.</p>
            <div className="cta-final__buttons reveal" style={{transitionDelay: "0.16s"}}>
              <Link href="/registro" className="btn btn--white btn--lg">Aplica ahora</Link>
              <a href="#requisitos" className="btn btn--outline-white btn--lg">Ver Requisitos</a>
            </div>
            <div className="cta-final__note reveal" style={{transitionDelay: "0.2s"}}>⚡ Proceso de aplicación de 5-7 días</div>
            <div className="cta-final__benefits reveal" style={{transitionDelay: "0.24s"}}>
              <div className="cta-benefit">
                <span className="icon">verified_user</span>
                <span>Seguro incluido</span>
              </div>
              <div className="cta-benefit">
                <span className="icon">card_giftcard</span>
                <span>Bonos mensuales</span>
              </div>
              <div className="cta-benefit">
                <span className="icon">favorite</span>
                <span>Beneficios de salud</span>
              </div>
              <div className="cta-benefit">
                <span className="icon">groups</span>
                <span>Comunidad activa</span>
              </div>
              <div className="cta-benefit">
                <span className="icon">headset_mic</span>
                <span>Soporte 24/7</span>
              </div>
              <div className="cta-benefit">
                <span className="icon">chat</span>
                <span>Chat en vivo</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__grid">
          <div className="footer__col">
            <h4>Ayuda y Soporte</h4>
            <a href="#">Centro de Ayuda</a>
            <a href="#">Preguntas Frecuentes</a>
            <a href="#">Reportar Problema</a>
          </div>
          <div className="footer__col">
            <h4>Información Legal</h4>
            <a href="#">Términos y Condiciones</a>
            <a href="#">Política de Privacidad</a>
            <a href="#">Oportunidades de Empleo</a>
            <a href="#">Diversidad e Inclusión</a>
            <a href="#">Código de Conducta</a>
          </div>
          <div className="footer__col">
            <h4>Contacto</h4>
            <a href="mailto:contacto@serviciosspidi.com.mx" className="footer__contact">
              <span className="icon">mail</span>
              contacto@serviciosspidi.com.mx
            </a>
          </div>
        </div>
        <div className="footer__bottom">
          <div className="footer__bottom-logo">
            <SpidiLogoFooter />
          </div>
          <div>
            <span className="footer__copyright">© 2026 SPIDI Inc. Todos los derechos reservados.</span>
            <span className="footer__tagline" style={{display: "block", fontSize: "12px", color: "#8A9DB5", marginTop: "4px"}}>SPIDI — Plataforma de repartidores de última milla en México para HEB y Mi Tienda</span>
          </div>
        </div>
      </footer>
    </>
  )
}

function FaqItem({ question, answer, delay = 0 }: { question: string; answer: string; delay?: number }) {
  return (
    <div className="faq__item reveal" style={{transitionDelay: `${delay}s`}}>
      <button className="faq__question" aria-expanded="false">
        <h3>{question}</h3>
        <span className="icon">expand_more</span>
      </button>
      <div className="faq__answer" role="region">
        <div className="faq__answer-inner">
          {answer}
        </div>
      </div>
    </div>
  )
}

function SpidiLogo() {
  return (
    <svg width="607" height="325" viewBox="0 0 607 325" fill="none" xmlns="http://www.w3.org/2000/svg" style={{height: "44px", width: "auto"}}>
      <path d="M108.405 19.2979C123.111 17.756 141.489 22.8443 152.023 33.5297C167.375 49.1028 166.088 71.5854 163.577 91.6318C162.253 102.199 161.799 112.852 153.579 120.618C143.972 130.042 124.91 129.856 115.609 120.002C105.772 109.499 112.685 93.5137 113.424 80.9867C113.65 77.1447 115.308 67.1779 108.792 67.0666C103.274 66.9723 100.542 74.6153 99.806 79.213C97.7704 91.9239 94.9991 105.776 98.3363 118.486C99.9766 124.539 104.669 131.805 108.37 136.37C125.428 157.407 147.037 174.92 147.523 204.427C148.661 229.431 144.801 261.897 127.766 281.459C115.439 295.614 99.8708 300.642 81.8067 301.837C80.4298 301.945 79.0511 302.022 77.6707 302.071C61.5613 302.551 45.197 299.553 33.1928 288.074C16.7542 272.501 19.4398 249.798 21.8844 229.431C23.1948 218.515 25.5501 207.716 36.1707 201.993C45.426 197.007 62.0204 197.343 69.7314 205.114C80.3083 215.777 73.1135 232.789 72.9937 245.767C72.9384 247.529 73.4584 252.425 75.2058 253.395C86.3128 259.554 88.4171 243.015 89.2586 238.277C93.5966 213.872 91.0133 198.229 73.7599 179.889C58.1113 163.257 40.9399 143.953 40.2311 119.935C39.9804 111.782 40.0077 103.791 41.2372 95.6419C43.284 75.6172 47.7463 57.022 61.2913 41.2532C73.6951 26.8134 89.7166 20.643 108.405 19.2979Z" fill="#3E4C5E"/>
      <path d="M556.7 22.4541C564.176 22.4629 570.868 23.546 576.649 28.6245C587.116 37.8216 584.791 51.9417 583.229 64.2008C582.242 71.9555 581.233 79.5161 580.214 87.172L572.024 150.539L560.566 239.089C558.853 251.801 557.386 264.622 555.306 277.243C553.671 287.167 547.024 295.764 537.184 298.517C533.945 299.424 531.182 299.441 527.859 299.536C519.787 299.595 512.899 299.641 506.396 294.139C496.234 285.542 499.645 271.517 501.175 260.153L504.204 237.415L514.503 159.702L524.269 84.2717L527.263 60.5165C528.549 50.3133 528.822 39.7616 536.063 31.7555C541.901 25.2984 548.19 22.9944 556.7 22.4541Z" fill="#3E4C5E"/>
      <path d="M348.776 22.4587C364.058 22.7333 375.789 30.213 375.863 47.0454C375.912 58.2004 373.579 70.9764 372.06 82.2078L365.119 135.415L353.118 228.972L349.193 258.479C346.409 279.971 345.726 299.095 318.548 299.567C316.062 299.567 313.509 299.599 311.121 299.406C300.479 298.853 290.806 290.039 290.762 279.053C290.726 269.836 292.786 258.816 293.952 249.423L304.096 172.43L315.285 87.1469C317.092 73.385 318.223 59.2467 320.723 45.6064C323.524 30.3388 334.114 23.3279 348.776 22.4587Z" fill="#3E4C5E"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M235.8 22.9583C255.646 22.9856 273.948 21.8885 289.613 37.1751C300.451 47.7509 303.511 64.7876 303.192 79.3255C302.975 89.1465 301.351 101.173 300.065 111.132C296.784 136.558 295.537 165.517 275.938 184.484C258.602 201.261 239.905 200.946 217.915 200.848C215.742 218.967 213.436 237.069 210.996 255.153C209.746 263.074 209.161 271.349 207.563 279.179C205.645 288.564 197.212 297.949 187.257 299.098C142.173 304.301 151.948 273.709 155.842 244.269L162.155 195.532L176.457 86.7053C177.758 77.2138 179.01 67.7153 180.213 58.2112C182.179 42.6287 181.28 25.551 200.794 23.1311C202.297 22.9666 204.944 22.9606 206.531 22.9505L235.8 22.9583ZM247.227 79.0208C247.616 69.3864 242.119 69.7417 234.625 69.928C232.272 94.7806 227.601 119.929 224.95 144.809C224.669 147.445 224.266 150.311 223.857 152.925C227.729 152.956 231.547 153.403 234.858 151.297C239.345 146.611 240.072 136.578 240.949 130.129L243.699 109.695C245.053 99.5598 246.814 89.2085 247.227 79.0208Z" fill="#3E4C5E"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M408.668 23.1422C414.078 22.4733 424.269 22.8242 429.97 22.9615C445.892 23.3439 463.376 21.3268 478.665 26.1021C502.323 33.4922 511.41 54.661 510.805 77.9742C510.514 89.1802 509.005 99.2513 507.573 110.365L494.382 211.41C490.106 243.33 487.539 275.825 454.874 292.41C441.136 298.237 432.802 298.734 418.115 298.765C405.989 298.79 393.193 298.625 381.165 298.752C355.511 299.014 358.423 284.362 360.668 265.847C361.687 257.205 362.804 248.569 364.013 239.951L373.985 164.475L385.248 77.6099C386.848 65.5337 388.266 53.2216 390.013 41.192C390.931 34.8823 394.514 28.68 400.06 25.4713C403.24 23.6295 404.998 23.5603 408.668 23.1422ZM442.271 69.9029L427.231 185.783C425.316 199.976 423.47 214.184 421.702 228.398C420.781 235.591 419.439 244.219 418.812 251.349C422.864 251.346 426.009 251.727 429.458 249.353C431.755 246.835 432.676 244.612 433.32 241.289C435.691 229.008 437.327 216.32 438.966 203.926L452.094 102.799C453.144 94.847 454.601 86.5579 454.688 78.5572C454.786 69.4145 449.362 69.8094 442.271 69.9029Z" fill="#3E4C5E"/>
    </svg>
  )
}

function SpidiLogoFooter() {
  return (
    <svg width="607" height="325" viewBox="0 0 607 325" fill="none" xmlns="http://www.w3.org/2000/svg" style={{height: "24px", width: "auto"}}>
      <path d="M108.405 19.2979C123.111 17.756 141.489 22.8443 152.023 33.5297C167.375 49.1028 166.088 71.5854 163.577 91.6318C162.253 102.199 161.799 112.852 153.579 120.618C143.972 130.042 124.91 129.856 115.609 120.002C105.772 109.499 112.685 93.5137 113.424 80.9867C113.65 77.1447 115.308 67.1779 108.792 67.0666C103.274 66.9723 100.542 74.6153 99.806 79.213C97.7704 91.9239 94.9991 105.776 98.3363 118.486C99.9766 124.539 104.669 131.805 108.37 136.37C125.428 157.407 147.037 174.92 147.523 204.427C148.661 229.431 144.801 261.897 127.766 281.459C115.439 295.614 99.8708 300.642 81.8067 301.837C80.4298 301.945 79.0511 302.022 77.6707 302.071C61.5613 302.551 45.197 299.553 33.1928 288.074C16.7542 272.501 19.4398 249.798 21.8844 229.431C23.1948 218.515 25.5501 207.716 36.1707 201.993C45.426 197.007 62.0204 197.343 69.7314 205.114C80.3083 215.777 73.1135 232.789 72.9937 245.767C72.9384 247.529 73.4584 252.425 75.2058 253.395C86.3128 259.554 88.4171 243.015 89.2586 238.277C93.5966 213.872 91.0133 198.229 73.7599 179.889C58.1113 163.257 40.9399 143.953 40.2311 119.935C39.9804 111.782 40.0077 103.791 41.2372 95.6419C43.284 75.6172 47.7463 57.022 61.2913 41.2532C73.6951 26.8134 89.7166 20.643 108.405 19.2979Z" fill="#8A9DB5"/>
      <path d="M556.7 22.4541C564.176 22.4629 570.868 23.546 576.649 28.6245C587.116 37.8216 584.791 51.9417 583.229 64.2008C582.242 71.9555 581.233 79.5161 580.214 87.172L572.024 150.539L560.566 239.089C558.853 251.801 557.386 264.622 555.306 277.243C553.671 287.167 547.024 295.764 537.184 298.517C533.945 299.424 531.182 299.441 527.859 299.536C519.787 299.595 512.899 299.641 506.396 294.139C496.234 285.542 499.645 271.517 501.175 260.153L504.204 237.415L514.503 159.702L524.269 84.2717L527.263 60.5165C528.549 50.3133 528.822 39.7616 536.063 31.7555C541.901 25.2984 548.19 22.9944 556.7 22.4541Z" fill="#8A9DB5"/>
      <path d="M348.776 22.4587C364.058 22.7333 375.789 30.213 375.863 47.0454C375.912 58.2004 373.579 70.9764 372.06 82.2078L365.119 135.415L353.118 228.972L349.193 258.479C346.409 279.971 345.726 299.095 318.548 299.567C316.062 299.567 313.509 299.599 311.121 299.406C300.479 298.853 290.806 290.039 290.762 279.053C290.726 269.836 292.786 258.816 293.952 249.423L304.096 172.43L315.285 87.1469C317.092 73.385 318.223 59.2467 320.723 45.6064C323.524 30.3388 334.114 23.3279 348.776 22.4587Z" fill="#8A9DB5"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M235.8 22.9583C255.646 22.9856 273.948 21.8885 289.613 37.1751C300.451 47.7509 303.511 64.7876 303.192 79.3255C302.975 89.1465 301.351 101.173 300.065 111.132C296.784 136.558 295.537 165.517 275.938 184.484C258.602 201.261 239.905 200.946 217.915 200.848C215.742 218.967 213.436 237.069 210.996 255.153C209.746 263.074 209.161 271.349 207.563 279.179C205.645 288.564 197.212 297.949 187.257 299.098C142.173 304.301 151.948 273.709 155.842 244.269L162.155 195.532L176.457 86.7053C177.758 77.2138 179.01 67.7153 180.213 58.2112C182.179 42.6287 181.28 25.551 200.794 23.1311C202.297 22.9666 204.944 22.9606 206.531 22.9505L235.8 22.9583ZM247.227 79.0208C247.616 69.3864 242.119 69.7417 234.625 69.928C232.272 94.7806 227.601 119.929 224.95 144.809C224.669 147.445 224.266 150.311 223.857 152.925C227.729 152.956 231.547 153.403 234.858 151.297C239.345 146.611 240.072 136.578 240.949 130.129L243.699 109.695C245.053 99.5598 246.814 89.2085 247.227 79.0208Z" fill="#8A9DB5"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M408.668 23.1422C414.078 22.4733 424.269 22.8242 429.97 22.9615C445.892 23.3439 463.376 21.3268 478.665 26.1021C502.323 33.4922 511.41 54.661 510.805 77.9742C510.514 89.1802 509.005 99.2513 507.573 110.365L494.382 211.41C490.106 243.33 487.539 275.825 454.874 292.41C441.136 298.237 432.802 298.734 418.115 298.765C405.989 298.79 393.193 298.625 381.165 298.752C355.511 299.014 358.423 284.362 360.668 265.847C361.687 257.205 362.804 248.569 364.013 239.951L373.985 164.475L385.248 77.6099C386.848 65.5337 388.266 53.2216 390.013 41.192C390.931 34.8823 394.514 28.68 400.06 25.4713C403.24 23.6295 404.998 23.5603 408.668 23.1422ZM442.271 69.9029L427.231 185.783C425.316 199.976 423.47 214.184 421.702 228.398C420.781 235.591 419.439 244.219 418.812 251.349C422.864 251.346 426.009 251.727 429.458 249.353C431.755 246.835 432.676 244.612 433.32 241.289C435.691 229.008 437.327 216.32 438.966 203.926L452.094 102.799C453.144 94.847 454.601 86.5579 454.688 78.5572C454.786 69.4145 449.362 69.8094 442.271 69.9029Z" fill="#8A9DB5"/>
    </svg>
  )
}
