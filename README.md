# SPIDI - Sistema de Gestión Integral de Drivers

Sistema administrativo completo para la gestión de conductores, capacitaciones, documentos y comunicación. Desarrollado con Next.js 15, shadcn/ui, Tailwind CSS y tema personalizado "HEB V3".

## 🚀 Tecnologías

- **Next.js 15.5.12** - Framework de React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS 4.0** - Framework de utilidades CSS
- **shadcn/ui** - Componentes de UI reutilizables
- **react-quill-new** - Editor WYSIWYG (React 18 compatible)
- **date-fns** - Manipulación de fechas
- **Lucide React** - Iconos SVG
- **Docker** - Contenedores para desarrollo

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

## 🔐 Sistema de Autenticación y Roles

El proyecto implementa un sistema de roles y permisos por módulo:

### Roles Disponibles
- **Super Admin** - Acceso total
- **Admin** - Acceso amplio
- **HR** - Recursos humanos
- **Operations** - Operaciones
- **Finance** - Finanzas
- **Viewer** - Solo lectura

### Permisos por Módulo
Cada rol tiene permisos específicos (read, create, update, delete) para cada módulo. Ver [lib/roles.ts](lib/roles.ts).

### Protección de Rutas
- **ProtectedRoute** - Verifica autenticación
- **RoleGuard** - Valida permisos por módulo
- Rutas públicas: `/login`, `/denied`
- Rutas protegidas: Todo bajo `/(dashboard)`

### Características de Autenticación
✅ Login SSO mock (preparado para integración real)  
✅ Sistema de roles con permisos granulares  
✅ Sesión con expiración de 8 horas  
✅ Logout funcional  
✅ Página de acceso denegado (`/denied`)  
✅ Renovación automática de sesión  
✅ UI responsive mobile-first  

Ver documentación completa: [docs/AUTH_FLOW.md](docs/AUTH_FLOW.md)

## 🏃 Inicio Rápido

### Opción 1: Con npm (local)

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El servidor estará disponible en [http://localhost:3000](http://localhost:3000)

### Opción 2: Con Docker

```bash
# Iniciar contenedor (instala deps automáticamente)
docker-compose up

# Detener
docker-compose down

# Reconstruir si cambias dependencias
docker-compose up --build
```

### Flujo de Demo

1. Navega a `http://localhost:3000`
2. Serás redirigido a `/login`
3. Click en "Iniciar sesión" (SSO mock)
4. Accederás al dashboard `/home`
5. Explora los módulos desde el sidebar
6. Prueba la búsqueda avanzada en Aspirantes/Drivers
7. Crea una capacitación con el editor WYSIWYG
8. Revisa documentos y alertas de vencimiento en Drivers
9. Click "Cerrar Sesión" para volver al login

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

- Colores en espacio OKLCH para mejor consistencia perceptual
- Modo claro y oscuro configurados
- Radio de borde: 1.1rem
- Fuente principal: Inter
- Variables CSS personalizadas para fácil modificación

### Colores Principales

**Modo Claro:**
- Primary: Naranja cálido
- Secondary: Azul
- Background: Gris muy claro
- Foreground: Gris oscuro

**Modo Oscuro:**
- Primary: Naranja cálido
- Secondary: Azul
- Background: Gris oscuro
- Foreground: Blanco

## 🏃 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Construcción para producción
npm run build

# Iniciar servidor de producción
npm start

# Linting
npm run lint
```

## 📂 Estructura del Proyecto

```
.
├── app/
│   ├── layout.tsx                    # Layout raíz con providers
│   ├── page.tsx                      # Redirect condicional
│   ├── globals.css                   # Estilos globales y tema
│   ├── login/
│   │   └── page.tsx                  # Login SSO mock
│   ├── denied/
│   │   └── page.tsx                  # Acceso denegado
│   └── (dashboard)/                  # Rutas protegidas con layout
│       ├── layout.tsx                # Layout con sidebar y topbar
│       ├── home/
│       │   └── page.tsx              # Dashboard principal
│       ├── aspirantes/
│       │   ├── page.tsx              # Listado de aspirantes
│       │   └── [id]/
│       │       └── page.tsx          # Detalle de aspirante
│       ├── drivers/
│       │   ├── page.tsx              # Listado de drivers
│       │   └── [id]/
│       │       └── page.tsx          # Detalle de driver (2757 líneas)
│       ├── capacitacion/
│       │   ├── page.tsx              # Listado de capacitaciones
│       │   └── create/
│       │       └── page.tsx          # Crear capacitación
│       ├── comunicacion/
│       │   └── page.tsx              # Gestión de comunicación
│       ├── complaints/
│       │   ├── page.tsx              # Listado de quejas
│       │   └── [id]/
│       │       └── page.tsx          # Detalle de queja
│       ├── contratos/
│       │   └── page.tsx              # Gestión de contratos
│       └── pagos/
│           └── page.tsx              # Gestión de pagos
├── components/
│   ├── ui/                           # shadcn/ui components
│   │   ├── alert.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── date-range-picker.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── popover.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   └── tooltip.tsx
│   ├── app-sidebar.tsx               # Sidebar con menú y logout
│   ├── app-topbar.tsx                # Topbar con breadcrumb
│   ├── protected-route.tsx           # Protección de autenticación
│   └── role-guard.tsx                # Validación de permisos
├── lib/
│   ├── auth.ts                       # Auth provider mock
│   ├── roles.ts                      # Sistema de roles y permisos
│   └── utils.ts                      # Utilidades (cn, normalizeText)
├── hooks/
│   └── use-mobile.tsx                # Hook para detectar mobile
├── docs/
│   ├── AUTH_FLOW.md                  # Flujo de autenticación
│   └── RN_SPIDI.md                   # Notas de release
├── docker-compose.yml                # Configuración Docker
├── .dockerignore                     # Archivos ignorados por Docker
├── components.json                   # Configuración shadcn/ui
├── tailwind.config.ts                # Configuración Tailwind + tema
├── next.config.mjs                   # Configuración Next.js
├── postcss.config.js                 # PostCSS config
├── tsconfig.json                     # TypeScript config
└── package.json                      # Dependencias y scripts
```

## 🎨 Uso de shadcn/ui

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

## 📝 Scripts Disponibles

```bash
npm run dev      # Desarrollo (http://localhost:3000)
npm run build    # Build para producción
npm start        # Servidor de producción
npm run lint     # Verificar código
```
## 📦 Dependencias Principales

```json
{
  "next": "^15.5.12",
  "react": "^18",
  "react-dom": "^18",
  "react-quill-new": "^3.8.3",
  "date-fns": "^4.1.0",
  "lucide-react": "^0.575.0",
  "@radix-ui/react-*": "múltiples componentes",
  "tailwindcss": "^4.0.0"
}
```

## 🚀 Estado del Proyecto

### ✅ Implementado (v1.2)
- ✅ Sistema de autenticación SSO mock
- ✅ Sistema de roles y permisos granulares
- ✅ Módulo Aspirantes (completo con búsqueda avanzada)
- ✅ Módulo Drivers (completo con documentos y beneficiarios)
- ✅ Módulo Capacitaciones (completo con editor WYSIWYG)
- ✅ Módulo Comunicación/Complaints (completo)
- ✅ Búsqueda inteligente con 6 patrones
- ✅ Sistema de alertas de documentos vencidos
- ✅ Validación inline con mensajes visuales
- ✅ Loading overlays en todas las acciones
- ✅ Responsive design mobile-first
- ✅ Docker para desarrollo
- ✅ Tema HEB V3 con OKLCH

### 🔄 En Base (para expansión)
- 🔄 Módulo Contratos
- 🔄 Módulo Pagos

### 📋 Próximos Pasos Sugeridos

#### Corto Plazo
1. Conectar a API/Base de datos real
2. Implementar módulo Contratos (formularios y workflows)
3. Implementar módulo Pagos (cálculos y reportes)
4. Agregar notificaciones push
5. Implementar sistema de reportes

#### Mediano Plazo
1. Migrar autenticación a SSO real (App Directory)
2. Implementar backend con Next.js API Routes
3. Agregar sincronización en tiempo real
4. Sistema de auditoría y logs
5. Exportación avanzada (PDF, Excel mejorado)

#### Largo Plazo
1. Dashboard con métricas y KPIs
2. Sistema de notificaciones por email
3. App móvil nativa (React Native)
4. Integración con sistemas externos
5. Machine Learning para predicciones

## 📄 Documentación Adicional

- [AUTH_FLOW.md](docs/AUTH_FLOW.md) - Flujo de autenticación detallado
- [RN_SPIDI.md](docs/RN_SPIDI.md) - Notas de release y changelog

## 🤝 Para Desarrolladores

### Convenciones de Código
- **TypeScript strict mode** habilitado
- **Componentes funcionales** con hooks
- **Naming**: PascalCase para componentes, camelCase para funciones/variables
- **Imports organizados**: React → Next → Third-party → Local
- **Comments**: JSDoc para funciones complejas

### Estructura de Archivos
- Un componente por archivo
- Co-locate: componentes relacionados en misma carpeta
- `page.tsx` para rutas, `layout.tsx` para layouts
- Componentes UI en `components/ui/`
- Lógica de negocio en `lib/`

### Git Workflow
```bash
git checkout -b feature/nombre-feature
git add .
git commit -m "feat: descripción del cambio"
git push -u origin feature/nombre-feature
```

### Testing Local
1. Verificar que `npm run build` funcione sin errores
2. Probar en diferentes navegadores
3. Validar responsive en DevTools (móvil, tablet, desktop)
4. Verificar console para warnings/errors

## 📞 Soporte

Para preguntas o reporte de bugs, contacta al equipo de desarrollo.

---

**SPIDI v1.2** - Sistema de Gestión Integral de Drivers  
Desarrollado con ❤️ usando Next.js 15 y shadcn/ui