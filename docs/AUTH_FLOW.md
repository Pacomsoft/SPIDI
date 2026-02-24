# Sistema de Login SSO Mock

Este documento describe el flujo de autenticación implementado en el proyecto SPIDI.

## 🔐 Arquitectura de Autenticación

### Páginas Principales

1. **`/` (Raíz)**: Redirect automático
   - Si está autenticado → `/admin/home`
   - Si no está autenticado → `/login`

2. **`/login`**: Pantalla de acceso SSO
   - Mensaje de bienvenida corporativo
   - Botón "Iniciar sesión"
   - Simula redirect a App Directory
   - Sin campos de usuario/contraseña

3. **`/admin/*`**: Páginas protegidas
   - Requieren sesión activa
   - Redirect automático a `/login` si no hay sesión
   - Incluyen sidebar y topbar

## 📁 Estructura de Archivos

```
lib/
├── auth.ts                    # Auth provider mock con funciones de sesión

components/
├── protected-route.tsx        # HOC para protección de rutas
├── app-sidebar.tsx           # Sidebar con logout
└── app-topbar.tsx            # Topbar con notificaciones

app/
├── layout.tsx                # Layout raíz (sin sidebar)
├── page.tsx                  # Redirect condicional
├── login/
│   └── page.tsx              # Pantalla de login SSO
└── admin/
    ├── layout.tsx            # Layout con sidebar + protección
    └── home/
        └── page.tsx          # Home del admin
```

## 🔄 Flujo de Usuario

### 1. Login
```
Usuario → "/" 
  ↓
Verifica sesión
  ↓ (no autenticado)
Redirect → "/login"
  ↓
Click "Iniciar sesión"
  ↓
Simula delay (600ms)
  ↓
Crear sesión mock en localStorage
  ↓
Redirect → "/admin/home"
```

### 2. Sesión Activa
- **Duración**: 8 horas (configurable)
- **Almacenamiento**: localStorage
- **Renovación**: Automática cada 5 minutos si está activo
- **Datos guardados**:
  ```json
  {
    "userId": "mock-user-123",
    "userName": "Juan Pérez",
    "userRole": "Administrador",
    "expiresAt": 1234567890
  }
  ```

### 3. Logout
```
Usuario → Click "Cerrar Sesión" (sidebar/topbar)
  ↓
authProvider.logout()
  ↓
Borrar localStorage
  ↓
Redirect → "/login"
```

## 🛡️ Protección de Rutas

### Componente `ProtectedRoute`
- Verifica autenticación en cada render
- Redirect automático a `/login` si no hay sesión
- Guarda ruta actual para redirigir después del login
- Renueva sesión automáticamente

### Uso
```tsx
// app/admin/layout.tsx
import { ProtectedRoute } from "@/components/protected-route"

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute>
      {/* Contenido protegido */}
    </ProtectedRoute>
  )
}
```

## 🔌 Auth Provider API

### `authProvider.startLogin()`
Inicia el proceso de login SSO (actualmente mock)

```typescript
await authProvider.startLogin()
// TODO: Integrar redirect real a App Directory
// window.location.href = process.env.NEXT_PUBLIC_APP_DIRECTORY_URL
```

### `authProvider.logout()`
Cierra la sesión actual

```typescript
authProvider.logout()
router.push("/login")
```

### `authProvider.getSession()`
Obtiene la sesión actual

```typescript
const session = authProvider.getSession()
// Retorna: { userId, userName, userRole, expiresAt } | null
```

### `authProvider.isAuthenticated()`
Verifica si hay sesión válida

```typescript
if (authProvider.isAuthenticated()) {
  // Usuario autenticado
}
```

### `authProvider.renewSession()`
Extiende la expiración de la sesión

```typescript
authProvider.renewSession()
// Añade 8 horas más desde ahora
```

## 🎨 UI/UX

### Pantalla de Login

**Diseño**:
- Card centrada con logo SPIDI
- Título: "Bienvenido al Sitio Administrativo"
- Subtítulo: "Inicia sesión con tu cuenta corporativa..."
- Botón primario con estado loading
- Texto de ayuda: "Serás redirigido a App Directory"

**Estados del botón**:
- Normal: "Iniciar sesión"
- Loading: "Redirigiendo..." + spinner

### Home del Admin

**Muestra**:
- Badge "MODO MOCK" para indicar desarrollo
- Información del usuario actual
- Rol del usuario
- Tiempo de expiración de sesión
- Notas para integración con App Directory

## 🚀 Próximos Pasos (Integración Real)

### 1. Configurar Variables de Entorno
```env
# .env.local
NEXT_PUBLIC_APP_DIRECTORY_URL=https://auth.empresa.com/oauth/authorize
APP_DIRECTORY_CLIENT_ID=your_client_id
APP_DIRECTORY_CLIENT_SECRET=your_client_secret
APP_DIRECTORY_CALLBACK_URL=https://tu-app.com/auth/callback
```

### 2. Implementar Redirect a App Directory

Modificar `lib/auth.ts`:

```typescript
startLogin: async (): Promise<void> => {
  // Construir URL de autorización
  const authUrl = new URL(process.env.NEXT_PUBLIC_APP_DIRECTORY_URL!)
  authUrl.searchParams.append('client_id', process.env.APP_DIRECTORY_CLIENT_ID!)
  authUrl.searchParams.append('redirect_uri', process.env.APP_DIRECTORY_CALLBACK_URL!)
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('scope', 'openid profile email')
  
  // Redirigir a App Directory
  window.location.href = authUrl.toString()
}
```

### 3. Crear Callback Handler

```typescript
// app/auth/callback/page.tsx
"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const code = searchParams.get('code')
    
    if (code) {
      // Intercambiar código por token
      fetch('/api/auth/token', {
        method: 'POST',
        body: JSON.stringify({ code })
      })
      .then(res => res.json())
      .then(data => {
        // Guardar token y crear sesión
        authProvider.setSession(data)
        router.push('/admin/home')
      })
    }
  }, [searchParams, router])
  
  return <div>Autenticando...</div>
}
```

### 4. Crear API Route para Token Exchange

```typescript
// app/api/auth/token/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { code } = await request.json()
  
  // Intercambiar código por token con App Directory
  const tokenResponse = await fetch(process.env.APP_DIRECTORY_TOKEN_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.APP_DIRECTORY_CLIENT_ID!,
      client_secret: process.env.APP_DIRECTORY_CLIENT_SECRET!,
      redirect_uri: process.env.APP_DIRECTORY_CALLBACK_URL!
    })
  })
  
  const tokens = await tokenResponse.json()
  
  // Obtener información del usuario
  const userResponse = await fetch(process.env.APP_DIRECTORY_USERINFO_URL!, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  })
  
  const user = await userResponse.json()
  
  return NextResponse.json({
    userId: user.sub,
    userName: user.name,
    userRole: user.role || 'Usuario',
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in * 1000)
  })
}
```

### 5. Implementar Refresh Token

```typescript
// En authProvider
renewSession: async (): Promise<void> => {
  const session = authProvider.getSession()
  
  if (!session?.refreshToken) {
    authProvider.logout()
    return
  }
  
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: session.refreshToken })
    })
    
    const newSession = await response.json()
    authProvider.setSession(newSession)
  } catch {
    authProvider.logout()
  }
}
```

## 📝 Testing

### Test Login Flow
1. Navegar a `http://localhost:3000`
2. Verificar redirect a `/login`
3. Click "Iniciar sesión"
4. Verificar loading state (600ms)
5. Verificar redirect a `/admin/home`
6. Verificar información de sesión mostrada

### Test Protected Routes
1. Cuando no hay sesión, navegar a `/admin/home`
2. Verificar redirect a `/login`
3. Login exitoso
4. Navegar a `/admin/home`
5. Verificar acceso permitido

### Test Logout
1. Login exitoso
2. Click "Cerrar Sesión" en sidebar
3. Verificar redirect a `/login`
4. Verificar sesión eliminada
5. Intentar acceder a `/admin/home`
6. Verificar redirect a `/login`

### Test Session Expiration
1. Login exitoso
2. Modificar `SESSION_DURATION` a 10 segundos en `lib/auth.ts`
3. Esperar 10+ segundos
4. Refresh página o navegar
5. Verificar redirect automático a `/login`

## ⚠️ Notas de Seguridad

### En Modo Mock (Actual)
- ✅ Sesión en localStorage (aceptable para desarrollo)
- ✅ Sin credenciales hardcodeadas
- ✅ Expiración de sesión implementada
- ⚠️ Sin tokens reales
- ⚠️ Sin encriptación

### En Producción (Recomendaciones)
- 🔒 Usar httpOnly cookies para tokens
- 🔒 Implementar CSRF protection
- 🔒 Usar HTTPS obligatorio
- 🔒 Implementar rate limiting
- 🔒 Logs de auditoría de autenticación
- 🔒 Refresh token rotation
- 🔒 Logout en todos los dispositivos
- 🔒 Detección de sesiones anómalas

## 🎯 Estado Actual

✅ **Implementado**:
- Login mock con SSO placeholder
- Protección de rutas /admin/*
- Sesión mock (8h duración)
- Logout funcional
- Redirect condicional en raíz
- UI/UX completa
- Estados de loading

⏳ **Pendiente** (Integración Real):
- Redirect a App Directory
- Callback handler
- Token exchange
- Refresh token
- API routes de autenticación
- Variables de entorno
- Manejo de errores de OAuth
