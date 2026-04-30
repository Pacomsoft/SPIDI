# SPIDI - Sistema de Gestión Integral de Drivers

Sistema administrativo para la gestión de conductores, capacitaciones, documentos y comunicación en HEB México. Desarrollado con Next.js 15 App Router, arquitectura hexagonal + DDD, autenticación PKCE con Microsoft Entra ID y tema personalizado "HEB V3".

## 🚀 Tecnologías

- **Next.js 15** — Framework de React con App Router (`output: "standalone"`)
- **TypeScript** — Tipado estático
- **Tailwind CSS 4** — Framework de utilidades CSS
- **shadcn/ui** — Componentes de UI reutilizables (tema HEB V3, colores OKLCH)
- **axios** — Cliente HTTP para el flujo PKCE con Microsoft Entra ID
- **idb** — IndexedDB (sesión, tokens, configuración)
- **react-quill-new** — Editor WYSIWYG (React 18 compatible)
- **date-fns** — Manipulación de fechas
- **Lucide React** — Iconos SVG
- **Docker** — Contenedores para desarrollo

## 📋 Módulos Implementados

### 1. 👥 Aspirantes
- **Listado completo** con tabla responsiva y paginación
- **Búsqueda avanzada** con 6 patrones (exacta, normalizada, prefijo, sufijo, contiene, fuzzy ≥85%)
- **Resaltado de términos** en resultados
- **Historial de búsqueda** (localStorage)
- **Detalle completo** con 7 secciones (info personal, contacto, documentos, disponibilidad, etc.)
- **Workflow de propuestas** (Rechazar/Derivar a drivers)
- **Validación inline** con mensajes de error visuales
- **Loading overlays** para prevenir multiclics

### 2. 🚗 Drivers
- **Listado con filtros** y búsqueda inteligente
- **Búsqueda avanzada** (mismo sistema que aspirantes)
- **Detalle con tabs**: Info básica, Documentos, Beneficiarios
- **Gestión de documentos** con:
  - Sistema de vigencia (válido, por vencer en 30 días, vencido)
  - Badges con colores (secondary/primary/destructive)
  - Carga y visualización de archivos
  - Alertas automáticas de vencimiento
- **CRUD de beneficiarios** con validación completa
- **Responsive** optimizado para móvil

### 3. 🎓 Capacitaciones
- **Listado con paginación** y exportación (CSV/Excel)
- **Crear capacitación** con:
  - Editor WYSIWYG (react-quill-new)
  - Tipo: Obligatorio/Opcional/Política de empresa
  - Duración y vigencia
  - Cuestionarios con preguntas de opción múltiple
  - Configuración de retroalimentación
- **Exportar** página actual o todas las capacitaciones
- **Responsive** completo (mobile-first)

### 4. 📢 Comunicación
- **Gestión de quejas** (complaints)
- **Búsqueda automática inteligente** (6 patrones, sin selector manual)
- **Detalle de quejas** con:
  - Información completa del caso
  - Adjuntos (máximo 3 archivos)
  - Validación de archivos
  - Botón de regresar consistente

### 5. 📄 Contratos
- Módulo base implementado
- Preparado para expansión

### 6. 💰 Pagos
- Módulo base implementado  
- Preparado para expansión

### 7. 🏠 Home Dashboard
- Dashboard principal con métricas
- Acceso rápido a módulos

## 🔐 Autenticación — PKCE con Microsoft Entra ID

Autenticación mediante **Authorization Code + PKCE** (flujo de cliente público, sin `client_secret`). No depende de `next-auth`.

### Flujo

1. `InitiateLoginUseCase` genera el code verifier/challenge PKCE y redirige a Microsoft
2. Microsoft redirige a `/validate-token?code=XXX&state=YYY`
3. `useExchangeCode` intercambia el código con Microsoft (via axios) y guarda el MS token en `sessionStorage`
4. Redirige a `/auth/spidi-token`
5. `useGetSpidiToken` envía el MS token al backend SPIDI (`POST /api/v1/authorization/entra-access`) y obtiene la sesión
6. La sesión se persiste en IndexedDB y se redirige al home según rol

### Variables de entorno

```env
NEXT_PUBLIC_MICROSOFT_ENTRA_CLIENT_ID=    # Client ID de la app en Azure AD
NEXT_PUBLIC_MICROSOFT_ENTRA_TENANT_ID=    # Tenant ID
NEXT_PUBLIC_MICROSOFT_ENTRA_REDIRECT_URI= # Ej: https://<domain>/validate-token
NEXT_PUBLIC_API_URL=                       # URL base del backend SPIDI
```

### Roles Disponibles
- **Super Admin** — Acceso total
- **Admin** — Acceso amplio
- **HR** — Recursos humanos
- **Operations** — Operaciones
- **Finance** — Finanzas
- **Viewer** — Solo lectura

### Protección de Rutas
- `AuthGuard` — Verifica sesión en IndexedDB, redirige a `/login` si no hay sesión
- `RoleGuard` / `GuardPage` — Valida permisos por módulo
- Rutas públicas: `/login`, `/denied`
- Rutas protegidas: Todo bajo `/adm`

### Características
✅ PKCE OAuth 2.0 con Microsoft Entra ID  
✅ Sesión persistida en IndexedDB  
✅ Renovación automática de tokens  
✅ Roles con permisos granulares por módulo  
✅ Guard de autenticación y autorización por módulo  
✅ Logout funcional (limpia IndexedDB)

## 🏃 Inicio Rápido

### Opción 1: Con npm (local)

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (HTTPS experimental)
npm run dev

# Build de producción
npm run build

# Servidor de producción (escucha en 127.0.0.1, detrás de nginx)
npm start
```

El servidor de desarrollo estará disponible en `https://localhost:3000`.

> **Nota:** En producción, el servidor escucha en `127.0.0.1` y nginx actúa como reverse proxy SSL en el puerto 443. La `REDIRECT_URI` de Azure AD debe apuntar a `https://<domain>/validate-token`.

### Opción 2: Con Docker

```bash
docker-compose up           # Iniciar
docker-compose down         # Detener
docker-compose up --build   # Reconstruir si cambian dependencias
```

### Flujo de Autenticación

1. Navega a `https://<domain>`
2. Serás redirigido a `/login`
3. Click en "Iniciar sesión con Microsoft"
4. Autentícate en Microsoft Entra ID
5. Serás redirigido a `/validate-token` → `/auth/spidi-token` → home según rol

## ✨ Características Destacadas

### 🔍 Búsqueda Inteligente
Sistema de búsqueda con **6 patrones automáticos**:
1. **Exacta** - Coincidencia completa
2. **Normalizada** - Sin acentos/mayúsculas
3. **Prefijo** - Comienza con el término
4. **Sufijo** - Termina con el término
5. **Contiene** - Incluye el término
6. **Fuzzy** - Coincidencia difusa ≥85%

- Resaltado de términos en resultados
- Historial de búsqueda (localStorage)
- Aplicado en: Aspirantes, Drivers, Complaints

### 📄 Gestión de Documentos
- **Carga de archivos** con validación
- **Sistema de vigencia** inteligente:
  - 🟢 Válido (badge secondary)
  - 🟡 Por vencer en 30 días (badge primary)
  - 🔴 Vencido (badge destructive)
- **Alertas automáticas** de vencimiento
- **Grid responsivo** 2 columnas

### ✏️ Editor WYSIWYG
- **react-quill-new** (React 18 compatible)
- Formato de texto rico
- Contenido HTML sanitizado
- Integrado en Capacitaciones

### 🛡️ Validación y UX
- **Validación inline** con mensajes visuales
- **Loading overlays** para prevenir multiclics
- **Límite de archivos** (ej: máx 3 adjuntos en complaints)
- **Mensajes de error** contextuales
- **Confirmaciones** antes de acciones críticas

### 📱 Responsive Design
- **Mobile-first** en todos los módulos
- **Flex layouts** adaptativos
- **Tablas responsivas** con scroll horizontal
- **Navegación colapsable** en móvil
- **Select y botones** que no desbordan contenedor

- Colores en espacio OKLCH para mejor consistencia perceptual (primary: naranja cálido, secondary: azul)
- Modo claro y oscuro configurados
- Radio de borde: 1.1rem
- Fuente principal: Inter

## 📂 Estructura del Proyecto

El proyecto sigue **Arquitectura Hexagonal + DDD** estrictamente. Toda la lógica de negocio vive en `modules/`, no en `app/`.

```
.
├── app/                              # Rutas Next.js (solo enrutamiento)
│   ├── layout.tsx                    # Layout raíz
│   ├── page.tsx                      # Redirect condicional
│   ├── globals.css                   # Estilos globales y tema HEB V3
│   ├── login/                        # Página de login
│   ├── denied/                       # Acceso denegado
│   ├── validate-token/               # Callback OAuth PKCE (intercambio con Microsoft)
│   ├── auth/spidi-token/             # Intercambio MS token → SPIDI session
│   ├── registro/                     # Flujo de registro
│   └── adm/                         # Rutas protegidas (ver sección de refactoring)
├── modules/                          # Lógica de negocio (hexagonal + DDD)
│   ├── login/                        # Autenticación PKCE
│   ├── adm/                          # Layout admin, sidebar, guards de módulo
│   ├── aspirantes/                   # Módulo aspirantes ✅ refactorizado
│   ├── drivers/                      # Módulo drivers ✅ refactorizado
│   ├── confirmacion/                 # Confirmación de acciones
│   ├── denied/                       # Vista de acceso denegado
│   ├── registro/                     # Registro de conductores
│   ├── verificar/                    # Verificación OTP
│   └── shared/                       # Cross-cutting: HTTP client, IndexedDB, hooks
├── components/
│   ├── ui/                           # shadcn/ui (NO editar directamente)
│   └── app-topbar.tsx                # Topbar con breadcrumb
├── lib/
│   ├── auth.ts                       # authProvider (logout, isAuthenticated, getSession)
│   └── utils.ts                      # Utilidades (cn, normalizeText)
├── .github/
│   ├── copilot-instructions.md       # Instrucciones para GitHub Copilot
│   └── agents/webadmin.agent.md      # Agente especializado en UI/UX
├── next.config.mjs                   # trailingSlash, standalone, security headers
├── components.json                   # Configuración shadcn/ui
└── package.json
```

### Estructura de cada módulo (hexagonal)

```
modules/<name>/
├── domain/            # Sin dependencias externas: contratos, entidades, errores
├── application/       # Casos de uso, hooks, vistas (solo depende de domain/)
└── infrastructure/    # Implementaciones concretas + dependency-injection.ts
```

## 🔄 Rutas pendientes de refactorizar a arquitectura hexagonal

Las siguientes rutas en `app/adm/` tienen lógica de negocio, estado y llamadas HTTP directamente en los archivos de página (`page.tsx`). Deben migrarse al patrón hexagonal: crear un módulo en `modules/`, separar dominio/aplicación/infraestructura y que `app/adm/<ruta>/page.tsx` solo monte el view correspondiente.

| Ruta | Archivo | Estado |
|------|---------|--------|
| `/adm/capacitacion` | `app/adm/capacitacion/page.tsx` | ⚠️ Lógica inline (useState, fetch, sorting, export) |
| `/adm/capacitacion/create` | `app/adm/capacitacion/create/page.tsx` | ⚠️ Lógica inline (WYSIWYG, form, IndexedDB directo) |
| `/adm/capacitacion/[id]` | `app/adm/capacitacion/[id]/page.tsx` | ⚠️ Lógica inline (detalle, fetch por ID) |
| `/adm/comunicacion` | `app/adm/comunicacion/page.tsx` | ⚠️ Placeholder sin módulo hexagonal |
| `/adm/complaints` | `app/adm/complaints/page.tsx` | ⚠️ Lógica inline (lista, filtros, búsqueda, fechas) |
| `/adm/complaints/[id]` | `app/adm/complaints/[id]/page.tsx` | ⚠️ Lógica inline (detalle, adjuntos, respuestas) |
| `/adm/contratos` | `app/adm/contratos/page.tsx` | ⚠️ Placeholder sin módulo hexagonal |
| `/adm/pagos` | `app/adm/pagos/page.tsx` | ⚠️ Placeholder sin módulo hexagonal |

**Rutas ya refactorizadas** (usar como referencia):

| Ruta | Módulo | Estado |
|------|--------|--------|
| `/adm/home` | `modules/adm` | ✅ Hexagonal |
| `/adm/aspirantes` | `modules/aspirantes` | ✅ Hexagonal |
| `/adm/aspirantes/[id]` | `modules/aspirantes` | ✅ Hexagonal |
| `/adm/drivers` | `modules/drivers` | ✅ Hexagonal |
| `/adm/drivers/[id]` | `modules/drivers` | ✅ Hexagonal |

**Patrón a seguir al refactorizar:**

```
modules/<nombre>/
├── domain/contracts/          # Interfaces, DTOs
├── domain/entities/           # Entidades de dominio
├── application/use-cases/     # Casos de uso (IUseCase<TInput, TOutput>)
├── application/hooks/         # Hooks de React (reciben use-cases como parámetros)
├── application/presentation/  # Views + components (solo presentación)
└── infrastructure/
    ├── services/              # Implementaciones concretas
    └── dependency-injection.ts # Composición de dependencias
```

```tsx
// app/adm/<ruta>/page.tsx — solo esto:
import { XxxView } from '@/modules/<nombre>/application/presentation/views/xxx.view';
import { createXxxModule } from '@/modules/<nombre>/infrastructure/dependency-injection';

const module = createXxxModule();
export default function Page() {
  return <XxxView useCases={module.useCases} />;
}
```

**Componentes instalados**:
- Alert, Avatar, Badge, Breadcrumb, Button
- Calendar, Card, Date Range Picker
- Dropdown Menu, Input, Label
- Popover, Select, Separator
- Sheet, Sidebar, Skeleton
- Table, Tabs, Textarea, Tooltip

Para agregar más componentes:

```bash
npx shadcn@latest add [component-name]
# Ejemplo: npx shadcn@latest add dialog
```

Los componentes se agregan automáticamente a `components/ui/` con el tema HEB V3.

### Variantes de Badge
- `default` - Azul (primary, alertas "por vencer")
- `secondary` - Gris (estados normales/válidos)
- `destructive` - Rojo (errores/vencidos)

### Patrones de Botones
- **Back button** - `variant="outline"` + `size="icon"` (solo icono)
- **Primary action** - `variant="default"`
- **Secondary action** - `variant="outline"`

## 🔧 Personalización del Tema

El proyecto utiliza el tema "HEB V3" con colores OKLCH en [app/globals.css](app/globals.css):

```css
:root {
  --primary: 58.48% 0.2211 29.1632;    /* Naranja cálido */
  --secondary: 55.93% 0.123 237.4842;  /* Azul */
  --background: 97.33% 0.007 88.6423;  /* Gris muy claro */
  --muted: 93.98% 0.011 88.6423;       /* Gris claro */
  --card: 100% 0 0;                     /* Blanco */
  /* ... más variables */
}
```

**Ventajas del tema**:
- ✅ Colores OKLCH para consistencia perceptual
- ✅ Modo oscuro automático con `.dark`
- ✅ Radio de borde: 1.1rem
- ✅ Fuente: Inter (Google Fonts)
- ✅ Variables CSS para fácil modificación

## 🐳 Docker

El proyecto incluye `docker-compose.yml` para desarrollo:

**Características**:
- Node 20 Alpine (imagen ligera)
- Hot-reload con WATCHPACK_POLLING
- Volúmenes para node_modules y .next
- Puerto 3000 expuesto
- Instalación automática de dependencias

**Uso**:
```bash
docker-compose up        # Iniciar
docker-compose down      # Detener
docker-compose up --build # Reconstruir
```

## 🚀 Estado del Proyecto

### ✅ Implementado
- ✅ Autenticación PKCE con Microsoft Entra ID (sin next-auth)
- ✅ Sistema de roles y permisos granulares por módulo
- ✅ Módulo Aspirantes — listado, detalle, workflow, búsqueda avanzada (hexagonal)
- ✅ Módulo Drivers — listado, detalle, documentos, beneficiarios (hexagonal)
- ✅ Layout admin — sidebar, topbar, guards de módulo
- ✅ Sesión persistida en IndexedDB con renovación automática
- ✅ Búsqueda inteligente con 6 patrones (exacta, normalizada, prefijo, sufijo, contiene, fuzzy ≥85%)
- ✅ Sistema de alertas de documentos vencidos
- ✅ Exportación (CSV/Excel) en listados
- ✅ Responsive design mobile-first
- ✅ Tema HEB V3 con colores OKLCH

### 🔄 Pendiente de refactorizar a hexagonal
- ⚠️ Módulo Capacitaciones (`app/adm/capacitacion/`)
- ⚠️ Módulo Comunicación (`app/adm/comunicacion/`)
- ⚠️ Módulo Complaints (`app/adm/complaints/`)
- ⚠️ Módulo Contratos (`app/adm/contratos/`) — placeholder
- ⚠️ Módulo Pagos (`app/adm/pagos/`) — placeholder

Ver tabla detallada en la sección **Rutas pendientes de refactorizar**.

## 📄 Documentación Adicional

- [docs/RN_SPIDI.md](docs/RN_SPIDI.md) — Notas de release y changelog
- [.github/copilot-instructions.md](.github/copilot-instructions.md) — Instrucciones de arquitectura para GitHub Copilot

## 🤝 Para Desarrolladores

### Convenciones de Código
- **TypeScript strict mode** habilitado
- Archivos en `kebab-case`, componentes en `PascalCase`, hooks con prefijo `use`
- **Imports organizados**: React → Next → Third-party → módulos internos → local
- Nunca importar desde `infrastructure/` dentro de `application/` o `domain/`
- Toda lógica de negocio en `modules/`, los `page.tsx` solo montan views

### Agregar shadcn Components
```bash
npx shadcn@latest add <component>
# Luego crear wrapper en modules/<name>/application/presentation/ui/
```

### Git Workflow
```bash
git checkout -b feature/nombre-feature
git commit -m "feat: descripción del cambio"
git push -u origin feature/nombre-feature
```

### Validación Local
```bash
npm run build    # Verificar que compila sin errores TS
npm run lint     # ESLint
```

## 📞 Soporte

Para preguntas o reporte de bugs, contacta al equipo de desarrollo.

---

**SPIDI** — Sistema de Gestión Integral de Drivers | HEB México