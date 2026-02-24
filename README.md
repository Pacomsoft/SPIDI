# SPIDI

Sistema administrativo con autenticación SSO mock, desarrollado con Next.js 15, shadcn/ui, Tailwind CSS, y el tema personalizado "HEB V3".

## 🚀 Tecnologías

- **Next.js 15** - Framework de React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS 3.4** - Framework de utilidades CSS
- **shadcn/ui** - Componentes de UI reutilizables
- **Tema HEB V3** - Tema personalizado con colores OKLCH
- **Lucide React** - Iconos SVG

## 🔐 Sistema de Autenticación

El proyecto implementa un flujo de autenticación SSO mock que simula la integración con App Directory.

### Páginas

- **`/`** - Redirect automático según estado de autenticación
- **`/login`** - Pantalla de acceso con SSO (sin captura de credenciales)
- **`/admin/home`** - Dashboard protegido del administrador
- **`/admin/*`** - Rutas protegidas con sidebar y topbar

### Características

✅ Login SSO mock (preparado para integración real)  
✅ Protección automática de rutas `/admin/*`  
✅ Sesión con expiración de 8 horas  
✅ Logout funcional  
✅ Renovación automática de sesión  
✅ UI responsive mobile-first  

Ver documentación completa: [docs/AUTH_FLOW.md](docs/AUTH_FLOW.md)

## 🏃 Inicio Rápido

```bash
# Instalar dependencias (si no están instaladas)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El servidor estará disponible en [http://localhost:3000](http://localhost:3000)

### Flujo de Demo

1. Navega a `http://localhost:3000`
2. Serás redirigido a `/login`
3. Click en "Iniciar sesión" 
4. Serás redirigido a `/admin/home` con sesión activa
5. Explora el sidebar con las opciones del sistema
6. Click "Cerrar Sesión" para volver al login

## 🎨 Tema Personalizado

El proyecto utiliza el tema "HEB V3" de [tweakcn.com](https://tweakcn.com/r/themes/cml9xkb2s000104kz419t5qfe) con:

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
│   ├── layout.tsx           # Layout raíz (sin sidebar)
│   ├── page.tsx             # Redirect condicional
│   ├── login/
│   │   └── page.tsx         # Pantalla de login SSO
│   ├── admin/
│   │   ├── layout.tsx       # Layout protegido con sidebar
│   │   └── home/
│   │       └── page.tsx     # Dashboard del admin
│   └── globals.css          # Estilos globales y variables CSS
├── components/
│   ├── ui/                  # Componentes de shadcn/ui
│   ├── app-sidebar.tsx      # Sidebar con menú y logout
│   ├── app-topbar.tsx       # Topbar con breadcrumb y notificaciones
│   └── protected-route.tsx  # HOC para protección de rutas
├── lib/
│   ├── auth.ts              # Auth provider mock
│   └── utils.ts             # Utilidades (función cn)
├── hooks/
│   └── use-mobile.tsx       # Hook para detectar mobile
├── docs/
│   └── AUTH_FLOW.md         # Documentación del flujo de auth
├── components.json          # Configuración de shadcn/ui
├── tailwind.config.ts       # Configuración de Tailwind con tema
└── tsconfig.json            # Configuración de TypeScript
```

## 🎨 Uso de shadcn/ui

**Componentes instalados**:
- Sidebar, Avatar, Dropdown Menu, Breadcrumb, Badge, Button
- Card, Separator, Sheet, Tooltip, Input, Skeleton

Para agregar más componentes:

```bash
npx shadcn@latest add [component-name]
# Ejemplo: npx shadcn@latest add dialog
```

Los componentes se agregan automáticamente a `components/ui/` con el tema HEB V3.

## 🔧 Personalización del Tema

El tema utiliza colores OKLCH en [app/globals.css](app/globals.css):

```css
:root {
  --primary: 58.48% 0.2211 29.1632;    /* Naranja cálido */
  --secondary: 55.93% 0.123 237.4842;  /* Azul */
  --background: 97.33% 0.007 88.6423;  /* Gris muy claro */
  /* ... más variables */
}
```

**Ventajas del tema**:
- ✅ Colores OKLCH para consistencia perceptual
- ✅ Modo oscuro automático con `.dark`
- ✅ Radio de borde: 1.1rem
- ✅ Fuente: Inter (Google Fonts)

## 🚀 Próximos Pasos

### Para Desarrollo
1. ✅ Sistema de autenticación mock implementado
2. ⏳ Crear páginas para: Productos, Pedidos, Usuarios, etc.
3. ⏳ Implementar formularios con validación
4. ⏳ Agregar tablas de datos con sorting/filtering
5. ⏳ Implementar modales y dialogs

### Para Producción (Integración SSO Real)
Ver documentación detallada en [docs/AUTH_FLOW.md](docs/AUTH_FLOW.md)

1. Configurar variables de entorno de App Directory
2. Implementar redirect a OAuth provider
3. Crear callback handler (`/auth/callback`)
4. Implementar token exchange
5. Agregar refresh token logic
6. Migrar sesión de localStorage a httpOnly cookies
7. Implementar CSRF protection

## 📝 Scripts Disponibles

```bash
npm run dev      # Desarrollo (http://localhost:3000)
npm run build    # Build para producción
npm start        # Servidor de producción
npm run lint     # Verificar código
```
