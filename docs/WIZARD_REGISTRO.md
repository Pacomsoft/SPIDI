# Wizard de Registro SPIDI

## Descripción

El formulario de registro ha sido transformado en un **wizard multi-paso** que guía al usuario a través de 4 pasos principales más una pantalla de confirmación.

## Estructura del Wizard

### 📋 Step 1: Datos Básicos
**Ruta:** `/registro` (Step 1)

Incluye todos los campos del formulario original:
- **Datos personales:** Nombres y apellidos
- **Contacto:** Teléfono y email
- **Datos del vehículo:** Marca, modelo, año, placas, color
- **Ubicación:** Estado y ciudad
- **Información adicional:** ¿Cómo te enteraste?

**Validación:**
- Todos los campos obligatorios deben completarse correctamente
- Validación en tiempo real con indicadores visuales (✓ verde para válido, ✗ rojo para error)
- No se permite avanzar hasta completar todos los campos requeridos

**Navegación:**
- Botón "Cancelar" → Regresa a la landing page (/)
- Botón "Siguiente" → Valida y avanza al Step 2

---

### 📱 Step 2: Verificación SMS
**Ruta:** `/registro` (Step 2)

Verificación del número de teléfono mediante código OTP de 6 dígitos.

**Funcionalidades:**
- Auto-envío del código SMS al entrar al step
- Input de 6 dígitos con navegación automática
- Validación automática al completar los 6 dígitos
- Countdown de 10 minutos (formato MM:SS)
- Botón de reenvío (máximo 1 reenvío por sesión)
- Indicador visual de éxito (✓ verde)

**Códigos de prueba:**
- `123456` → Código válido (para desarrollo)
- Cualquier otro → Error "Código incorrecto"

**Navegación:**
- Botón "Atrás" → Regresa al Step 1 (mantiene datos)
- Botón "Siguiente" → Solo habilitado después de verificar correctamente

---

### 📧 Step 3: Verificación Email
**Ruta:** `/registro` (Step 3)

Verificación del correo electrónico mediante código OTP de 6 dígitos.

**Funcionalidades:**
- Auto-envío del código al entrar al step
- Input de 6 dígitos con navegación automática
- Validación automática al completar los 6 dígitos
- Countdown de 10 minutos (formato MM:SS)
- Botón de reenvío (máximo 1 reenvío por sesión)
- Indicador visual de éxito (✓ verde)

**Códigos de prueba:**
- `123456` → Código válido (para desarrollo)
- Cualquier otro → Error "Código incorrecto"

**Navegación:**
- Botón "Atrás" → Regresa al Step 2
- Botón "Siguiente" → Solo habilitado después de verificar correctamente

---

### ✅ Step 4: Resumen y Envío
**Ruta:** `/registro` (Step 4)

Resumen de toda la información ingresada antes de enviar.

**Secciones:**
- **Datos personales:** Nombre completo, teléfono ✓, email ✓
- **Vehículo:** Marca, modelo, año, placas, color
- **Ubicación:** Estado y ciudad

**Navegación:**
- Botón "Atrás" → Regresa al Step 3 para revisar/modificar
- Botón "Enviar solicitud" → Procesa y envía el formulario

---

### 🎉 Step 5: Confirmación
**Ruta:** `/registro` (Step 5 - Automático)

Pantalla de éxito mostrada después de enviar el formulario.

**Incluye:**
- Ícono de éxito (check verde)
- Número de solicitud generado (formato: SPD-2026-XXXXXX)
- Mensaje de confirmación
- Email de contacto
- Tiempo estimado de respuesta (24-48 horas)
- Botón "Regresar al inicio"

---

## Características Técnicas

### 🔄 Persistencia de Datos
- Los datos del Step 1 se guardan en `localStorage` con timestamp
- Duración de cache: 24 horas
- Auto-recuperación al recargar la página
- Limpieza automática después de envío exitoso

### 🎨 Indicadores Visuales
- **Barra de progreso:** Muestra el paso actual (Datos → SMS → Email → Enviar)
- **Estados de pasos:**
  - Gris: No completado
  - Azul oscuro: Activo
  - Verde: Completado ✓
- **Validación de campos:**
  - Rojo con ícono ✗: Error
  - Verde con ícono ✓: Válido

### ⌨️ Experiencia de Usuario
- **Navegación con teclado:** Los inputs OTP permiten navegación con teclas
- **Auto-focus:** Campo activo recibe focus automáticamente
- **Validación en tiempo real:** Campos se validan al perder el focus (blur)
- **Scroll automático:** Al encontrar errores, scroll hacia el primer campo con error

### 🔐 Seguridad
- Códigos OTP se validan del lado del servidor (simulado en dev)
- Límite de reintentos: 1 reenvío por canal (SMS/Email)
- Timeout de códigos: 10 minutos
- Mensaje de protección SSL en footer

---

## Flujo Completo

```
Landing Page (/)
    ↓
┌──────────────────────┐
│  Step 1: Datos       │ ← Validación completa
│  Básicos             │   de todos los campos
└──────────────────────┘
    ↓ Siguiente
┌──────────────────────┐
│  Step 2: SMS OTP     │ ← Verificación 
│  (123456)            │   obligatoria
└──────────────────────┘
    ↓ Siguiente
┌──────────────────────┐
│  Step 3: Email OTP   │ ← Verificación
│  (123456)            │   obligatoria
└──────────────────────┘
    ↓ Siguiente
┌──────────────────────┐
│  Step 4: Resumen     │ ← Revisión final
│                      │
└──────────────────────┘
    ↓ Enviar
┌──────────────────────┐
│  Step 5:             │ ← Confirmación
│  ¡Éxito!             │   automática
└──────────────────────┘
    ↓
Landing Page (/)
```

---

## Integración con Backend

### Endpoints Requeridos

1. **POST /api/otp/send-otp-sms**
   ```json
   {
     "sessionId": "uuid",
     "phoneNumber": "8112345678"
   }
   ```

2. **POST /api/otp/send-otp-email**
   ```json
   {
     "sessionId": "uuid",
     "email": "user@example.com"
   }
   ```

3. **POST /api/otp/validate-otp**
   ```json
   {
     "sessionId": "uuid",
     "channel": "phone|email",
     "code": "123456"
   }
   ```

4. **POST /api/drivers/register**
   ```json
   {
     "firstName": "Juan",
     "middleName": "Carlos",
     "paternalSurname": "Pérez",
     "maternalSurname": "García",
     "telefono": "8112345678",
     "email": "juan@example.com",
     "marca": "Toyota",
     "modelo": "Corolla",
     "anio": "2020",
     "placas": "ABC1234",
     "color": "Blanco",
     "estado": "Nuevo León",
     "ciudad": "Monterrey",
     "comoTeEnteraste": "Redes sociales"
   }
   ```

---

## Personalización

### Cambiar tiempos de expiración
Buscar en `/app/registro/page.tsx`:
```typescript
const [phoneOtpTimer, setPhoneOtpTimer] = useState(600) // 600 = 10 minutos
const [emailOtpTimer, setEmailOtpTimer] = useState(600)
```

### Cambiar límite de reenvíos
Buscar en `/app/registro/page.tsx`:
```typescript
if (phoneResendCount >= 1) { // Cambiar el 1 por el límite deseado
```

### Cambiar código OTP válido (solo dev)
Buscar en `/app/registro/page.tsx`:
```typescript
const verifyPhoneOtp = async (code: string) => {
  if (code === '123456') { // Cambiar código aquí
```

---

## Archivos Importantes

- **`/app/registro/page.tsx`** - Componente wizard principal
- **`/app/registro/registro.css`** - Estilos del wizard y formulario
- **`/app/registro/page_original.tsx.bak`** - Backup del formulario original
- **`/app/landing.css`** - Estilos compartidos (navbar, footer)

---

## Testing

### Flujo de Prueba Exitoso
1. Completa todos los campos del Step 1 con datos válidos
2. Click en "Siguiente"
3. En Step 2, ingresa código: `123456`
4. En Step 3, ingresa código: `123456`
5. Revisa el resumen en Step 4
6. Click en "Enviar solicitud"
7. Verifica la pantalla de confirmación con número de solicitud

### Casos de Prueba
- ❌ Intentar avanzar del Step 1 sin completar campos obligatorios
- ❌ Ingresar código OTP incorrecto (error + limpieza automática)
- ✓ Usar botón "Atrás" para regresar y modificar datos
- ✓ Recargar la página en Step 1 (datos persisten 24h)
- ✓ Intentar reenviar código después del límite (mensaje de error)
- ✓ Esperar expiración del código (habilita botón de reenvío)

---

## Próximos Pasos

- [ ] Integrar con endpoints reales del backend
- [ ] Implementar session_id desde backend
- [ ] Agregar analytics para trackear abandono por step
- [ ] Implementar rate limiting en reenvíos
- [ ] Agregar opción de "Revisar/Editar" en Step 4
- [ ] Implementar recuperación de progreso con sessión del backend
- [ ] Agregar mensajes de error más específicos por tipo de fallo

---

## Soporte

Para dudas o problemas, contactar al equipo de desarrollo SPIDI.

**Última actualización:** Marzo 2026
