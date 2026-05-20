# UI/UX Changelog — Rama de adecuaciones visuales

> Documento generado para facilitar el merge con ramas paralelas.  
> Describe **qué se cambió, dónde y por qué** en cada adecuación visual/funcional aplicada en esta rama.

---

## Índice

1. [Login](#1-login)
2. [Global Loading](#2-global-loading)
3. [Home View](#3-home-view)
4. [Sidebar](#4-sidebar)
5. [Breadcrumb](#5-breadcrumb)
6. [Aspirantes — Filtros](#6-aspirantes--filtros)
7. [Drivers — Filtros](#7-drivers--filtros)
8. [Aspirantes — Repositorio](#8-aspirantes--repositorio)
9. [Drivers — Upload Document Modal](#9-drivers--upload-document-modal)
10. [Drivers — Receipt Preview Sheet](#10-drivers--receipt-preview-sheet)
11. [Drivers — Change Status (toasts + mock)](#11-drivers--change-status-toasts--mock)
12. [Drivers — Documentos Vencidos (Sheet de resumen)](#12-drivers--documentos-vencidos-sheet-de-resumen)
13. [Archivos nuevos creados](#13-archivos-nuevos-creados)

---

## 1. Login

**Archivo:** `modules/login/application/presentation/components/login-card/index.tsx`  
**Estilos:** `modules/login/application/presentation/components/login-card/style.module.scss`

| Qué | Por qué |
|---|---|
| Logo: reemplazado círculo con "S" por `<SpidiLogo size={44} className="text-[#3E4C5E]" />` | El círculo era placeholder; el SVG del logo es la identidad real de SPIDI |
| Título cambiado a `"Te damos la bienvenida"` | Texto anterior era redundante con la descripción |
| Descripción reescrita: `"Portal Administrativo · Gestión centralizada de aspirantes, drivers, pagos, capacitaciones y documentación operativa."` | Más informativa y enterprise |
| Pills de módulos eliminadas | Redundantes con la descripción de texto |
| Sección de ayuda (separador + ícono teléfono + número) eliminada | Ruido visual innecesario en el login |
| `shadow-lg`, `border-border/60`, `backdrop-filter blur(4px)` en fondo | Look enterprise más refinado |
| `ShieldCheck` en footer | Refuerza seguridad institucional |
| Tipografía: eliminados tamaños arbitrarios (`text-[10px]`, `text-[11px]`) | Alineación a escala Tailwind estándar del proyecto |

> **Nota de color:** `#3E4C5E` es la identidad SPIDI (azul grisáceo). `--primary` del tema es rojo HEB — son colores distintos e intencionales.

---

## 2. Global Loading

**Archivo:** `modules/shared/application/presentation/components/global-loading/index.tsx`  
**Estilos:** `modules/shared/application/presentation/components/global-loading/style.module.scss`

| Qué | Por qué |
|---|---|
| Overlay: `color-mix(in oklch, var(--background) 85%, transparent)` + `backdrop-filter: blur(4px)` | Reemplaza fondo negro sólido (`#8080802b`) — más consistente con el tema |
| Texto con `var(--muted-foreground)` | Eliminado color hardcodeado `#000000` |

---

## 3. Home View

**Archivo:** `modules/adm/application/presentation/views/home.view.tsx`

| Qué | Por qué |
|---|---|
| Panel debug solo visible si `NEXT_PUBLIC_APP_ENV === 'local'` | Evita exponer información técnica en staging/prod |
| En otros ambientes muestra placeholder `"Selecciona un elemento del menú para comenzar"` con ícono `LayoutDashboard` | UX más limpia para usuarios finales |

> **Variable de ambiente:** `NEXT_PUBLIC_APP_ENV=local` ya existía en `.env.local`. Los demás ambientes la inyectan via pipeline.

---

## 4. Sidebar

**Archivos:**  
- `modules/adm/application/presentation/components/app-sidebar/index.tsx`  
- `components/ui/sidebar.tsx`  
- `app/adm/layout.tsx`

### 4.1 Texto wrap en items del menú
`overflow-visible` → `overflow-hidden` en todos los `SidebarMenuButton` para evitar que el texto expanda el ancho del sidebar colapsado.

### 4.2 Tooltip z-index
- `z-20` en el wrapper del `Sidebar`
- `z-[9998]` en `TooltipContent` del sidebar

Razón: el tooltip quedaba tapado por el `SidebarInset`. Se deja en `9998` (justo debajo del GlobalLoading en `9999`).

### 4.3 Overflow del layout
- Quitado `overflow-hidden` del `SidebarInset` en `app/adm/layout.tsx`
- `overflow-y-auto overflow-x-hidden` movido al div interior de cada página

Razón: `overflow-hidden` en el contenedor principal cortaba modales y sheets que se renderizan fuera del flujo.

### 4.4 Collapsibles con sidebar colapsado
Nuevo helper `handleCollapsibleTrigger` en `app-sidebar/index.tsx`:
- Si el sidebar está **colapsado** → `setOpen(true)` + abre el collapsible
- Si está **expandido** → toggle normal

Aplicado a los grupos: **DRIVERS**, **COMUNICACION**, **PAGOS**.

---

## 5. Breadcrumb

**Archivo:** `components/app-topbar.tsx`

| Qué | Por qué |
|---|---|
| Eliminado primer crumb `"/"` hardcodeado | Era redundante con el logo/home |
| Filtrado del segmento `adm` | No aporta contexto navegacional al usuario |
| `/adm/home` → muestra `"Inicio"` | Legible en español |
| HREFs construidos con prefijo `/adm/` | Navegación correcta dentro del portal |

---

## 6. Aspirantes — Filtros

**Archivo:** `modules/aspirantes/application/presentation/views/applicants-list.view.tsx`

| Qué | Por qué |
|---|---|
| Labels descriptivos en los 3 filtros Select: `"Documentación"`, `"Ubicación"`, `"Fecha de registro"` | Sin label el usuario no sabe qué filtra cada Select |
| Label `"Estado de aspirante"` en el Tabs | Consistencia con los otros filtros |

---

## 7. Drivers — Filtros

**Archivo:** `modules/drivers/application/presentation/views/drivers-list.view.tsx`

| Qué | Por qué |
|---|---|
| Botones custom de estado reemplazados por `Tabs/TabsList/TabsTrigger` | Consistencia visual con la lista de aspirantes |
| Eliminado botón `"Limpiar filtros"` de la barra y del empty state | Redundante; el usuario puede cambiar el Tab directamente |
| Labels: `"Estado de driver"`, `"Estado donde opera"`, `"Tienda último pedido"` | Claridad en cada filtro |

---

## 8. Aspirantes — Repositorio

**Archivo:** `modules/aspirantes/infrastructure/repositories/api-applicants.repository.ts`

| Qué | Por qué |
|---|---|
| `DOC_STATUS_TO_INT` reemplazado por `DOC_STATUS_TO_CODES` | El backend espera códigos string, no enteros |
| `Pendiente` → `['PENDIENTE','ESCANEADO','ELIMINADO']` | Los 3 códigos internos mapean al estado "Pendiente" visible para el usuario |
| Resto de estados → código exacto | Mapeo 1:1 con el SP del backend |
| Parámetro `documentationStatus` enviado como CSV de códigos | `PENDIENTE,ESCANEADO,ELIMINADO` en lugar de entero |
| Bug fix: comentario y firma de método en misma línea (línea 192) | Error de sintaxis que rompía el build |

---

## 9. Drivers — Upload Document Modal

**Archivos:**  
- `modules/drivers/application/presentation/components/upload-document-modal/index.tsx`  
- `modules/drivers/application/presentation/views/driver-detail.view.tsx`

### 9.1 Toast de éxito
Al cargar un documento exitosamente se dispara via `useToast`:
```
"Documento '{label}' cargado correctamente. Pendiente de escaneo."
```

### 9.2 Status post-upload corregido
`onSuccess` actualiza el documento a **`Pending`** (no `Prevalidated` como estaba antes).  
Razón: el archivo fue recibido pero el escaneo asíncrono aún no corrió.

### 9.3 Regla de bloqueo del botón "Cargar/Reemplazar"

```ts
const scanning = doc.status === 'Pending' && !!doc.fileUrl;
const canUpload = !scanning && doc.status !== 'Prevalidated';
```

| Status | `fileUrl` | ¿Puede cargar? | Razón |
|---|---|---|---|
| `Pending` | ❌ | ✅ | Sin archivo aún |
| `Pending` | ✅ | 🔒 | `security_scan = 0` — escaneo en progreso |
| `Prevalidated` | — | 🔒 | Validación en curso |
| `Unreadable` | ✅ | ✅ | Rechazado, se puede reemplazar |
| `Validated` | ✅ | ✅ | Permite reemplazo por vencimiento |

Tooltip `"Escaneo de seguridad en progreso"` aparece solo cuando el botón está bloqueado.

---

## 10. Drivers — Receipt Preview Sheet

**Archivo nuevo:** `modules/drivers/application/presentation/components/receipt-preview-sheet/index.tsx`  
**Modificado:** `modules/drivers/application/presentation/views/driver-detail.view.tsx`

Reemplaza el `window.open(receiptUrl, '_blank')` por un **Sheet lateral** que mantiene al usuario dentro del sistema.

| Tipo de archivo | Comportamiento |
|---|---|
| PDF | `<iframe>` embebido con toolbar nativo deshabilitado |
| JPG / PNG / WEBP | `<img>` con scroll si la imagen es larga |
| Desconocido | Fallback con botones Descargar / Abrir |
| Error de carga | Fallback con botón Descargar |

**Header fijo con 2 acciones:**
- **Descargar** — fuerza descarga con nombre sugerido `recibo-{driver}-{semana}.pdf`
- **Abrir** (ghost) — abre en nueva pestaña como escape hatch secundario

El botón "Recibo" en tabla fue renombrado a **"Ver recibo"** para mayor claridad. Aplica tanto en la tabla resumen (6 filas) como en el modal de pagos completo.

---

## 11. Drivers — Change Status (toasts + mock)

### Problema original
`ChangeDriverStatusUseCase` existía pero nunca se inyectaba. El hook usaba `updateDriverUseCase` para cambiar status (endpoint incorrecto) y no retornaba resultado, por lo que no había feedback al usuario.

### Archivos nuevos

| Archivo | Rol |
|---|---|
| `modules/drivers/infrastructure/repositories/mock-drivers.repository.ts` | Repository completo en memoria: todos los métodos del `IDriverRepository`, `changeStatus` muta el store en runtime |
| `modules/drivers/domain/contracts/get-driver-documents-use-case.interface.ts` | Contrato del use case de documentos |
| `modules/drivers/application/use-cases/get-driver-documents.use-case.ts` | Implementación que delega a `repository.getDocuments()` |

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `infrastructure/dependency-injection.ts` | Flag `IS_LOCAL`: swapea `MockDriversRepository` en local, `ApiDriversRepository` en prod. **Plug & play**: solo cambiar `NEXT_PUBLIC_APP_ENV` |
| `application/hooks/use-driver-detail.hook.ts` | Recibe `changeDriverStatusUseCase` como dependencia, retorna `IResultApi<IChangeDriverStatusOutputDTO>` |
| `presentation/views/driver-detail.view.tsx` | Recibe `changeDriverStatusUseCase`, muestra toast de éxito/error en `confirmStatusChange` |
| `app/adm/drivers/[id]/driver-detail-client.tsx` | Inyecta `changeStatus` y demás use cases |

### Toasts de status
- ✅ `"Driver reactivado correctamente."`
- ✅ `"Driver deshabilitado correctamente."`
- ✅ `"Driver suspendido correctamente."`
- ❌ `"No se pudo cambiar el estatus. Intenta de nuevo."` (si falla)

### Mock data — 3 drivers de prueba

| ID | Nombre | Status |
|---|---|---|
| `DRV-001` | Carlos Ramírez Garza | Enabled |
| `DRV-002` | José Luis Morales Vega | Suspended |
| `DRV-003` | Alejandro Torres Sánchez | Disabled |

Cada driver tiene documentos, pedidos y pagos pre-cargados. El `changeStatus` muta el store en memoria para que el badge y el Alert de solo-lectura reflejen el cambio inmediatamente.

---

## 12. Drivers — Documentos Vencidos (Sheet de resumen)

**Archivo:** `modules/drivers/application/presentation/views/expired-documents.view.tsx`  
**Archivo:** `app/adm/drivers/expired/expired-documents-client.tsx`

### Antes
Clic en fila → navegaba directo a `/adm/drivers/{id}`.

### Ahora
Clic en fila → abre Sheet lateral con resumen del driver → botón CTA navega al detalle.

### Contenido del Sheet (datos que NO están en la tabla)

| Sección | Campos |
|---|---|
| **Estatus** | Badge Habilitado / Suspendido / Deshabilitado |
| **Contacto** | Teléfono, Email |
| **Ubicación** | Ciudad + Estado, Dirección completa |
| **Vehículo** | Marca · Modelo · Año, Placas · Color |
| **Operación** | Tienda último pedido, Fecha último check-in |
| **Documentos** | Listado completo con status badge + fecha de vencimiento coloreada |

### Fetch lazy con `Promise.all`
Al abrir el Sheet se disparan **en paralelo**:
```ts
const [detailResult, docsResult] = await Promise.all([
  getDriverByIdUseCase.execute(item.driverId),
  getDriverDocumentsUseCase.execute(item.driverId),
]);
```
El Sheet abre inmediatamente con skeleton y se puebla cuando ambos fetches resuelven.

---

## 13. Drivers — Documentos Vencidos (Bug: tabla vacía)

**Archivo:** `modules/drivers/application/presentation/views/expired-documents.view.tsx`

| Qué | Por qué |
|---|---|
| Añadido `useCallback loadItems` que ejecuta `getExpiredDocumentsUseCase.execute({ page, pageSize, sortBy, sortDirection })` | El use case se recibía como prop pero **nunca se invocaba**: la tabla quedaba perpetuamente en estado de carga (skeleton) sin datos |
| Añadido `useEffect(() => { void loadItems(); }, [loadItems])` | Sin este efecto no hay disparo inicial ni re-fetch al cambiar página o sort |
| Declarado `const totalPages = Math.ceil(total / pageSize)` antes del JSX | La variable se usaba en la paginación y en el botón "Siguiente" pero nunca estaba definida — causaba `ReferenceError` en runtime |

> **Root cause:** `useEffect` estaba importado desde React pero no se usaba en ningún lugar del componente.  
> El fetch nunca ocurría: `items` permanecía `[]`, `isLoading` permanecía `true`, la tabla mostraba skeletons infinitamente.

---

## 16. Pagos — Stores: conectar catálogo real + crear ApiPaymentsRepository

**Archivos nuevos:**
- `modules/payments/infrastructure/repositories/api-payments.repository.ts`

**Archivos modificados:**
- `modules/payments/infrastructure/dependency-injection.ts`
- `app/adm/pagos/pedidos/pedidos-client.tsx`
- `app/adm/pagos/bonos/bonos-client.tsx`
- `app/adm/pagos/ajustes/ajustes-client.tsx`
- `app/adm/pagos/resumenes-diarios/daily-summaries-client.tsx`
- `app/adm/pagos/resumenes-semanales/weekly-summaries-client.tsx`

| Qué | Por qué |
|---|---|
| Creado `ApiPaymentsRepository` con `getStores()` llamando a `GET /api/v1/catalogs/stores` (API real) | El endpoint ya existía en el backend — el front nunca lo consumía |
| El resto de métodos en `ApiPaymentsRepository` delegan al `MockPaymentsRepository` con `// TODO: connect to real API` | Patrón híbrido: APIs reales conectadas, el resto en mock hasta que el backend las implemente |
| `dependency-injection.ts` reemplazado con patrón `IS_LOCAL`: en local → `MockPaymentsRepository`, en otros ambientes → `ApiPaymentsRepository` | Consistente con el patrón del módulo de drivers |
| `createPaymentsModule` ahora recibe `toastContext?: IToastContext` y construye el `FetchHttpClient` internamente | Necesario para que el httpClient maneje tokens, idempotencia y toasts igual que los demás módulos |
| Todos los `*-client.tsx` de pagos migrados de `const paymentsModule = createPaymentsModule()` (fuera del componente) a `useRef(createPaymentsModule(toastContext).useCases)` dentro del componente | El patrón anterior no podía recibir `toastContext` del hook; además instanciar fuera del componente rompe el ciclo de vida de React |

> **Regla aplicada:** Si el backend ya tiene API real con respuesta real → el front la consume directamente.  
> Si no hay API real aún → mock data en el front, listo para conectar cuando llegue el backend.

---

## 15. Pagos — Pedidos: Filtros de estatus y tienda

**Archivos modificados:**
- `modules/payments/domain/contracts/order.dto.ts`
- `modules/payments/domain/contracts/payment-repository.interface.ts`
- `modules/payments/infrastructure/repositories/mock-payments.repository.ts`
- `modules/payments/infrastructure/dependency-injection.ts`
- `modules/payments/application/presentation/views/orders-list.view.tsx`
- `app/adm/pagos/pedidos/pedidos-client.tsx`

**Archivos nuevos:**
- `modules/payments/domain/contracts/get-stores-use-case.interface.ts`
- `modules/payments/application/use-cases/get-stores.use-case.ts`

| Qué | Por qué |
|---|---|
| Agregado `IStoreDTO` (`value: number`, `label: string`, `externalId: string`) a `order.dto.ts` | Contrato alineado con la respuesta de `GET /api/v1/catalogs/stores` del backend |
| Agregado `getStores()` a `IPaymentRepository` | Extiende el contrato del repositorio sin romper implementaciones existentes |
| Creados `IGetStoresUseCase` + `GetStoresUseCase` | Sigue el patrón del proyecto: un use case por operación |
| `MockPaymentsRepository.getStores()` devuelve `MOCK_STORES` (5 tiendas HEB con `value`, `label`, `externalId`) | Plug & play: cuando el backend esté conectado, solo se reemplaza el repositorio en DI |
| `STORES = MOCK_STORES.map(s => s.label)` — el array interno del mock ahora se deriva de `MOCK_STORES` | Única fuente de verdad para los nombres de tiendas en el mock |
| `dependency-injection.ts` expone `getStores` en `useCases` | El client puede inyectarlo a la view sin cambiar lógica |
| `orders-list.view.tsx`: eliminado `STORE_OPTIONS` hardcodeado; nuevo `storeOptions: IStoreDTO[]` cargado con `useEffect` al montar | La lista de tiendas en el dropdown refleja el catálogo real |
| El filtro de tienda usa `s.label` como valor en el Select y como clave en los chips | Consistente con el campo `store: string[]` del filtro de pedidos |
| `pedidos-client.tsx` pasa `getStoresUseCase` como prop a `OrdersListView` | Inyección de dependencia por props — sin cambiar el hook |

> **Plug & play para el backend real:**  
> Cuando `ApiPaymentsRepository` esté listo, solo necesita implementar `getStores()` llamando a `GET /api/v1/catalogs/stores` con `Authorization: Bearer <token>`.  
> El contrato (`IStoreDTO`, `IGetStoresUseCase`, `IPaymentRepository`) ya está definido y la view no requiere cambios.

---

## 15. Pagos — Pedidos: Filtros de estatus y tienda

**Archivo:** `modules/payments/application/presentation/views/orders-list.view.tsx`

| Qué | Por qué |
|---|---|
| Filtro **Estatus del pedido**: badges/botones toggle reemplazados por `Select` con opciones desplegables + chips removibles con `X` | Los badges ocupaban espacio fijo sin importar cuántas opciones hubiera; la lista es más limpia y escalable |
| Filtro **Tienda**: misma migración de badges a `Select` + chips removibles | Consistencia con el filtro de estatus y con el patrón usado en Bonos y Ajustes |
| `toggleStatus` / `toggleStore` reemplazados por `addStatus` + `removeStatus` / `addStore` + `removeStore` | Lógica explícita separada para agregar y quitar — más legible y alineada al patrón add/remove en lugar de toggle |
| El `Select` filtra del dropdown las opciones ya seleccionadas | Evita duplicados; cuando todos los valores están seleccionados el dropdown queda vacío |
| `value=""` en ambos `Select` para que el trigger siempre muestre el placeholder tras seleccionar | Sin esto el Select quedaría "pegado" al último valor seleccionado |
| Chips con estilo `bg-muted border` + `X` con `hover:text-destructive` | Consistente con los chips de otros filtros del sistema |
| Importado `X` de `lucide-react` | Necesario para el botón de remover chips |

> **Estado de filtro:** Multi-selección en ambos filtros. "Limpiar filtros" sigue funcionando igual (vacía los arrays `orderStatus` y `store`).

---

## 14. Archivos nuevos creados

```
modules/drivers/
  infrastructure/repositories/
    mock-drivers.repository.ts          ← Repository mock completo (plug & play)
  application/use-cases/
    get-driver-documents.use-case.ts    ← Use case para obtener docs de un driver
  domain/contracts/
    get-driver-documents-use-case.interface.ts  ← Contrato del use case
  application/presentation/components/
    receipt-preview-sheet/
      index.tsx                         ← Sheet de preview de recibos (PDF/imagen)

components/ui/
  spidi-logo.tsx                        ← Logo SVG reutilizable con fill="currentColor"
```

---

## 17. Payments — DI híbrida: getStores siempre usa API real

**Archivo:** `modules/payments/infrastructure/dependency-injection.ts`

**Problema resuelto:** `getStores()` devolvía datos mock incluso cuando `IS_LOCAL=true`, porque toda la DI apuntaba a `MockPaymentsRepository` en ambiente local.

**Solución:** Se eliminó el flag `IS_LOCAL` y la función `createPaymentsRepository()`. Ahora `createPaymentsModule()` instancia **dos repositorios** independientemente del ambiente:
- `apiRepository` → `ApiPaymentsRepository` (siempre conectado al backend real, incluyendo `localhost:7075`)
- `mockRepository` → `MockPaymentsRepository` (para use cases sin API real aún)

Cada use case se conecta al repositorio correcto de forma explícita:
```ts
getStores: new GetStoresUseCase(apiRepository),   // API real disponible
getOrders: new GetOrdersUseCase(mockRepository),   // sin API real aún
// ...resto de use cases → mockRepository
```

**Efecto:** El filtro de "Tienda" en Pedidos ahora llama a `GET /api/v1/catalogs/stores` en todos los ambientes.

---

## 18. Payments — SearchableSelect: filtro de Tienda con búsqueda y scroll

**Archivos:**
- `modules/payments/application/presentation/ui/searchable-select.tsx` *(nuevo)*
- `modules/payments/application/presentation/views/orders-list.view.tsx`

**Problema:** El catálogo real de tiendas es extenso. El `<Select>` estándar de shadcn no permite buscar ni hacer scroll cómodo en listas largas.

**Solución:** Componente `SearchableSelect` construido sobre `@radix-ui/react-popover` (ya instalado) + `Input` nativo. Sin dependencia de `cmdk`.

**Características:**
- Input de búsqueda con autofocus al abrir (filtra en tiempo real, case-insensitive)
- Lista con `max-h-60 overflow-y-auto` — scroll suave en cualquier cantidad de resultados
- Tiendas ya seleccionadas aparecen con ✓ y `opacity-50` (no se pueden volver a seleccionar)
- Popover alineado al ancho del trigger (`var(--radix-popover-trigger-width)`) → responsive en mobile sin CSS extra
- Al cerrar limpia el query automáticamente
- Props reutilizables: `options`, `selectedValues`, `onSelect`, `placeholder`, `searchPlaceholder`, `emptyMessage`

**Reemplazó:** `<Select value="" onValueChange={addStore}>` con lista plana sin scroll ni búsqueda

---

## 19. Payments — Sort por N° Pedido + sort aplicado al export

**Archivos:**
- `modules/payments/application/presentation/views/orders-list.view.tsx`
- `modules/payments/infrastructure/repositories/mock-payments.repository.ts`

**Cambios:**

### Sort por N° Pedido
- `SortKey` ahora incluye `'orderId'`
- La columna `N° Pedido` del `<TableHead>` es clickeable con el mismo patrón que el resto: asc → desc → reset

### Sort en mock
- `getOrders()` ahora aplica sort sobre los items filtrados **antes de paginar**, usando `filters.sortBy` y `filters.sortDirection`
- Como `exportOrders()` internamente llama a `getOrders({ page: 1, pageSize: 10000, ...filtrosActivos })`, el export también respeta el sort activo
- El export descarga todo lo que haya con los filtros actuales (sin paginación), reflejando el orden de columna activo

### Comportamiento del export (mock)
- Formato `csv` → `text/csv`, descarga `orders_<timestamp>.csv`
- Formato `xlsx` → mismo contenido CSV con mime `application/vnd.ms-excel` (abrible en Excel). Cuando el backend tenga el endpoint real, generará xlsx nativo

---

## 20. Payments — Export xlsx real + botón de exportar siempre clickeable

**Archivos:**
- `modules/payments/infrastructure/repositories/mock-payments.repository.ts`
- `modules/payments/application/presentation/views/orders-list.view.tsx`
- `modules/payments/application/presentation/ui/dropdown-menu.tsx` *(nuevo re-export)*
- `package.json` — nueva dependencia: `xlsx` (SheetJS)

### Fix 1: xlsx genera archivo válido
- Instalado `xlsx` (SheetJS) para generar binarios `.xlsx` reales
- `generateXlsx()` usa `XLSX.utils.json_to_sheet` + `XLSX.write({ type: 'array', bookType: 'xlsx' })` → Blob con mime `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- El CSV sigue igual (`text/csv`)

### Fix 2: exportar siempre responde al click
- Reemplazado `<Select onValueChange>` (no re-dispara si el valor ya estaba seleccionado) por `<DropdownMenu>` con `<DropdownMenuItem onClick>`
- Cada opción (CSV / Excel) es un botón independiente → siempre dispara el export sin importar cuántas veces se use la misma opción
- El botón trigger muestra `"Exportando…"` y se deshabilita mientras dure la descarga (`isExporting`)

---

## 21. Payments — Order Detail: grid 4 columnas, timeline mobile, paleta de montos

**Archivo:** `modules/payments/application/presentation/views/order-detail.view.tsx`

### Grid de información — 4 columnas
- Cambiado de `lg:grid-cols-3` a `sm:grid-cols-2 lg:grid-cols-4`
- **Ruta ID** sale del condicional `{routeId && ...}` y siempre ocupa su celda (muestra `–` si no hay valor), completando la fila sin dejar huecos

### Timeline — fix mobile
- **Mobile (`sm:hidden`):** layout vertical con dot + línea conectora lateral y label/fecha a la derecha — sin empalmes, sin overflow
- **Desktop (`hidden sm:flex`):** línea horizontal original pero con `w-20` fijo por nodo para que el texto no aplaste el conector. Conector usa `bg-border` en lugar de `bg-gray-300` (respeta modo oscuro)
- Eliminado `whitespace-nowrap` que era la causa del empalme en móvil

### Colores de montos — alineados con la paleta del proyecto
Referencia: `driver-detail.view.tsx` línea 693, `weekly-summary-detail.view.tsx` línea 121

| Campo | Antes | Ahora |
|---|---|---|
| Pago base | `font-bold` (sin color) | `font-semibold` (sin color) |
| Bonus = 0 | `text-green-600` siempre | `text-muted-foreground` |
| Bonus > 0 | `text-green-600` | `text-green-600` ✓ |
| Ajuste = 0 | sin clase extra | `text-muted-foreground` |
| Ajuste > 0 | `text-green-600` | `text-green-600` ✓ |
| Ajuste < 0 | `text-red-600` | `text-red-600` ✓ |

- `font-bold` → `font-semibold` para no saturar visualmente en cards grandes
- Import de `Loader2` eliminado (no se usaba)

---

## 22. Payments — Bonos: listado refactorizado con criterios de aceptación completos

**Archivos:**
- `modules/payments/application/presentation/views/bonuses-list.view.tsx` — reescrito
- `app/adm/pagos/bonos/bonos-client.tsx` — pasa `getStoresUseCase`
- `modules/payments/infrastructure/repositories/mock-payments.repository.ts` — sort + xlsx

### Columnas de tabla
Todas las 7 columnas solicitadas: ID Bono, Tienda, Inicio vigencia, Fin vigencia, Fecha creación, Tipo, Monto. Todas ordenables con click en el encabezado (incluyendo ID Bono y Tienda que antes no lo eran).

### Filtros
| Filtro | Implementación |
|---|---|
| Inicio vigencia desde/hasta | `DateTimeFilter`: Input date + Select de hora (00:00–23:00) |
| Fin vigencia desde/hasta | Mismo componente `DateTimeFilter` |
| Tienda | `SearchableSelect` + chips removibles — catálogo real de `GET /api/v1/catalogs/stores` |
| Tipo de bono | `SearchableSelect` + chips removibles — opciones: Puntualidad, Productividad, Horario especial, Zona, Clima |

- Combinables entre sí
- `clearFilters` limpia también los estados locales de date/time

### Crear bono (modal)
- El selector de tiendas del modal también usa `SearchableSelect` + chips en lugar de botones hardcodeados

### Export
- Reemplazado `<Select>` por `<DropdownMenu>` (mismo patrón que Pedidos — siempre clickeable)
- CSV: `text/csv` ✓
- Excel: xlsx real via SheetJS ✓
- Respeta filtros y sort activos

### Mock
- `getBonuses()` aplica sort antes de paginar (igual que `getOrders`)
- `exportBonuses()` usa `generateXlsx()` para formato xlsx

---

## 23. Payments — Bonus Detail: edición condicional, tienda desde catálogo, tipo select

**Archivos:**
- `modules/payments/application/presentation/views/bonus-detail.view.tsx` — reescrito
- `app/adm/pagos/bonos/[id]/bonus-detail-client.tsx` — useRef + getStoresUseCase

### Regla de edición
- Editable solo si `new Date() < new Date(bonus.endDate)` (ya existía en el hook)
- Cuando no es editable: banner amber con fecha de vencimiento + todos los campos en modo `bg-muted`

### Campos editables
| Campo | Control |
|---|---|
| Tienda | `SearchableSelect` + chips removibles — catálogo real API |
| Tipo de bono | `Select` con las 5 opciones |
| Inicio vigencia | `Input type="date"` |
| Fin vigencia | `Input type="date"` |
| Monto | `Input type="number"` |

- Campos editables marcados con etiqueta `(editable)` en `text-primary` para orientar al usuario
- Campos no editables (ID, creación, umbral, mínimo pedidos, creado por, última modificación) siempre `bg-muted`

### Botón Guardar
- Movido al header (siempre visible al hacer scroll) junto al título
- Deshabilitado si `!hasChanges || isSaving`
- Muestra spinner `Loader2` + "Guardando…" durante el save
- Tras guardar: el hook recarga el registro y resetea `initialFormData` → `hasChanges` vuelve a `false` → botón se deshabilita automáticamente

### Client
- Corregido patrón: `useRef(createPaymentsModule(toastContext).useCases)` en lugar de instancia fuera del componente
- Pasa `getStoresUseCase` a la vista

---

## Notas para el merge

1. **`dependency-injection.ts` de drivers** — tiene el flag `IS_LOCAL` y el import de `MockDriversRepository`. Si el otro dev modificó este archivo, hay que asegurarse de que ambos cambios coexistan.

2. **`driver-detail.view.tsx`** — archivo grande con múltiples cambios. Revisar con cuidado en el merge. Los cambios están en:
   - Imports (nuevos use cases e iconos)
   - `IDriverDetailViewProps` (nuevo prop `changeDriverStatusUseCase`)
   - `useDriverDetail` call (nuevo argumento)
   - `confirmStatusChange` (ahora async con toasts)
   - Sección de documentos (botón con lógica de bloqueo por status)
   - Sheet de recibo (nuevo estado `receiptSheet` + componente `ReceiptPreviewSheet`)

3. **`use-driver-detail.hook.ts`** — firma del hook cambiada: ahora recibe `changeDriverStatusUseCase` como 3er argumento (antes el 3er argumento era `getOrdersUseCase`). Cualquier otro lugar que instancie este hook debe actualizarse.

4. **Colores de status de documentos** — se usa el mismo criterio en toda la app:
   - `Pending` → gris
   - `Unreadable` → rojo
   - `Prevalidated` → amarillo
   - `Validated` → verde

5. **z-index layers** (para no romper superposición):
   - GlobalLoading: `9999`
   - Tooltip sidebar: `9998`
   - Modales/Sheets estándar: `50` (Radix default)

---

## 24. Bonus Detail — Patrón ejecutivo DataField

**Archivo:** `modules/payments/application/presentation/views/bonus-detail.view.tsx`

| Qué | Por qué |
|---|---|
| `ReadonlyField` (label + Input disabled) reemplazado por `DataField` | Los inputs deshabilitados generan ruido visual; el patrón label-arriba/valor-abajo es más ejecutivo (Stripe, Linear, Vercel) |
| `DataField`: label en `text-xs uppercase tracking-wide text-muted-foreground` + valor en `text-sm font-medium` + `border-b border-border/50` | El dato respira y toma protagonismo; el separador sutil alinea con el grid sin cajas |
| Grid unificado de 4 columnas (`grid-cols-2 lg:grid-cols-4`) para todos los campos (readonly + editables) | Una sola cuadrícula — los inputs editables conviven con `DataField` sin romper el ritmo visual |
| Campos editables (Tienda, Tipo, Fechas, Monto): sin `disabled`, sin `bg-muted`; integrados al mismo grid | En modo solo lectura muestran texto plano vía `DataField`; en modo editable muestran el control con `h-9 mt-0.5` |
| `fmt(bonus.bonusAmount)` en modo solo lectura | Monto se formatea como moneda MXN en vez de número crudo |

---

## 25. Bonus Detail — Toast al guardar

**Archivo:** `modules/payments/application/presentation/views/bonus-detail.view.tsx`  
**Archivo:** `modules/payments/application/hooks/use-bonus-detail.hook.ts`

| Qué | Por qué |
|---|---|
| `handleSave` retorna `Promise<boolean>` con `result.success` | La vista decide el toast sin acoplarse al repositorio; plug & play al conectar API real |
| `showToast({ message, type })` en el `onClick` del botón Guardar | Usa el sistema de toasts del proyecto (`ToastProvider` + `useToast`) — mismo visual que el resto de la app |
| Toast `success` al guardar correctamente, `error` si falla | Feedback inmediato al usuario en ambos escenarios |

---

## 26. Bonus Form Modal — Fecha+hora, validación, toast

**Archivo:** `modules/payments/application/presentation/views/bonuses-list.view.tsx`

| Qué | Por qué |
|---|---|
| Fecha inicio y fecha fin: cada una con `input[date]` + `input[time]` en `grid-cols-2` | El backend maneja datetime — la hora era requerida y estaba faltando |
| `toISO(date, time)` combina ambos a `YYYY-MM-DDTHH:mm` al enviar | El DTO recibe string libre; cuando conecte el backend no cambia nada |
| Validación al instante con sistema `touched` por campo | Errores solo se muestran después de que el usuario interactuó con el campo (no al abrir) |
| Validación de rango: `endDate <= startDate` → error `dateRange` | Evita bonos con fechas incoherentes |
| `FieldError` — componente `text-xs text-destructive` bajo cada campo | Consistente con el patrón de formularios del proyecto |
| `onCreate` retorna `boolean`; toast success cierra modal, toast error mantiene modal abierto | El usuario puede corregir sin perder el formulario |
| `handleCreate` en vista principal retorna `result.success ?? false` | Plug & play: cuando `api-payments.repository` implemente `createBonus`, el flujo no cambia |
| Labels del modal: `text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none` | Mismo estilo ejecutivo que `DataField` en el detalle — consistencia total |
| `max-h-[90vh] overflow-y-auto` en el Card del modal | El modal no se corta cuando aparece el campo umbral en pantallas pequeñas |

---

## 27. Adjustments List — Rediseño completo

**Archivos:**
- `modules/payments/application/presentation/views/adjustments-list.view.tsx` — reescrito
- `modules/payments/infrastructure/repositories/mock-payments.repository.ts` — fix export xlsx
- `app/adm/pagos/ajustes/ajustes-client.tsx` — pasa `getStoresUseCase`

| Qué | Por qué |
|---|---|
| Export: `<Select>` reemplazado por `<DropdownMenu>` (CSV + Excel) | Mismo patrón que Pedidos y Bonos — evita bug de `onValueChange` que no re-dispara con mismo valor |
| `exportAdjustments` en mock ahora genera xlsx real con SheetJS | Antes generaba CSV con mime-type incorrecto para xlsx |
| Filtro Tienda: `SearchableSelect` + chips con API real (`getStoresUseCase`) | Reemplaza botones hardcodeados — misma fuente que el resto del módulo |
| Labels de filtros: `text-xs uppercase tracking-wide text-muted-foreground` | Estilo ejecutivo consistente con bonos y detalle |
| Modal crear ajuste: validación al instante con `touched` + `FieldError` por campo | Mismo patrón que el modal de bonos |
| Modal: tienda con `SearchableSelect` (single select) en lugar de `<Select>` estático | Conectado a catálogo real — plug & play |
| `onCreate` retorna `boolean`; toast success/error; modal permanece abierto en error | Mismo patrón que modal de bonos |
| Labels modal: estilo ejecutivo `text-xs uppercase tracking-wide` | Consistencia total con el sistema de diseño |
| `isExporting` con spinner `Loader2` en botón Exportar | Feedback visual durante descarga |
| `IAdjustmentsListViewProps` incluye `getStoresUseCase` | Prop agregada para DI limpia desde el client |

---

## 28. Badges — Coherencia de paleta entre Pedidos, Bonos y Ajustes

**Archivos:**
- `modules/payments/application/presentation/components/order-status-badge/index.tsx`
- `modules/payments/application/presentation/components/bonus-type-badge/index.tsx`
- `modules/payments/application/presentation/components/adjustment-type-badge/index.tsx`

| Badge | Valor | Antes | Después | Criterio |
|---|---|---|---|---|
| Order — Pending | `badge-pendiente` | `bg-yellow-100` inline | `badge-pendiente` (slate) | Pendiente/neutral |
| Order — InRoute | `badge-revision` | `bg-blue-100` inline | `badge-revision` (amber) | En proceso/movimiento |
| Bonus — Zone | `badge-revision` | `bg-amber-100` inline | `badge-revision` (amber) | Geográfico/territorial |
| Bonus — Weather | `badge-inactivo` | `bg-blue-100` inline | `badge-inactivo` (gray) | Externo/no controlable |
| Adjustment — OperationalError | `badge-inactivo` | `bg-red-100` inline | `badge-inactivo` (gray) | Error/problema |
| Adjustment — SystemError | `badge-revision` | `bg-orange-100` inline | `badge-revision` (amber) | Alerta/atención |
| Adjustment — OperationalAdjustment | `badge-pendiente` | `bg-blue-100` inline | `badge-pendiente` (slate) | Neutro/administrativo |

> **Regla:** usar siempre clases de `globals.css` antes que Tailwind inline. Paleta semántica: green=positivo, gray=negativo/neutro, amber=proceso/alerta, slate=pendiente, purple=especial.

---

## 29. Adjustment Detail — Rediseño completo

**Archivos:**
- `modules/payments/application/presentation/views/adjustment-detail.view.tsx` — reescrito
- `modules/payments/application/hooks/use-adjustment-detail.hook.ts` — extendido
- `modules/payments/domain/contracts/adjustment.dto.ts` — agrega `IUpdateAdjustmentDTO`
- `modules/payments/domain/contracts/update-adjustment-use-case.interface.ts` — nuevo
- `modules/payments/application/use-cases/update-adjustment.use-case.ts` — nuevo
- `modules/payments/domain/contracts/payment-repository.interface.ts` — agrega `updateAdjustment`
- `modules/payments/infrastructure/repositories/mock-payments.repository.ts` — impl mock
- `modules/payments/infrastructure/repositories/api-payments.repository.ts` — TODO stub
- `modules/payments/infrastructure/dependency-injection.ts` — registra use case
- `app/adm/pagos/ajustes/[id]/adjustment-detail-client.tsx` — pasa `updateAdjustmentUseCase`

| Qué | Por qué |
|---|---|
| `DataField` — mismo patrón que bonus-detail | Consistencia de diseño en todo el módulo pagos |
| Grid `grid-cols-2 lg:grid-cols-4 items-start` | Alineación uniforme con bonus-detail |
| Labels: `text-xs uppercase tracking-wide text-muted-foreground` | Estilo ejecutivo del sistema |
| Driver: texto plano + botón `Eye` ghost `h-6 w-6` | Input group visual: el nombre respira, el ojo navega sin ocupar espacio |
| Botón Guardar en header, `disabled` si `!hasChanges \|\| isSaving` | Mismo patrón que bonus-detail |
| Toast success/error al guardar | Usa `useToast` del proyecto |
| Campos editables: Tienda, Fecha aplicación, Tipo, Monto, Notas | ID, Driver, Fecha creación, Creado por son siempre solo lectura |
| Monto con color condicional (`text-red-600` / `text-green-600`) | Refleja signo del ajuste en el input mientras se edita |
| Notas con contador `/1500` y `maxLength` | Mismo patrón que modal de crear ajuste |
| `IUpdateAdjustmentDTO` — `store`, `applicationDate`, `adjustmentType`, `amount`, `notes` | Plug & play: cuando el backend esté listo solo se toca `api-payments.repository.ts` |


## 30. Ajustes � Modal Crear: Driver por SearchableSelect, monto formateado, fecha default ayer

**Archivos:**
- modules/payments/application/presentation/views/adjustments-list.view.tsx � reescrito modal
- modules/payments/application/presentation/ui/searchable-select.tsx � extendido con props nuevas
- pp/adm/pagos/ajustes/ajustes-client.tsx � agrega getDriversUseCase

| Qu� | Por qu� |
|---|---|
| Campo Driver reemplaza Input de texto libre por SearchableSelect con externalSearch + debounce 300ms | El usuario busca por nombre o CURP; la lista se filtra en el use case, no en el front |
| getDriversUseCase.execute({ page:1, pageSize:50, sortBy:'firstName', sortDirection:'asc', search }) | Respeta la firma IPagination del use case � sortBy y sortDirection son requeridos |
| Opciones del driver: label=nombre completo, description=CURP | El campo description nuevo en SearchableSelectOption se muestra en texto xs debajo del label |
| SearchableSelect � nueva prop externalSearch + onExternalSearchChange | Cuando se pasan, el filtrado interno queda desactivado y el padre controla la b�squeda (plug & play para APIs con debounce) |
| SearchableSelect � description en SearchableSelectOption | Permite mostrar texto secundario (CURP, email, etc.) debajo del label en el dropdown |
| Fecha de aplicaci�n default = ayer (getYesterday()) | El caso de uso m�s com�n es registrar ajustes del d�a anterior |
| Monto: Input texto libre con preview de Intl.NumberFormat('es-MX') en rojo/verde | El tipo 
umber no permite - al inicio; el texto libre s�. Preview muestra la cantidad formateada debajo del input |
| Bot�n Guardar: disabled={!isValid || isSaving} | Era disabled={isSaving} � ahora bloqueado hasta que todos los campos sean v�lidos |
| 	ype: 'error' ? 	ype: 'danger' en todos los toasts de pagos | ToastType solo acepta 'danger' | 'warning' | 'info' | 'success' � correcci�n de tipo TS |
| createDriversModule(toastContext) instanciado con useRef en justes-client.tsx | Sigue el patr�n del proyecto: m�dulo instanciado dentro del componente con useRef, no fuera |


## 31. SearchableSelect � fix trigger: muestra valor seleccionado

**Archivo:** `modules/payments/application/presentation/ui/searchable-select.tsx`

| Qu� | Por qu� |
|---|---|
| Trigger siempre mostraba el `placeholder` ignorando `selectedValues` | Bug: el texto del bot�n estaba hardcodeado a `{placeholder}` |
| `selectedLabel` derivado de `options.find(o => o.value === selectedValues[0])?.label` | Muestra el label real del item seleccionado |
| Nueva prop `displayValue` | Fuerza el texto del trigger cuando las options cambian din�micamente (ej. driver con b�squeda externa � la lista se vac�a entre b�squedas) |
| `text-foreground` cuando hay selecci�n, `text-muted-foreground` con placeholder | Distinci�n visual clara entre "seleccionado" y "sin seleccionar" |
| Modal ajuste: pasa `displayValue={nombre completo del driver}` | El nombre persiste en el trigger aunque la lista de drivers cambie al escribir en el buscador |


## 32. Res�menes Diarios � export xlsx real + link driver sutil

**Archivo:** `modules/payments/application/presentation/views/daily-summaries-list.view.tsx`  
**Archivo:** `modules/payments/infrastructure/repositories/mock-payments.repository.ts`

| Qu� | Por qu� |
|---|---|
| `<Select onValueChange>` reemplazado por `<DropdownMenu>` (CSV / Excel) | Mismo patr�n que Pedidos, Bonos y Ajustes � evita bug de no re-disparo con mismo valor |
| `exportDailySummaries` y `exportWeeklySummaries` en mock: ahora llaman `generateXlsx()` para xlsx | Antes generaban CSV con mime-type incorrecto � Excel abr�a archivo corrupto |
| Bot�n Exportar con spinner `Loader2` + "Exportando�" y `disabled` durante descarga | Feedback visual, evita doble click |
| Link driver: `text-primary` ? `underline decoration-dotted underline-offset-2 hover:text-muted-foreground` | El rojo HEB era demasiado llamativo en contexto de tabla; el subrayado punteado indica navegabilidad sin competir |


## 33. Resumen Diario Detail � cards con �cono flotante, colores y responsive

**Archivo:** `modules/payments/application/presentation/views/daily-summary-detail.view.tsx`

| Qu� | Por qu� |
|---|---|
| Cards de m�tricas separados en dos filas sem�nticas: Actividad (2 cols) + Montos (1?2?4 cols) | En mobile los montos MXN en 2 columnas se apretaban; 1 col en mobile les da espacio para respirar |
| �conos `material-symbols-rounded` flotantes via `<Icon>` en cada card | Congruencia con el men� lateral � mismo sistema de �conos, no Lucide |
| `size={52}`, `opacity-[0.15]`, `absolute right-2 bottom-1`, `overflow-hidden` en card | Visible sin saturar; `overflow-hidden` evita que el �cono se salga del borde |
| Colores por sem�ntica: M.Pedidos verde � M.Bonos verde/neutro � M.Ajustes rojo/verde/neutro � Total rojo/verde | Jerarqu�a visual inmediata: el usuario detecta problemas sin leer los n�meros |
| Link driver: mismo estilo sutil `decoration-dotted` | Consistencia con el listado |
| Fecha de ejecuci�n con �cono `schedule` en footer | Contexto temporal claro sin ocupar espacio en el encabezado |

| Card | Material Symbol |
|---|---|
| Check-ins | `login` |
| Pedidos | `shopping_bag` |
| M. Pedidos | `account_balance_wallet` |
| M. Bonos | `card_giftcard` |
| M. Ajustes | `tune` |
| Total | `payments` |


## 34. Res�menes Semanales � listado completo con criterios de aceptaci�n

**Archivo:** `modules/payments/application/presentation/views/weekly-summaries-list.view.tsx`  
**Archivo:** `modules/payments/infrastructure/repositories/mock-payments.repository.ts`

| Qu� | Por qu� |
|---|---|
| 7 columnas: Driver, RFC, Semana (lunes), M. Pedidos, M. Bonos, M. Ajustes, Total | Criterios de aceptaci�n expl�citos |
| Columna "Semana (lunes)" con formato `lun. 3 mar. 2025` | Confirma visualmente que la fecha es el inicio de semana (lunes) |
| Sort en mock aplicado antes de paginar en todos los campos incluyendo `bonusAmount` y `adjustmentAmount` | Antes el mock no ordenaba weekly summaries |
| B�squeda filtra por driver **y RFC** | El mock solo filtraba por nombre/ID � RFC quedaba fuera |
| Colores de montos: M.Pedidos verde � M.Bonos verde/neutro � M.Ajustes rojo/verde/neutro � Total rojo/verde en `font-bold` | Consistencia con resumen diario |
| Export `DropdownMenu` con `isExporting` + spinner | Mismo patr�n que el resto del m�dulo |
| Paginaci�n 25/50/100, Lazy loading reactivo a p�gina+filtros | Criterios de aceptaci�n |
| Link driver sutil `decoration-dotted` | Consistencia |
| Labels de filtros en estilo ejecutivo `text-xs uppercase tracking-wide` | Consistencia con el resto del m�dulo pagos |
| T�tulo + acciones en header (Export y Limpiar a la derecha) | Layout ejecutivo consistente con Bonos y Ajustes |


## 35. Resumen Semanal Detail � cards, responsive, colores, �conos

**Archivo:** `modules/payments/application/presentation\views\weekly-summary-detail.view.tsx`

| Qu� | Por qu� |
|---|---|
| Fila 1: Check-ins � Pedidos � T.Espera � T.Trabajo en `grid-cols-2 sm:grid-cols-4` | Valores cortos � caben bien en 2 cols en mobile, 4 en desktop |
| Fila 2: M.Pedidos � M.Bonos � M.Ajustes � Total en `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` | Montos MXN en 1 col en mobile para que respiren |
| 8 �conos `material-symbols-rounded` flotantes con `opacity-[0.15]` | Consistencia con resumen diario |
| Nuevos �conos: `hourglass_empty` (T.Espera), `timer` (T.Trabajo) | Sem�ntica clara |
| Colores: misma l�gica que resumen diario | Consistencia |
| T�tulo con fecha del lunes: `weekday: 'long'` ? "lunes 3 de marzo de 2025" + `capitalize` | Criterio de aceptaci�n: mostrar fecha del lunes |
| Link driver: `decoration-dotted` sutil | Consistencia |
| Tabla res�menes diarios clickeable ? detalle diario | Criterio de aceptaci�n |
| Footer con �cono `schedule` + fecha/hora de ejecuci�n completa | Criterio de aceptaci�n |
| Skeleton estructurado: 8 cards + tabla durante carga | UX de carga consistente |


## 36. Botones "Regresar" � router.back() en todos los detalles

**Archivo:** `modules/shared/application/hooks/use-navigation-loading.hook.ts`  
**Archivos afectados:** aspirante-detail, driver-detail, training-detail, training-form, adjustment-detail, bonus-detail, order-detail, daily-summary-detail, weekly-summary-detail

| Qu� | Por qu� |
|---|---|
| Nuevo m�todo `navigateBack(fallbackUrl)` en `useNavigationLoading` | Centraliza la l�gica en un solo lugar � todos los detalles lo consumen |
| `window.history.length > 1` ? `router.back()` | Regresa a donde ven�as: si llegaste al pedido desde el resumen semanal, vuelves al resumen semanal |
| Fallback a `router.push(fallbackUrl)` si no hay historial | Safety net para tabs reci�n abiertos o deeplinks directos |
| `showLoading()` antes del back | Mantiene el overlay de carga consistente con `navigateTo` |
| Fix adicional: `type: 'error'` ? `type: 'danger'` en `driver-detail.view.tsx` | `ToastType` no acepta `'error'` � corregido de paso |


## 37. Capacitaciones � export DropdownMenu + badges paleta del sistema

**Archivos:**
- `modules/capacitacion/application/presentation/views/trainings-list.view.tsx`
- `modules/capacitacion/application/presentation/components/training-type-badge/index.tsx`
- `modules/capacitacion/application/presentation/ui/dropdown-menu.tsx` *(nuevo re-export)*

| Qu� | Por qu� |
|---|---|
| `<Select onValueChange>` reemplazado por `<DropdownMenu>` (CSV / Excel) | Mismo patr�n que todos los m�dulos � evita bug de no re-disparo con mismo valor |
| Bot�n Exportar con spinner `Loader2` + "Exportando�" y `disabled` durante descarga | Feedback visual consistente con el resto del sistema |
| `TrainingTypeBadge`: reemplaza `<Badge variant="destructive/default/outline">` por clases del sistema | Los variants de shadcn no siguen la paleta sem�ntica definida en `globals.css` |
| `Mandatory` ? `badge-revision` (amber) | Requiere atenci�n/acci�n � mismo sem�ntico que "en proceso" |
| `Optional` ? `badge-inactivo` (gray) | Neutro, sin urgencia � igual que estados inactivos en otros m�dulos |
| `CompanyPolicy` ? `badge-propuesta` (purple) | Institucional/especial � mismo sem�ntico que propuestas y categor�as especiales |


## 38. Tablas — Color de texto unificado

**Archivo:** `components/ui/table.tsx`

| Qué | Por qué |
|---|---|
| `TableHead` (`th`): `text-muted-foreground` → `text-foreground` | Los encabezados usaban gris apagado; deben tener el mismo color oscuro que el cuerpo |
| `TableCell` (`td`): sin clase de color → `text-foreground` | Sin color explícito, las celdas heredaban valores inconsistentes según el contexto |

**Color aplicado:** `oklch(0.2405 0.012 84.56)` / `#221f19` — mapeado al token `text-foreground` del design system (`--foreground` en `globals.css`).

**Cobertura:** El componente `table.tsx` es centralizado y re-exportado por todos los módulos. El cambio aplica globalmente a las 13+ vistas que usan tablas (capacitacion, drivers, payments, aspirantes) sin modificar componentes individuales.


## 39. Capacitaciones — Badges columna "Tipo" con paleta específica

**Archivo:** `modules/capacitacion/application/presentation/components/training-type-badge/index.tsx`

**Problema:** Los badges usaban clases globales (`badge-revision`, `badge-inactivo`, `badge-propuesta`) que aplican amber, gray y purple genéricos — y en el caso de `badge-revision` usaba el mismo amber que otros estados del sistema, no la paleta aprobada para esta columna. Además `Obligatorio` heredaba colores de rojo/destructive del tema.

**Solución:** Estilos inline específicos por tipo, sin tocar las clases globales (que siguen siendo usadas por otros módulos con su semántica propia).

| Tipo | Border | Background | Texto |
|---|---|---|---|
| **Opcional** | `oklch(0.879 0.169 91.605)` / `#FFD230` (amber-300) | `oklch(0.962 0.059 95.617)` / `#FEF3C6` (amber-100) | `oklch(0.2405 0.012 84.56)` / `#221f19` |
| **Política de empresa** | `oklch(71.98% 0.0907 227.557)` / `#62B0D1` (chart-3) | `oklch(94.8% 0.0188 222.164)` / `#E1F1F7` (chart-5) | `oklch(0.2405 0.012 84.56)` / `#221f19` |
| **Obligatorio** | `oklch(0.6813 0.1223 13.71)` / `#D97782` (rosa-rojo suave) | `oklch(0.9358 0.0222 7.19)` / `#F8E4E7` | `oklch(0.2405 0.012 84.56)` / `#221f19` |

> Las clases globales `badge-*` no fueron modificadas — siguen vigentes para el resto del sistema.


## 40. Comunicación / Quejas — Badges columnas "Tipo" y "Estado" con paleta específica

**Archivo:** `app/adm/complaints/page.tsx`

**Problema:** Los badges de la tabla usaban clases globales (`badge-rechazado`, `badge-revision`, `badge-pendiente`, `badge-aprobado`) que aplican colores genéricos del sistema — incluyendo el rojo destructive para "Queja" y "Nueva", que no corresponde a la paleta aprobada.

**Solución:** Se reemplazaron las funciones `getTypeBadgeClass` y `getStatusBadgeClass` por objetos de estilo `TYPE_BADGE_STYLES` y `STATUS_BADGE_STYLES` con valores inline exactos. Los `<Badge>` en tabla usan ahora `style={...}` en lugar de `className`. Las funciones `getTypeBadgeVariant` / `getStatusBadgeVariant` (usadas en chips de filtros) no fueron modificadas.

**Columna Tipo:**

| Tipo | Border | Background | Texto |
|---|---|---|---|
| **Comentario** | `oklch(0.869 0.022 252.894)` / `#CAD5E2` (slate-300) | `oklch(0.968 0.007 247.896)` / `#F1F5F9` (slate-100) | `#221f19` |
| **Queja** | `oklch(0.6813 0.1223 13.71)` / `#D97782` | `oklch(0.9358 0.0222 7.19)` / `#F8E4E7` | `#221f19` |
| **Aclaración** | `oklch(71.98% 0.0907 227.557)` / `#62B0D1` (chart-3) | `oklch(94.8% 0.0188 222.164)` / `#E1F1F7` (chart-5) | `#221f19` |

**Columna Estado:**

| Estado | Border | Background | Texto |
|---|---|---|---|
| **En proceso** | `oklch(0.879 0.169 91.605)` / `#FFD230` (amber-300) | `oklch(0.962 0.059 95.617)` / `#FEF3C6` (amber-100) | `#221f19` |
| **Nueva** | `oklch(82.7% 0.119 306.383)` / `#DAB2FF` (purple-300) | `oklch(94.6% 0.033 307.174)` / `#F3E8FF` (purple-100) | `#221f19` |
| **Resuelta** | `oklch(79.2% 0.209 151.711)` / `#05DF72` (green-400) | `oklch(96.2% 0.044 156.743)` / `#DCFCE7` (green-100) | `#221f19` |

> Las clases globales `badge-*` y los chips de filtros no fueron modificados.


## 41. Filtros toggle — Color coherente con etiquetas de tabla (scope: Comunicación / Quejas)

**Archivo:** `app/adm/complaints/page.tsx`

**Problema:** Los chips toggle de filtro ("Tipo" y "Estado") al activarse aplicaban `variant={getTypeBadgeVariant(...)}` / `variant={getStatusBadgeVariant(...)}`, que usaban variantes genéricas de shadcn (`destructive`, `default`, `secondary`) — colores completamente distintos a los de las etiquetas en la tabla.

**Solución:** Al activarse un chip, se aplica el mismo `style` object que la etiqueta correspondiente en tabla (`TYPE_BADGE_STYLES[type]` / `STATUS_BADGE_STYLES[status]`). En estado inactivo permanece `variant="outline"` sin estilo extra (neutro). Se eliminó el uso de `getTypeBadgeVariant` y `getStatusBadgeVariant` en los filtros (esas funciones se conservan por la página de detalle `[id]/page.tsx`).

**Comportamiento:**
| Estado chip | Estilo aplicado |
|---|---|
| No seleccionado | `variant="outline"` — borde gris neutro |
| Seleccionado | `style={TYPE_BADGE_STYLES[type]}` / `style={STATUS_BADGE_STYLES[status]}` — idéntico a la etiqueta en tabla |

**Alcance del cambio:** Solo `complaints/page.tsx`. Las demás vistas con tabla (Capacitación, Drivers, Pagos, Aspirantes) usan `Select`, `Tabs` o `Chip` de texto para filtrar — no tienen badges toggle, por lo que no requieren ajuste.


## 42. Drivers y Aspirantes — Filtros de Estado: de Tabs a pills con color coherente y botón X

**Archivos modificados:**
- `modules/drivers/application/presentation/components/driver-status-badge/index.tsx`
- `modules/drivers/application/presentation/views/drivers-list.view.tsx`
- `modules/aspirantes/application/presentation/components/applicant-status-badge/index.tsx`
- `modules/aspirantes/application/presentation/views/applicants-list.view.tsx`

**Problema:** Ambas vistas usaban `<Tabs>` para filtrar por estado, lo que solo permitía selección única, no tenía botón X para deseleccionar individualmente, y no guardaba relación visual con los colores de las etiquetas en tabla (que usaban `badge-*` globales con colores genéricos).

**Solución:** Se migraron los filtros a pills badge multi-seleccionables (mismo patrón que `complaints/page.tsx`). Simultáneamente se actualizaron los badge components para usar estilos inline, logrando coherencia completa filtro ↔ tabla.

### DriverStatusBadge — Paleta nueva

| Estado | Border | Background | Comportamiento filtro |
|---|---|---|---|
| **Habilitado** | green-400 `#05DF72` | green-100 `#DCFCE7` | Multi-select (puede coexistir con otros) |
| **Deshabilitado** | purple-300 `#DAB2FF` | purple-100 `#F3E8FF` | Multi-select |
| **Suspendido** | amber-300 `#FFD230` | amber-100 `#FEF3C6` | Multi-select |

> El hook `useDriversList` ya soportaba `driverStatusFilter: string[]` — no requirió cambios en capa de datos.

### ApplicantStatusBadge — Paleta nueva

| Estado | Border | Background | Comportamiento filtro |
|---|---|---|---|
| **Pendiente** | slate-300 `#CAD5E2` | slate-100 `#F1F5F9` | Toggle único (click activa, click vuelve a deseleccionar con X) |
| **En Revisión** | amber-300 `#FFD230` | amber-100 `#FEF3C6` | Toggle único |
| **Propuesta enviada** | purple-300 `#DAB2FF` | purple-100 `#F3E8FF` | Toggle único |
| **Aprobado** | green-400 `#05DF72` | green-100 `#DCFCE7` | Toggle único |
| **Rechazado** | rosa suave `#D97782` | `#F8E4E7` | Toggle único |

> El hook `useApplicantsList` acepta un solo string en `applicationStatus` — las pills funcionan como toggle exclusivo (activar una desactiva la anterior implícitamente). Se eliminaron las opciones "Activos" y "Todos" que tenían semántica especial en el Tabs; el estado vacío equivale a "todos".

**Patrón aplicado en ambas vistas:**
- Inactivo: `variant="outline"` sin style extra — borde gris neutro
- Activo: `style={BADGE_STYLES[value]}` + icono `<X>` para deseleccionar
- Export: `DRIVER_STATUS_STYLES` y `APPLICANT_STATUS_STYLES` exportados desde los badge components para reutilización en las vistas


## 43. Documentos Vencidos — Botón de exportar unificado (DropdownMenu)

**Archivo:** `modules/drivers/application/presentation/views/expired-documents.view.tsx`

**Problema:** Había dos botones separados ("Exportar Excel" y "Exportar CSV") sin feedback visual durante la descarga.

**Solución:** Reemplazados por un único `<DropdownMenu>` con opciones CSV / Excel (.xlsx), spinner `Loader2` + texto "Exportando..." mientras la operación está en curso, y botón deshabilitado durante la exportación. Mismo patrón que Capacitación, Bonos y Ajustes.

| Antes | Después |
|---|---|
| 2 botones: "Exportar Excel" + "Exportar CSV" | 1 botón "Exportar" con dropdown |
| Sin feedback de carga | Spinner + "Exportando..." + `disabled` durante descarga |
| Import `Download` solo | Import `DropdownMenu*` + estado `isExporting` |


## 44. Comunicación / Quejas — Eliminados badges "Tipos: N" y "Estados: N" en barra de filtros activos

**Archivo:** `app/adm/complaints/page.tsx`

| Qué | Por qué |
|---|---|
| Eliminado badge "Tipos: N" de la barra de filtros activos | Redundante: las pills de tipo ya muestran visualmente cuáles están activas con su color y el ícono X |
| Eliminado badge "Estados: N" de la barra de filtros activos | Mismo motivo — las pills de estado son suficiente indicador |

> `activeFiltersCount` conserva su lógica de conteo (types y statuses siguen sumando al contador) para que el texto "N filtro(s) activo(s)" y el botón "Limpiar filtros" funcionen correctamente.


## 45. Global — Botón Exportar unificado: DropdownMenu en header a la derecha del título

**Alcance:** 7 vistas auditadas y corregidas.

**Patrón aplicado:**
- Posición: fila del título (`flex items-start justify-between`) — separado visualmente de los filtros
- Componente: `<DropdownMenu>` con opciones CSV / Excel (.xlsx)
- Feedback: spinner `Loader2` + texto "Exportando…" + botón `disabled` durante descarga
- Ícono `<Download>` siempre visible en estado normal

| Vista | Antes | Cambio |
|---|---|---|
| `aspirantes-list.view.tsx` | `<Select>` dentro de la fila de búsqueda | DropdownMenu en header + `isExporting` local + re-export `dropdown-menu.tsx` creado |
| `drivers-list.view.tsx` | `<Select>` dentro de la fila de búsqueda | DropdownMenu en header + `isExporting` del hook |
| `complaints/page.tsx` | `<Select>` en header (4 opciones CSV/Excel × página/todos) | DropdownMenu con mismas 4 opciones + `isExporting` |
| `daily-summaries-list.view.tsx` | DropdownMenu dentro de fila de filtros | Movido al header |
| `orders-list.view.tsx` | DropdownMenu dentro de fila de filtros | Movido al header |
| `trainings-list.view.tsx` | DropdownMenu dentro de fila de búsqueda | Movido al header (junto a "Crear capacitación") + import `Download` agregado |
| `expired-documents.view.tsx` | DropdownMenu en header ✅ | Sin cambio (ya estaba correcto) |
| `weekly-summaries-list.view.tsx` | DropdownMenu en header ✅ | Sin cambio |
| `adjustments-list.view.tsx` | DropdownMenu en header ✅ | Sin cambio |
| `bonuses-list.view.tsx` | DropdownMenu en header ✅ | Sin cambio |


## 46. Global — Íconos en botones Exportar y Limpiar filtros + limpieza de cabecera "Filtros" en Quejas

**Problema:** Varios módulos tenían los botones sin ícono (`<Download>` o `<FilterX>`). La vista de Quejas tenía además un bloque de cabecera "Filtros" con ícono de embudo y título que no existe en el resto del sistema.

**Cambios por archivo:**

| Archivo | Cambio |
|---|---|
| `weekly-summaries-list.view.tsx` | `Download` + `FilterX` añadidos a imports; aplicados en botón Exportar y ambos Limpiar filtros |
| `adjustments-list.view.tsx` | `Download` + `FilterX` añadidos; aplicados en botón Exportar y ambos Limpiar filtros |
| `daily-summaries-list.view.tsx` | `FilterX` añadido; aplicado en ambos Limpiar filtros (Download ya existía) |
| `bonuses-list.view.tsx` | `FilterX` añadido; aplicado en ambos Limpiar filtros |
| `orders-list.view.tsx` | `FilterX` añadido; aplicado en ambos Limpiar filtros |
| `trainings-list.view.tsx` | `FilterX` añadido; aplicado en ambos Limpiar filtros |
| `complaints/page.tsx` | Eliminado bloque cabecera con `<Filter>` + texto "Filtros". Botón "Limpiar filtros" queda alineado a la derecha con `variant="outline"` + `<FilterX>` — igual al patrón del sistema. Import `Filter` eliminado |


## 47. Global — Reubicación del botón "Limpiar filtros" acoplado a los inputs

**Problema:** El botón "Limpiar filtros" aparecía en una fila separada por encima de los inputs de filtro, visualmente desacoplado.

**Solución por vista:**

| Archivo | Solución |
|---|---|
| `weekly-summaries-list.view.tsx` | Grid colapsado a un solo `flex-row sm:items-end` con todos los filtros (búsqueda + fechas + botón) en la misma fila |
| `daily-summaries-list.view.tsx` | Mismo patrón: `flex-row sm:items-end` con búsqueda + fecha desde + fecha hasta + botón en una sola fila |
| `adjustments-list.view.tsx` | `space-y-4` → `flex flex-col gap-3`; fila de búsqueda + botón con `sm:items-center`; grid secundario con `gap-3` |
| `orders-list.view.tsx` | Mismo patrón que adjustments |
| `bonuses-list.view.tsx` | Botón integrado como 3ra celda del grid de Tienda/Tipo (`lg:grid-cols-3 lg:items-end`), alineado al fondo con `lg:self-end` |


## 48. Global — Botón "Limpiar filtros" movido al header junto a "Exportar"

**Problema:** El botón quedaba dentro del área de filtros, visualmente desacoplado del resto de acciones principales.

**Decisión:** El botón "Limpiar filtros" va justo antes del botón "Exportar" en el header de cada módulo, formando un grupo de acciones consistente. Se eliminó de todas las áreas de filtros (se conserva solo la instancia del estado vacío de resultados en `CardContent`).

| Archivo | Cambio |
|---|---|
| `weekly-summaries-list.view.tsx` | Botón movido al header; filtros quedan como grid limpio sin botón |
| `daily-summaries-list.view.tsx` | Ídem |
| `adjustments-list.view.tsx` | Ídem; input de búsqueda queda solo en su fila |
| `orders-list.view.tsx` | Ídem; input de búsqueda queda solo en su fila |
| `bonuses-list.view.tsx` | Ídem; grid Tienda/Tipo vuelve a 2 columnas |
| `trainings-list.view.tsx` | Ídem |
| `complaints/page.tsx` | Ídem; se eliminó también el `div justify-end` condicional del área de filtros |


## 49. Sidebar — Botón de colapso movido al interior del sidebar

**Problema:** El `SidebarTrigger` estaba en el `AppTopbar`, fuera del sidebar, sin contexto visual del menú que controla.

**Cambios:**
- `app-sidebar/index.tsx`: `SidebarTrigger` agregado al import y colocado dentro del `SidebarHeader` en un `flex row` junto al `SidebarMenu` del logo, para que quede siempre visible independientemente del estado colapsado/expandido
- `app-topbar.tsx`: `SidebarTrigger` eliminado del topbar en desktop; se agrega de vuelta con `md:hidden` + `Separator` con `md:hidden` para que en **mobile** siga siendo accesible desde la barra superior (en mobile el sidebar es un Sheet y el trigger del interior no es visible)


## 50. Global — Botones del header responsivos en mobile

**Problema:** En mobile, los botones "Limpiar filtros", "Exportar", "Crear bono", "Crear ajuste" y "Crear capacitación" desbordaban el header por el texto largo junto al título del módulo.

**Solución:** En todos los botones de acción del header:
- El texto se envuelve en `<span className="hidden sm:inline">` — invisible en mobile, visible desde `sm`
- El `mr-2` del ícono cambia a `sm:mr-2` — sin margen en mobile (icono solo), con margen en desktop
- Resultado: mobile muestra solo íconos; desktop muestra ícono + texto

| Archivo | Botones afectados |
|---|---|
| `weekly-summaries-list.view.tsx` | Limpiar filtros, Exportar |
| `daily-summaries-list.view.tsx` | Limpiar filtros, Exportar |
| `adjustments-list.view.tsx` | Limpiar filtros, Exportar, Crear ajuste |
| `orders-list.view.tsx` | Limpiar filtros, Exportar |
| `bonuses-list.view.tsx` | Limpiar filtros, Exportar, Crear bono |
| `trainings-list.view.tsx` | Limpiar filtros, Exportar, Crear capacitación |
| `complaints/page.tsx` | Limpiar filtros, Exportar |
