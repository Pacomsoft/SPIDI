# Refinamiento de Tareas - Feature 195500, DEPRECATED YA NO UTILIZAR!!!!!

> Documento de recomendaciones para ajuste de tareas existentes y creación de tareas nuevas necesarias para completar el alcance del feature.

---

## TAREAS EXISTENTES A REFINAR

### HU 198189 - Registro Inicial con Datos Básicos

#### Task 198234 - [FRONT] Implementar transición del paso de datos básicos al paso de verificación

**Información a agregar:**

**⚠️ MODELO BASE - ENTIDAD ÚNICA:**
- Endpoint de prevalidación consulta **`core.driver`** (NO `core.applicant`)
- Detecta duplicados tanto en aspirantes como en drivers operativos
- Respuesta incluye `existingStatus` ("aspirante" o "driver") para mensajes diferenciados

**Lógica de operación** (Ampliar):
```markdown
Al hacer clic en Siguiente:
- El sistema valida todos los campos del formulario
- **AGREGAR:** Invoca endpoint de prevalidación de duplicidad
  ```typescript
  const checkResult = await fetch('/api/drivers/check-duplicate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      phone: formData.phone, 
      email: formData.email 
    })
  }).then(r => r.json());
  
  if (checkResult.isDuplicate) {
    // Mostrar error específico con contexto de estado
    const statusText = checkResult.existingStatus === 'aspirante' 
      ? 'en proceso de registro' 
      : 'como driver activo';
    
    if (checkResult.duplicatedFields.includes('phone')) {
      setError('phone', { 
        message: `Este teléfono ya está registrado ${statusText}. Contacta a soporte si necesitas ayuda.` 
      });
    }
    if (checkResult.duplicatedFields.includes('email')) {
      setError('email', { 
        message: `Este email ya está registrado ${statusText}. Contacta a soporte si necesitas ayuda.` 
      });
    }
    
    // Mostrar toast con acción sugerida
    toast.error(
      checkResult.message,
      {
        duration: 8000,
        action: {
          label: 'Contactar soporte',
          onClick: () => window.open('mailto:soporte@spidi.com.mx', '_blank')
        }
      }
    );
    
    return; // NO permitir avanzar
  }
  ```
- Si existen errores de validación, no permite avanzar
- Si la información es válida y no hay duplicados, se oculta la sección de datos básicos
- Se muestra la sección de verificación de teléfono y correo
```

**Contrato del endpoint (actualizado al modelo base):**
```typescript
// Request
POST /api/drivers/check-duplicate
Content-Type: application/json

{
  "phone": "8112345678",
  "email": "correo@dominio.com"
}

// Response (sin duplicado)
{
  "isDuplicate": false,
  "duplicatedFields": [],
  "existingStatus": null,
  "message": "Datos disponibles para registrarse"
}

// Response (con duplicado - aspirante)
{
  "isDuplicate": true,
  "duplicatedFields": ["phone"],
  "existingStatus": "aspirante",
  "message": "El teléfono ya está registrado en proceso de registro. Si necesitas ayuda, contacta a soporte."
}

// Response (con duplicado - driver activo)
{
  "isDuplicate": true,
  "duplicatedFields": ["email"],
  "existingStatus": "driver",
  "message": "El email ya está registrado como driver activo. Si necesitas ayuda, contacta a soporte."
}
```

**Validaciones** (Agregar):
```markdown
- La prevalidación de duplicidad se ejecuta ANTES de transicionar
- El usuario NO puede avanzar si existe duplicado de teléfono o email
- Los mensajes de error diferencian entre "aspirante en proceso" vs "driver activo"
- Se proporciona acción clara: contactar soporte con email directo
- El botón "Siguiente" queda bloqueado hasta resolver duplicados
- Endpoint correcto: `/api/drivers/check-duplicate` (modelo base usa entidad única)
- Manejo del campo `existingStatus` para contexto adicional
- Toast notification persiste más tiempo (8s) para dar tiempo de leer mensaje completo
```

---

#### Task 198237 - [BACK] Implementar endpoints transformadores de catálogo geográfico desde Cart Services

**⚠️ CAMBIO DE ALCANCE**: Esta tarea pasa de ser análisis técnico a implementación directa. Se confirma que Cart Services SÍ es viable como fuente de datos.

**Objetivo funcional**:
Proveer catálogo de estados y ciudades extraídos desde tiendas activas de Cart Services, garantizando que el formulario de registro solo muestre ubicaciones donde hay operación real de HEB/Mi Tienda.

**Descripción técnica**:
Crear endpoints en backend SPIDI que consuman Cart Services `/api/stores`, extraigan ubicaciones de tiendas activas, dedupliquen estados y ciudades, y retornen catálogos limpios listos para usar en selectores del formulario.

**Justificación del cambio**:
- Cart Services devuelve tiendas con ubicaciones embebidas, NO catálogos directos
- La transformación en backend garantiza que solo se muestren ubicaciones con operación activa
- El catálogo se actualiza automáticamente al abrir/cerrar tiendas
- Frontend recibe datos listos sin procesamiento adicional

**Lógica de operación** (Implementación completa):

**Endpoint 1: GET /api/locations/states**
```csharp
[HttpGet("states")]
[ResponseCache(Duration = 86400)] // Cache 24h
public async Task<IActionResult> GetStates()
{
    try
    {
        // Consultar Cart Services
        var stores = await _cartServicesClient.GetStoresAsync();
        
        // Extraer y deduplicar estados de tiendas activas
        var states = stores
            .Where(s => s.Active)
            .Select(s => s.Location.State)
            .Distinct()
            .OrderBy(s => s)
            .Select((state, index) => new {
                id = index + 1, // ID generado por índice
                name = state
            })
            .ToList();
        
        return Ok(states);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error obteniendo estados desde Cart Services");
        
        // Fallback con datos estáticos si Cart Services falla
        return Ok(_fallbackLocationService.GetStates());
    }
}
```

**Endpoint 2: GET /api/locations/cities?stateId={id}**
```csharp
[HttpGet("cities")]
[ResponseCache(Duration = 86400, VaryByQueryKeys = new[] { "stateId" })]
public async Task<IActionResult> GetCities([FromQuery] int stateId)
{
    try
    {
        // Mapeo de ID a nombre de estado (desde cache o diccionario)
        var stateName = await _stateIdMapper.GetStateNameAsync(stateId);
        
        if (string.IsNullOrEmpty(stateName))
            return BadRequest("Estado no encontrado");
        
        // Consultar Cart Services
        var stores = await _cartServicesClient.GetStoresAsync();
        
        // Filtrar tiendas activas del estado y deduplicar ciudades
        var cities = stores
            .Where(s => s.Active && s.Location.State == stateName)
            .Select(s => s.Location.City)
            .Distinct()
            .OrderBy(c => c)
            .Select((city, index) => new {
                id = (stateId * 1000) + index + 1, // ID compuesto
                name = city,
                stateId = stateId
            })
            .ToList();
        
        return Ok(cities);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error obteniendo ciudades desde Cart Services");
        return Ok(_fallbackLocationService.GetCities(stateId));
    }
}
```

**Servicio de Fallback (datos estáticos como safety net):**
```csharp
public class FallbackLocationService
{
    private readonly List<StateDto> _states = new()
    {
        new StateDto { Id = 19, Name = "Nuevo León" },
        new StateDto { Id = 22, Name = "Querétaro" },
        // ... estados con presencia confirmada HEB/Mi Tienda
    };
    
    private readonly List<CityDto> _cities = new()
    {
        new CityDto { Id = 19001, Name = "Monterrey", StateId = 19 },
        new CityDto { Id = 19002, Name = "San Pedro Garza García", StateId = 19 },
        // ... ciudades principales
    };
    
    public List<StateDto> GetStates() => _states;
    public List<CityDto> GetCities(int stateId) => 
        _cities.Where(c => c.StateId == stateId).ToList();
}
```

**Servicio de mapeo State ID ↔ Nombre:**
```csharp
public class StateIdMapperService
{
    private readonly Dictionary<int, string> _stateMap = new();
    private readonly IMemoryCache _cache;
    private readonly ICartServicesClient _cartServicesClient;
    
    public async Task<string> GetStateNameAsync(int stateId)
    {
        // Intentar obtener desde cache
        var cacheKey = $"state_name_{stateId}";
        if (_cache.TryGetValue(cacheKey, out string cachedName))
            return cachedName;
        
        // Si no está en cache, reconstruir mapeo desde Cart Services
        var stores = await _cartServicesClient.GetStoresAsync();
        var statesList = stores
            .Where(s => s.Active)
            .Select(s => s.Location.State)
            .Distinct()
            .OrderBy(s => s)
            .ToList();
        
        // Verificar que el ID esté en rango
        if (stateId < 1 || stateId > statesList.Count)
            return null;
        
        var stateName = statesList[stateId - 1];
        
        // Guardar en cache
        _cache.Set(cacheKey, stateName, TimeSpan.FromHours(24));
        
        return stateName;
    }
}
```

**Cliente HTTP para Cart Services:**
```csharp
// Interface
public interface ICartServicesClient
{
    Task<List<StoreDto>> GetStoresAsync();
}

// Implementación
public class CartServicesClient : ICartServicesClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CartServicesClient> _logger;
    private readonly IMemoryCache _cache;
    private const string CACHE_KEY = "cart_services_stores";
    
    public CartServicesClient(HttpClient httpClient, ILogger<CartServicesClient> logger, IMemoryCache cache)
    {
        _httpClient = httpClient;
        _logger = logger;
        _cache = cache;
    }
    
    public async Task<List<StoreDto>> GetStoresAsync()
    {
        // Intentar obtener desde cache (24h)
        if (_cache.TryGetValue(CACHE_KEY, out List<StoreDto> cachedStores))
            return cachedStores;
        
        try
        {
            var response = await _httpClient.GetAsync("/api/stores");
            response.EnsureSuccessStatusCode();
            
            var stores = await response.Content.ReadFromJsonAsync<List<StoreDto>>();
            
            // Guardar en cache
            _cache.Set(CACHE_KEY, stores, TimeSpan.FromHours(24));
            
            return stores ?? new List<StoreDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error consultando Cart Services /api/stores");
            throw;
        }
    }
}

// DTOs (mapeo completo según OpenAPI spec)
public class StoreDto
{
    public string Id { get; set; }
    public string Name { get; set; }
    public bool Active { get; set; }
    public LocationDto Location { get; set; }
    
    // Propiedades adicionales (no usadas para catálogo pero parte del contrato)
    public string Cluster { get; set; }
    public List<object> GeoFence { get; set; }
    public List<string> ZipCodeCoverage { get; set; }
    public int UtcOffset { get; set; }
    public int SlotSize { get; set; }
    public List<string> DeliveryType { get; set; }
    public int PreparationTime { get; set; }
    public List<BlackoutDateDto> BlackoutDates { get; set; }
    public List<CapacityDayDto> Capacity { get; set; }
    public bool Cat { get; set; }
    public string Reference { get; set; }
    public double ShippingFee { get; set; }
    public object CapacityUsage { get; set; }
}

public class LocationDto
{
    public string State { get; set; }
    public string City { get; set; }
    public string Country { get; set; }
    public string Number { get; set; }
    public string ZipCode { get; set; }
    public string Street { get; set; }
    public GeoCoordinatesDto GeoCoordinates { get; set; }
    public string Neighborhood { get; set; }
}

public class GeoCoordinatesDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class BlackoutDateDto
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }
}

public class CapacityDayDto
{
    public List<string> Days { get; set; }
    public List<CapacityHourDto> Hours { get; set; }
    public int Quantity { get; set; }
}

public class CapacityHourDto
{
    public string From { get; set; }
    public string To { get; set; }
    public int Quantity { get; set; }
    public double ShippingFee { get; set; }
}

// DTOs para respuesta SPIDI (simplificados)
public class StateDto
{
    public int Id { get; set; }
    public string Name { get; set; }
}

public class CityDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int StateId { get; set; }
}

// Configuración (appsettings.json)
{
  "CartServices": {
    "BaseUrl": "https://hebaz-container-cartsrvce-dev-01.orangesmoke-37f85b34.eastus.azurecontainerapps.io",
    "BearerToken": "Bearer_token_de_ambiente_correspondiente"
  }
}

// Registro en DI (Program.cs)
services.AddHttpClient<ICartServicesClient, CartServicesClient>(client =>
{
    client.BaseAddress = new Uri(configuration["CartServices:BaseUrl"]);
    client.DefaultRequestHeaders.Authorization = 
        new AuthenticationHeaderValue("Bearer", configuration["CartServices:BearerToken"]);
    client.Timeout = TimeSpan.FromSeconds(30);
});
services.AddScoped<StateIdMapperService>();
services.AddScoped<FallbackLocationService>();
```

**Estructura de respuesta esperada:**

Estados:
```json
[
  { "id": 1, "name": "Nuevo León" },
  { "id": 2, "name": "Querétaro" }
]
```

Ciudades:
```json
[
  { "id": 1001, "name": "Monterrey", "stateId": 1 },
  { "id": 1002, "name": "San Pedro Garza García", "stateId": 1 }
]
```
```

**Validaciones** (Actualizar):
```markdown
- Cliente HTTP consume API según contrato OpenAPI 3.0.3 (docs/context/apis/cart_services.yml)
- Autenticación bearer funciona correctamente (token en header Authorization)
- DTOs mapean correctamente TODAS las propiedades del schema Store
- Solo se procesan tiendas con `active: true`
- Estados y ciudades se deduplicaN correctamente (sin repetidos)
- IDs generados son consistentes entre llamadas (mismo orden alfabético)
- Cache de 24h reduce llamadas innecesarias a Cart Services
- Fallback funciona si Cart Services falla o no responde
- Frontend recibe catálogos limpios listos para <select>
- Relación estado-ciudad es correcta
- Performance: respuesta < 200ms con cache, < 2s sin cache
- Manejo correcto de errores HTTP 401, 403, 500 según spec OpenAPI
```

**Dependencias** (Agregar):
```markdown
- HttpClient configurado con BaseAddress y BearerToken para Cart Services
- Configuración en appsettings.json según ambiente:
  - DEV: https://hebaz-container-cartsrvce-dev-01.orangesmoke-37f85b34.eastus.azurecontainerapps.io
  - Consultar docs/context/apis/cart_services.yml para URL de QA/PROD
- Bearer token válido obtenido de equipo de Cart Services
- Servicio de fallback (FallbackLocationService) con datos estáticos mínimos
- MemoryCache configurado (.NET MemoryCache)
- DTOs completos mapeando schema OpenAPI 3.0.3 (ver cart_services.yml)
- Servicios registrados en DI: ICartServicesClient, StateIdMapperService, FallbackLocationService
```

**Consideraciones técnicas adicionales**:
```markdown
IMPORTANTE - Estructura de Cart Services API:
Endpoint: GET https://hebaz-container-cartsrvce-dev-01.orangesmoke-37f85b34.eastus.azurecontainerapps.io/api/stores
Headers: Authorization: Bearer {token}

Respuesta (ejemplo real del API):
```json
[
  {
    "cluster": "heb-c060",
    "geoFence": [],
    "zipCodeCoverage": ["76269"],
    "utcOffset": -6,
    "slotSize": 60,
    "deliveryType": ["delivery", "pickup"],
    "preparationTime": 0,
    "active": true,
    "blackoutDates": [
      {
        "from": "2026-12-25T00:01:00-06:00",
        "to": "2026-12-25T23:59:59-06:00"
      }
    ],
    "capacity": [],
    "name": "HEB Zibata",
    "location": {
      "country": "México",
      "number": "23",
      "zipCode": "76269",
      "city": "Queretaro",
      "street": "Av. Paseo de las Pitahayas",
      "geoCoordinates": {
        "latitude": 20.67907685,
        "longitude": -100.31444404
      },
      "neighborhood": "Zibata",
      "state": "Queretaro"
    },
    "id": "2919",
    "cat": false,
    "reference": "hebmx002919",
    "shippingFee": 99,
    "capacityUsage": {}
  }
]
```

**Nota importante:**
- El cliente mapea TODAS las propiedades del schema OpenAPI
- Los endpoints transformadores solo USAN: Id, Name, Active, Location.State, Location.City
- Las demás propiedades están disponibles para futuras funcionalidades

**Implementación del cliente:**
- HttpClient con typed client pattern (ICartServicesClient)
- Cache de 24h en memoria para respuestas de Cart Services
- Bearer token configurado en appsettings.json
- Timeout de 30 segundos por request
- Manejo de excepciones con logging estructurado
- DTOs mapeados automáticamente con System.Text.Json

**Ventajas de esta solución:**
- Estados y ciudades reflejan automáticamente presencia física real
- No requiere mantenimiento manual de catálogos
- Si abren/cierran tiendas, catálogo se actualiza post-cache (24h)
- Fuente única de verdad: tiendas activas en Cart Services

**Alternativa (solo si Cart Services no disponible en producción):**
- Crear tablas `core.state` y `core.city` en BD
- Poblar con snapshot inicial desde Cart Services
- Ver tarea condicional en sección de "Tareas Nuevas"
```

---

#### Task 198235 - [FRONT] Consumir catálogo de ciudades y estados disponibles para registro

**Objetivo funcional**:
Permitir al aspirante seleccionar únicamente ciudades y estados válidos donde existe operación disponible de HEB/Mi Tienda.

**Descripción técnica**:
Integrar el formulario de registro con los endpoints transformadores del backend SPIDI que proveen catálogos de estados y ciudades desde Cart Services.

**⚠️ IMPORTANTE - Arquitectura de solución:**
- **NO consumir** Cart Services directamente desde frontend
- **SÍ consumir** endpoints del backend SPIDI: `/api/locations/states` y `/api/locations/cities`
- Backend SPIDI transforma datos de Cart Services y retorna catálogos limpios
- Frontend solo se preocupa por mostrar selectores dinámicos

**Lógica de operación** (Implementación completa):
```typescript
// Hook para catálogos geográficos
export const useLocationCatalogs = () => {
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar estados al montar componente
  useEffect(() => {
    const fetchStates = async () => {
      setLoadingStates(true);
      setError(null);
      
      try {
        const response = await fetch('/api/locations/states');
        
        if (!response.ok) {
          throw new Error('Error al cargar estados');
        }
        
        const data: State[] = await response.json();
        setStates(data);
        
        console.log(`Cargados ${data.length} estados desde backend`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar estados';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoadingStates(false);
      }
    };
    
    fetchStates();
  }, []);
  
  // Cargar ciudades cuando se selecciona un estado
  useEffect(() => {
    const fetchCities = async () => {
      if (!selectedStateId) {
        setCities([]);
        return;
      }
      
      setLoadingCities(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/locations/cities?stateId=${selectedStateId}`);
        
        if (!response.ok) {
          throw new Error('Error al cargar ciudades');
        }
        
        const data: City[] = await response.json();
        setCities(data);
        
        console.log(`Cargadas ${data.length} ciudades para estado ${selectedStateId}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar ciudades';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoadingCities(false);
      }
    };
    
    fetchCities();
  }, [selectedStateId]);
  
  const handleStateChange = (stateId: number) => {
    setSelectedStateId(stateId);
    // Limpiar ciudad seleccionada al cambiar estado
    // (manejado por el formulario padre)
  };
  
  return {
    states,
    cities,
    loadingStates,
    loadingCities,
    error,
    handleStateChange
  };
};

// Tipos
interface State {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
  stateId: number;
}

// Uso en formulario de registro
const RegistroFormulario = () => {
  const { register, setValue, watch, formState: { errors } } = useForm();
  const {
    states,
    cities,
    loadingStates,
    loadingCities,
    error,
    handleStateChange
  } = useLocationCatalogs();
  
  const watchStateId = watch('workStateId');
  
  useEffect(() => {
    if (watchStateId) {
      // Limpiar ciudad cuando cambia estado
      setValue('workCityId', null);
      setValue('workCityName', '');
      
      // Cargar ciudades del estado seleccionado
      handleStateChange(parseInt(watchStateId));
    }
  }, [watchStateId]);
  
  return (
    <form>
      {/* Selector de Estado */}
      <div className="form-group">
        <label htmlFor="workStateId">Estado de preferencia para trabajar *</label>
        
        {loadingStates ? (
          <div className="skeleton-loader">Cargando estados...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <select
            id="workStateId"
            {...register('workStateId', { 
              required: 'Debes seleccionar un estado',
              onChange: (e) => {
                const stateId = e.target.value;
                const state = states.find(s => s.id === parseInt(stateId));
                
                if (state) {
                  setValue('workStateName', state.name);
                }
              }
            })}
            className={errors.workStateId ? 'input-error' : ''}
          >
            <option value="">-- Selecciona un estado --</option>
            {states.map(state => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        )}
        
        {errors.workStateId && (
          <span className="error-text">{errors.workStateId.message}</span>
        )}
      </div>
      
      {/* Selector de Ciudad (habilitado solo si hay estado seleccionado) */}
      <div className="form-group">
        <label htmlFor="workCityId">Ciudad de preferencia para trabajar *</label>
        
        {!watchStateId ? (
          <select disabled className="input-disabled">
            <option>Primero selecciona un estado</option>
          </select>
        ) : loadingCities ? (
          <div className="skeleton-loader">Cargando ciudades...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <select
            id="workCityId"
            {...register('workCityId', { 
              required: 'Debes seleccionar una ciudad',
              onChange: (e) => {
                const cityId = e.target.value;
                const city = cities.find(c => c.id === parseInt(cityId));
                
                if (city) {
                  setValue('workCityName', city.name);
                }
              }
            })}
            className={errors.workCityId ? 'input-error' : ''}
          >
            <option value="">-- Selecciona una ciudad --</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        )}
        
        {errors.workCityId && (
          <span className="error-text">{errors.workCityId.message}</span>
        )}
      </div>
      
      {/* Hidden inputs para nombres (requeridos por backend) */}
      <input type="hidden" {...register('workStateName')} />
      <input type="hidden" {...register('workCityName')} />
    </form>
  );
};
```

**Manejo de errores y estados:**

```typescript
// Loading skeleton para mejor UX
const SkeletonLoader = () => (
  <div className="animate-pulse flex space-y-2">
    <div className="h-10 bg-gray-200 rounded w-full"></div>
  </div>
);

// Fallback cuando endpoints fallan
const LocationFallbackMessage = ({ onRetry }: { onRetry: () => void }) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
    <p className="text-sm text-yellow-800">
      No pudimos cargar las ubicaciones disponibles. 
      <button onClick={onRetry} className="underline ml-2">
        Intentar nuevamente
      </button>
    </p>
    <p className="text-xs text-yellow-600 mt-1">
      Si el problema persiste, contacta a soporte.
    </p>
  </div>
);
```

```

**IMPORTANTE - Campos obligatorios:**
- Backend SPIDI requiere **AMBOS**: `workStateId` + `workStateName`
- Backend SPIDI requiere **AMBOS**: `workCityId` + `workCityName`
- IDs se usan para integridad referencial (opcional si Cart Services no disponible)
- Nombres se usan como dato principal (obligatorio siempre)

**Validaciones** (Actualizar):
```markdown
- Estados se cargan automáticamente al montar formulario
- Ciudades se cargan solo cuando se selecciona un estado
- Selector de ciudades está deshabilitado hasta seleccionar estado
- Al cambiar estado, se limpia ciudad seleccionada previamente
- Solo se muestran ubicaciones con presencia física real (tiendas activas)
- Manejo correcto de estados de carga (skeleton loaders)
- Manejo correcto de errores con mensajes claros al usuario
- Botón de retry disponible si falla carga inicial
- Los campos ocultos workStateName y workCityName se actualizan automáticamente
- Validación de formulario previene envío sin selecciones completas
- Cache de 24h del backend reduce tiempos de carga (respuesta < 200ms)
- Fallback del backend garantiza disponibilidad mínima si Cart Services falla
```

**Dependencias** (Actualizar):
```markdown
- Task 198237: Endpoints transformadores /api/locations/states y /api/locations/cities implementados
- Backend SPIDI debe estar corriendo y accesible desde frontend
- Configuración CORS debe permitir requests desde frontend
- React Hook Form (biblioteca de formularios)
- Toast notifications (react-hot-toast o similar) para mensajes de error
- Tipos TypeScript para State y City (pueden generarse desde OpenAPI del backend)
```

**Consideraciones técnicas adicionales**:
```markdown
VENTAJAS de esta arquitectura:
- Frontend NO necesita bearer token de Cart Services (seguridad)
- Backend controla cache (24h) para optimizar performance
- Frontend recibe datos ya transformados y listos para usar
- Si Cart Services cambia estructura, solo se actualiza backend
- Fallback del backend garantiza funcionamiento mínimo
- IDs generados son consistentes (orden alfabético)

IMPORTANTE - Relación estado-ciudad:
- Campo workCityId.stateId debe coincidir con workStateId seleccionado
- Backend garantiza esta consistencia en respuesta
- Frontend valida que ciudad pertenezca al estado seleccionado
- Al cambiar estado, se limpia ciudad para forzar nueva selección

PERFORMANCE:
- Primera carga: estados desde backend con cache (< 200ms)
- Cambio de estado: ciudades desde backend con cache (< 200ms)
- Cache del navegador: considerar usar React Query o SWR para cache adicional
```

**Pruebas de aceptación:**
```markdown
1. Al abrir formulario, estados se cargan automáticamente en < 500ms
2. Selector de estados muestra todas las ubicaciones con tiendas activas
3. Selector de ciudades está deshabilitado hasta seleccionar estado
4. Al seleccionar "Nuevo León", se cargan ~10 ciudades (Monterrey, San Pedro, etc.)
5. Al cambiar de "Nuevo León" a "Querétaro", ciudad se limpia y se cargan ciudades de Querétaro
6. Si falla carga de estados, se muestra mensaje con botón de retry
7. Si falla carga de ciudades, se muestra mensaje de error
8. Formulario NO se puede enviar sin seleccionar estado y ciudad
9. Payload incluye tanto IDs como nombres de estado y ciudad
10. Si backend retorna fallback (offline Cart Services), estados mínimos se muestran correctamente
```

---

### HU 198195 - Verificación OTP SMS

#### Task 198239 - [BACK] Implementar servicio de verificación con Twilio Verify API

**Información a agregar:**

**Descripción técnica** (Arquitectura con Twilio Verify):
```markdown
Desarrollar un servicio que orqueste verificaciones OTP usando Twilio Verify API.

**⚠️ IMPORTANTE - Arquitectura:**
- Backend SPIDI **NO genera códigos OTP**
- Backend SPIDI **NO almacena códigos OTP**
- Backend SPIDI **NO valida códigos OTP**
- Backend SPIDI **SOLO orquesta** llamadas a Twilio Verify
- Twilio Verify **gestiona todo el ciclo de vida** del OTP

**Mecanismo de Sesión:**
El servicio usa `core.registration_session` para almacenar SOLO estado de verificación:
- `session_id` (GUID): Identificador único de sesión
- `phone`, `email`: Datos del aspirante
- `phone_verification_sid`: SID de verificación de Twilio (SMS)
- `email_verification_sid`: SID de verificación de Twilio (Email)
- `phone_verified`, `email_verified`: Banderas de verificación
- `retry_count`: Contador de reenvíos (control local)
- `created_at`, `expires_at`: Tiempo de vida de sesión (24h)

**Flujo con Twilio Verify:**
1. Backend solicita verificación a Twilio → Twilio genera y envía código
2. Twilio retorna `verification_sid`
3. Backend guarda `verification_sid` en sesión
4. Usuario ingresa código
5. Backend solicita validación a Twilio con `verification_sid` + código
6. Twilio valida y retorna status (approved/pending/canceled)
7. Backend marca `phone_verified`/`email_verified` según resultado
```

**Lógica de operación** (Implementación con Twilio Verify):
```csharp
// Interface
public interface ITwilioVerifyService
{
    Task<VerifySessionResult> CreateSessionAsync(string phone, string email, string ipAddress, string userAgent);
    Task<VerifyStartResult> StartVerificationAsync(string sessionId, VerifyChannel channel);
    Task<VerifyCheckResult> CheckVerificationAsync(string sessionId, VerifyChannel channel, string code);
}

public enum VerifyChannel { Phone, Email }

// Implementación
public class TwilioVerifyService : ITwilioVerifyService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly ILogger<TwilioVerifyService> _logger;
    private readonly string _verifyServiceSid;
    
    public TwilioVerifyService(AppDbContext context, IConfiguration config, ILogger<TwilioVerifyService> logger)
    {
        _context = context;
        _config = config;
        _logger = logger;
        _verifyServiceSid = config["Twilio:VerifyServiceSid"];
        
        // Inicializar cliente Twilio
        var accountSid = config["Twilio:AccountSid"];
        var authToken = config["Twilio:AuthToken"];
        TwilioClient.Init(accountSid, authToken);
    }
    
    public async Task<VerifySessionResult> CreateSessionAsync(string phone, string email, string ipAddress, string userAgent)
    {
        var session = new RegistrationSession
        {
            SessionId = Guid.NewGuid().ToString(),
            Phone = phone,
            Email = email,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IpAddress = ipAddress,
            UserAgent = userAgent
        };
        
        _context.RegistrationSessions.Add(session);
        await _context.SaveChangesAsync();
        
        return new VerifySessionResult { SessionId = session.SessionId, Success = true };
    }
    
    public async Task<VerifyStartResult> StartVerificationAsync(string sessionId, VerifyChannel channel)
    {
        var session = await _context.RegistrationSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
        if (session == null || session.ExpiresAt < DateTime.UtcNow)
            return new VerifyStartResult { Success = false, Error = "Sesión inválida o expirada" };
        
        // Validar límite de reintentos
        var retryCount = channel == VerifyChannel.Phone ? session.PhoneRetryCount : session.EmailRetryCount;
        if (retryCount >= 1)
            return new VerifyStartResult { Success = false, Error = "Límite de reintentos alcanzado" };
        
        try
        {
            var to = channel == VerifyChannel.Phone ? $"+52{session.Phone}" : session.Email;
            var channelType = channel == VerifyChannel.Phone ? "sms" : "email";
            
            // Solicitar verificación a Twilio Verify
            var verification = await VerificationResource.CreateAsync(
                to: to,
                channel: channelType,
                pathServiceSid: _verifyServiceSid
            );
            
            // Guardar SID de verificación en sesión
            if (channel == VerifyChannel.Phone)
            {
                session.PhoneVerificationSid = verification.Sid;
                session.PhoneRetryCount++;
            }
            else
            {
                session.EmailVerificationSid = verification.Sid;
                session.EmailRetryCount++;
            }
            
            await _context.SaveChangesAsync();
            
            _logger.LogInformation(
                "Verificación iniciada. Channel: {Channel}, To: {To}, Status: {Status}, SID: {Sid}",
                channelType, to, verification.Status, verification.Sid
            );
            
            return new VerifyStartResult 
            { 
                Success = true,
                VerificationSid = verification.Sid,
                Status = verification.Status
            };
        }
        catch (ApiException ex)
        {
            _logger.LogError(ex, "Error iniciando verificación Twilio. SessionId: {SessionId}, Channel: {Channel}",
                sessionId, channel);
            
            var errorMessage = ex.Code switch
            {
                60200 => "Formato de teléfono o email inválido",
                60203 => "Servicio Twilio Verify no encontrado. Contacta a soporte.",
                60212 => "Límite de intentos alcanzado. Intenta en 10 minutos.",
                _ => "Error al iniciar verificación. Intenta nuevamente."
            };
            
            return new VerifyStartResult { Success = false, Error = errorMessage };
        }
    }
    
    public async Task<VerifyCheckResult> CheckVerificationAsync(string sessionId, VerifyChannel channel, string code)
    {
        var session = await _context.RegistrationSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
        if (session == null)
            return new VerifyCheckResult { Success = false, Error = "Sesión no encontrada" };
        
        if (session.ExpiresAt < DateTime.UtcNow)
            return new VerifyCheckResult { Success = false, Error = "Sesión expirada" };
        
        var (verificationSid, alreadyVerified) = channel == VerifyChannel.Phone
            ? (session.PhoneVerificationSid, session.PhoneVerified)
            : (session.EmailVerificationSid, session.EmailVerified);
        
        if (alreadyVerified)
            return new VerifyCheckResult { Success = false, Error = "Ya fue verificado" };
        
        if (string.IsNullOrEmpty(verificationSid))
            return new VerifyCheckResult { Success = false, Error = "No se ha iniciado verificación" };
        
        try
        {
            var to = channel == VerifyChannel.Phone ? $"+52{session.Phone}" : session.Email;
            
            // Validar código con Twilio Verify
            var check = await VerificationCheckResource.CreateAsync(
                to: to,
                code: code,
                pathServiceSid: _verifyServiceSid
            );
            
            _logger.LogInformation(
                "Verificación validada. Channel: {Channel}, Status: {Status}, SID: {Sid}",
                channel, check.Status, check.Sid
            );
            
            if (check.Status == "approved")
            {
                // Marcar como verificado en sesión
                if (channel == VerifyChannel.Phone)
                    session.PhoneVerified = true;
                else
                    session.EmailVerified = true;
                
                await _context.SaveChangesAsync();
                
                return new VerifyCheckResult { Success = true, Status = "approved" };
            }
            else
            {
                return new VerifyCheckResult 
                { 
                    Success = false, 
                    Error = "Código incorrecto o expirado",
                    Status = check.Status
                };
            }
        }
        catch (ApiException ex)
        {
            _logger.LogError(ex, "Error validando código Twilio. SessionId: {SessionId}, Channel: {Channel}",
                sessionId, channel);
            
            var errorMessage = ex.Code switch
            {
                60200 => "Formato de código inválido",
                60202 => "Verificación expirada o no encontrada",
                60203 => "Código incorrecto",
                _ => "Error al validar código. Intenta nuevamente."
            };
            
            return new VerifyCheckResult { Success = false, Error = errorMessage };
        }
    }
}

// DTOs
public record VerifySessionResult(bool Success = false, string SessionId = null, string Error = null);
public record VerifyStartResult(bool Success = false, string VerificationSid = null, string Status = null, string Error = null);
public record VerifyCheckResult(bool Success = false, string Status = null, string Error = null);

// Configuración (appsettings.json)
{
  "Twilio": {
    "AccountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "AuthToken": "your_auth_token",
    "VerifyServiceSid": "VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}

// Registro en DI
services.AddScoped<ITwilioVerifyService, TwilioVerifyService>();
```

**Nota crítica:** 
- Twilio Verify **genera, almacena y valida** los códigos OTP
- Backend SPIDI **NO genera códigos** con Random.Next
- Backend SPIDI **NO almacena hashes** SHA256
- Backend SPIDI **solo orquesta** llamadas a Twilio Verify API
- Twilio gestiona: expiración (10 min), rate limits, intentos fallidos

**Dependencias** (Agregar):
```markdown
- Tabla `core.registration_session` creada con campos verification_sid
- NuGet: Twilio SDK (>= 6.0.0)
- Configuración Twilio Verify en appsettings.json:
  - Twilio:AccountSid
  - Twilio:AuthToken
  - Twilio:VerifyServiceSid (crear Verify Service en Twilio Console)
- Servicio registrado en DI: ITwilioVerifyService
- Entity Framework DbContext configurado
```

**Validaciones**:
```markdown
- Backend SPIDI NO genera códigos (Twilio Verify lo hace)
- Backend SPIDI NO almacena hashes (Twilio Verify lo gestiona)
- Backend SPIDI solo guarda verification_sid para tracking
- Twilio Verify gestiona expiración automáticamente (10 min default)
- Twilio Verify gestiona rate limiting automáticamente
- Twilio Verify gestiona intentos fallidos automáticamente
- Estados phone_verified/email_verified se marcan solo tras status="approved"
- Verificaciones se invalidan automáticamente si datos cambian (Twilio lo gestiona)
- Errores de Twilio se mapean a mensajes claros para usuario
```

---

#### Task 198240 - [BACK] Implementar verificación OTP por SMS con Twilio Verify

**Información a agregar:**

**Descripción técnica** (Arquitectura con Twilio Verify):
```markdown
Implementar endpoints que orquestan verificación de teléfono usando Twilio Verify API.

**Arquitectura del flujo:**
1. Frontend solicita envío de OTP por SMS
2. Backend llama a ITwilioVerifyService.StartVerificationAsync(sessionId, VerifyChannel.Phone)
3. Twilio Verify genera código de 6 dígitos
4. Twilio Verify envía SMS automáticamente (plantilla de Twilio)
5. Backend guarda verification_sid en session
6. Backend registra intento en communication_log
7. Frontend solicita validación con código ingresado
8. Backend llama a ITwilioVerifyService.CheckVerificationAsync(sessionId, VerifyChannel.Phone, code)
9. Twilio valida y retorna status (approved/pending/canceled)
10. Backend marca phone_verified = true si status = "approved"

**⚠️ IMPORTANTE:** 
- Twilio Verify **genera y envía** el código (backend NO genera)
- Twilio Verify **valida** el código (backend NO valida)
- Twilio Verify **usa su propia plantilla** SMS (NO usamos communication_template)
- Backend **solo orquesta** llamadas y registra logging
```

**Lógica de operación** (Endpoints):
```csharp
// Endpoint para solicitar verificación OTP por SMS
[HttpPost("api/otp/send-sms")]
public async Task<IActionResult> SendOtpSms([FromBody] SendOtpRequest request)
{
    try
    {
        // 1. Iniciar verificación con Twilio Verify
        var result = await _twilioVerifyService.StartVerificationAsync(
            request.SessionId, 
            VerifyChannel.Phone
        );
        
        if (!result.Success)
            return BadRequest(new { error = result.Error });
        
        // 2. Registrar envío exitoso en log
        await _commLogService.LogSmsAsync(new SmsLogEntry
        {
            Type = "OTP_SMS",
            PhoneNumber = request.PhoneNumber,
            MessagePreview = "Código OTP enviado vía Twilio Verify",
            Status = "SENT",
            ExternalId = result.VerificationSid,  // SID de Twilio
            SessionId = request.SessionId
        });
        
        return Ok(new 
        { 
            success = true,
            message = "Código enviado exitosamente",
            expiresInMinutes = 10  // Twilio default
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error enviando OTP SMS. SessionId: {SessionId}", request.SessionId);
        
        await _commLogService.LogSmsAsync(new SmsLogEntry
        {
            Type = "OTP_SMS",
            PhoneNumber = request.PhoneNumber,
            Status = "FAILED",
            ErrorMessage = ex.Message,
            SessionId = request.SessionId
        });
        
        return StatusCode(500, new { error = "Error al enviar código. Intenta nuevamente." });
    }
}

// Endpoint para validar OTP (compartido SMS y Email)
[HttpPost("api/otp/validate")]
public async Task<IActionResult> ValidateOtp([FromBody] ValidateOtpRequest request)
{
    try
    {
        var channel = request.Channel.ToLower() == "email" 
            ? VerifyChannel.Email 
            : VerifyChannel.Phone;
        
        // Validar con Twilio Verify
        var result = await _twilioVerifyService.CheckVerificationAsync(
            request.SessionId,
            channel,
            request.Code
        );
        
        if (!result.Success)
            return BadRequest(new { error = result.Error });
        
        return Ok(new 
        { 
            success = true, 
            verified = true,
            channel = request.Channel
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error validando OTP. SessionId: {SessionId}, Channel: {Channel}",
            request.SessionId, request.Channel);
        
        return StatusCode(500, new { error = "Error al validar código. Intenta nuevamente." });
    }
}

// DTOs
public record SendOtpRequest(string SessionId, string PhoneNumber);
public record ValidateOtpRequest(string SessionId, string Channel, string Code);
```

**Contrato de API:**

**Request: Enviar OTP**
```json
POST /api/otp/send-sms
Content-Type: application/json

{
  "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "phoneNumber": "8112345678"
}
```

**Response Success (200 OK):**
```json
{
  "success": true,
  "message": "Código enviado exitosamente",
  "expiresInMinutes": 10
}
```

**Request: Validar OTP**
```json
POST /api/otp/validate
Content-Type: application/json

{
  "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "channel": "phone",  // "phone" o "email"
  "code": "123456"
}
```

**Response Success (200 OK):**
```json
{
  "success": true,
  "verified": true,
  "channel": "phone"
}
```

**Response Error (400 Bad Request):**
```json
{
  "error": "Código incorrecto o expirado" | "Límite de reintentos alcanzado" | "Sesión expirada"
}

**Validaciones** (Agregar):
```markdown
- Backend NO genera códigos (Twilio Verify lo hace)
- Backend NO envía SMS (Twilio Verify lo hace)
- Backend NO valida códigos (Twilio Verify lo hace)
- Backend solo orquesta llamadas a Twilio Verify API
- Twilio Verify usa su propia plantilla SMS (NO se consume communication_template)
- Twilio Verify gestiona expiración automáticamente (10 min)
- Twilio Verify gestiona rate limiting automáticamente
- Todos los intentos se registran en communication_log con verification_sid
- Errores de Twilio se mapean a mensajes claros para usuario
- SessionId vincula verificación con sesión de registro
```

**Dependencias**:
```markdown
- Servicio ITwilioVerifyService implementado (Task 198239)
- Tabla registration_session con campo phone_verification_sid
- NuGet: Twilio SDK (>= 6.0.0)
- Configuración Twilio en appsettings.json (AccountSid, AuthToken, VerifyServiceSid)
- Servicio ICommunicationLogService para logging
- Twilio Verify Service creado en Twilio Console
```

**Diferencias clave vs arquitectura manual:**
```markdown
❌ Arquitectura Manual (ANTERIOR):
- Backend genera código con Random.Next()
- Backend almacena hash SHA256 en BD
- Backend obtiene plantilla desde communication_template
- Backend renderiza plantilla con tokens
- Backend envía SMS vía Twilio Messages API
- Backend valida comparando hashes

✅ Arquitectura Twilio Verify (NUEVA):
- Twilio Verify genera código
- Twilio Verify almacena y gestiona código
- Twilio Verify usa su propia plantilla
- Twilio Verify envía SMS automáticamente
- Twilio Verify valida código directamente
- Backend solo guarda verification_sid y marca phone_verified

**Ventajas:**
- Menos código custom
- Menos superficie de ataque (sin hashes en BD)
- Twilio gestiona seguridad end-to-end
- Rate limiting y expiración automáticos
- Dashboard de Twilio para monitoreo
- Invalidación automática si datos cambian
```

---

#### Task 198241 - [FRONT] Integrar validación de OTP telefónico y control de reenvío

**Información a agregar:**

**Lógica de operación** (Ampliar con implementación completa):
```typescript
// Hook de verificación de teléfono
const usePhoneOtpVerification = (sessionId: string, phone: string) => {
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneOtpValid, setPhoneOtpValid] = useState<boolean | null>(null);
  const [phoneOtpExpired, setPhoneOtpExpired] = useState(false);
  const [phoneOtpResendCount, setPhoneOtpResendCount] = useState(0);
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(600); // 10 min = 600 seg
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Countdown de expiración
  useEffect(() => {
    if (phoneOtpSent && phoneOtpTimer > 0 && !phoneOtpValid) {
      const interval = setInterval(() => {
        setPhoneOtpTimer(prev => {
          if (prev <= 1) {
            setPhoneOtpExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [phoneOtpSent, phoneOtpTimer, phoneOtpValid]);
  
  // Enviar OTP por SMS
  const sendPhoneOtp = async () => {
    if (isSending) return;
    
    setIsSending(true);
    
    try {
      const response = await fetch('/api/otp/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, phoneNumber: phone })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPhoneOtpSent(true);
        setPhoneOtpExpired(false);
        setPhoneOtpTimer(600);
        toast.success(`Código enviado a ${phone}`);
      } else {
        toast.error(result.error || 'Error al enviar código');
      }
    } catch (error) {
      toast.error('Error de conexión al enviar código');
    } finally {
      setIsSending(false);
    }
  };
  
  // Reenviar OTP
  const resendPhoneOtp = async () => {
    if (phoneOtpResendCount >= 1) {
      toast.error('Ya usaste tu reenvío. Contacta a soporte si necesitas ayuda.');
      return;
    }
    
    await sendPhoneOtp();
    setPhoneOtpResendCount(prev => prev + 1);
  };
  
  // Validar OTP al ingresar 6 dígitos
  useEffect(() => {
    const validatePhoneOtp = async () => {
      if (phoneOtpCode.length === 6 && !isVerifying) {
        setIsVerifying(true);
        
        try {
          const response = await fetch('/api/otp/validate', {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sessionId, 
              channel: 'phone',
              code: phoneOtpCode 
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            setPhoneOtpValid(true);
            toast.success('✓ Teléfono verificado correctamente');
            
            // Persistir estado
            localStorage.setItem('spidi_phone_verified', 'true');
          } else {
            setPhoneOtpValid(false);
            toast.error(result.error || 'Código incorrecto');
            setPhoneOtpCode(''); // Limpiar para reintentar
          }
        } catch (error) {
          setPhoneOtpValid(false);
          toast.error('Error al validar código');
          setPhoneOtpCode('');
        } finally {
          setIsVerifying(false);
        }
      }
    };
    
    validatePhoneOtp();
  }, [phoneOtpCode, sessionId, isVerifying]);
  
  // Formatear tiempo restante
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return {
    phoneOtpSent,
    phoneOtpCode,
    setPhoneOtpCode,
    phoneOtpValid,
    phoneOtpExpired,
    phoneOtpResendCount,
    phoneOtpTimer: formatTime(phoneOtpTimer),
    sendPhoneOtp,
    resendPhoneOtp,
    isVerifying,
    isSending,
    canResend: phoneOtpExpired && phoneOtpResendCount < 1
  };
};

// Uso en componente:
const PhoneVerificationSection = ({ sessionId, phone }) => {
  const {
    phoneOtpSent,
    phoneOtpCode,
    setPhoneOtpCode,
    phoneOtpValid,
    phoneOtpExpired,
    phoneOtpTimer,
    sendPhoneOtp,
    resendPhoneOtp,
    isVerifying,
    isSending,
    canResend
  } = usePhoneOtpVerification(sessionId, phone);
  
  return (
    <div className="verification-section">
      <h3>Verificar Teléfono</h3>
      <p className="phone-display">{phone}</p>
      
      {!phoneOtpSent ? (
        <button onClick={sendPhoneOtp} disabled={isSending}>
          {isSending ? 'Enviando...' : 'Enviar código por SMS'}
        </button>
      ) : (
        <>
          <div className="otp-input-container">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={phoneOtpCode}
              onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              disabled={phoneOtpValid === true}
              autoFocus
            />
            
            {isVerifying && <span className="spinner">Verificando...</span>}
            {phoneOtpValid === true && <span className="success">✓ Verificado</span>}
            {phoneOtpValid === false && <span className="error">✗ Código incorrecto</span>}
          </div>
          
          {!phoneOtpExpired && phoneOtpValid !== true && (
            <p className="timer">Código válido por: {phoneOtpTimer}</p>
          )}
          
          {phoneOtpExpired && (
            <p className="expired">Código expirado</p>
          )}
          
          {canResend && (
            <button onClick={resendPhoneOtp} className="btn-link">
              Reenviar código
            </button>
          )}
        </>
      )}
    </div>
  );
};
```

**Contrato de consumo del endpoint de validación:**

```typescript
// Request
POST /api/otp/validate-otp
Content-Type: application/json

{
  "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "channel": "phone",  // "phone" para SMS, "email" para email
  "code": "123456"
}

// Response Success (200 OK)
{
  "success": true,
  "verified": true
}

// Response Error (400 Bad Request)
{
  "error": "Sesión no encontrada" | "Sesión expirada" | "Ya fue verificado" | 
           "OTP no generado" | "OTP expirado" | "Código inválido"
}
```

**Flujo completo de verificación telefónica:**

1. Usuario hace clic en "Enviar código por SMS"
2. Frontend invoca `/api/otp/send-sms` con sessionId y phoneNumber
3. Backend solicita verificación a Twilio Verify (Twilio genera y envía SMS)
4. Si exitoso:
   - Muestra campo de entrada de 6 dígitos con autofocus
   - Muestra mensaje: "Código enviado a {phone}"
   - Inicia countdown de 10 minutos
   - Botón "Enviar código" se oculta
5. Usuario ingresa código (solo números, máximo 6 dígitos)
6. Al completar 6 dígitos, se valida automáticamente
7. Frontend invoca `/api/otp/validate` con sessionId, channel: "phone", code
8. Si válido (Twilio retorna status="approved"):
   - Marca "✓ Verificado"
   - Deshabilita input
   - Persiste en localStorage: `spidi_phone_verified = true`
   - **Habilita sección de verificación de email**
9. Si inválido:
   - Muestra error: "Código incorrecto"
   - Limpia campo automáticamente
   - Permite reintentar
10. Si expira:
    - Muestra: "Código expirado"
    - Habilita botón "Reenviar código" (solo 1 vez)

**Manejo de estados visuales:**

```tsx
// Estados del campo OTP
<input 
  className={cn(
    "otp-input",
    phoneOtpValid === true && "otp-valid",
    phoneOtpValid === false && "otp-invalid",
    phoneOtpExpired && "otp-expired"
  )}
  disabled={phoneOtpValid === true}
  autoFocus={phoneOtpSent && phoneOtpValid !== true}
/>

// Indicadores de estado
{phoneOtpValid === true && (
  <div className="success-indicator">
    <CheckCircle className="icon" />
    <span>Teléfono verificado</span>
  </div>
)}

{phoneOtpValid === false && (
  <div className="error-indicator">
    <XCircle className="icon" />
    <span>Código incorrecto. Intenta nuevamente.</span>
  </div>
)}
```

**Validaciones** (Agregar):
```markdown
- Campo OTP solo acepta números, máximo 6 dígitos
- Validación se dispara automáticamente al completar 6 dígitos
- Countdown de 10 minutos visible al usuario en formato MM:SS
- Botón de reenvío solo disponible después de expiración
- Máximo 1 reenvío por sesión (phoneOtpResendCount <= 1)
- Estado de verificación persiste en localStorage
- Sección de email SE HABILITA solo después de verificar teléfono exitosamente
- Errores se muestran de forma clara y accionable
- Loading states durante envío y validación para mejor UX
- Campo tiene autofocus al mostrar input de OTP
- Código se limpia automáticamente si es inválido (permite reintentar fácilmente)
- Timer se reinicia en caso de reenvío
```

**Dependencias** (Agregar):
```markdown
- Task 198234 (transición a verificación) completada
- Task 198240 (Twilio Verify SMS) implementado
- Task 198239 (ITwilioVerifyService) implementado
- Endpoint `/api/otp/validate` implementado (compartido con email)
- localStorage para persistencia de estado
- Toast notifications configuradas (react-hot-toast o similar)
- Librerías UI: CheckCircle, XCircle icons (lucide-react o similar)
```

**Consideraciones adicionales**:
```markdown
- Al verificar teléfono exitosamente, se debe habilitar la sección de verificación de email
- El estado phoneOtpValid debe ser accesible desde componente padre para controlar habilitación de siguiente sección
- Si usuario recarga página, recuperar estado desde localStorage
- Manejo de errores de red con mensajes claros: "Error de conexión. Verifica tu internet."
- Twilio Verify gestiona expiración, no hay necesidad de timer manual (opcional para UX)
- Considerar deshabilitación temporal del botón de envío después de enviar (cooldown de 1 minuto)
- Retry limit (1 reenvío) se gestiona en backend, frontend solo muestra mensaje
```

---

### HU 198201 - Verificación OTP Email

#### Task 198243 - [FRONT] Implementar sección de verificación de correo electrónico por OTP

**Información a agregar:**

**Lógica de operación** (Ampliar con flujo completo):
```markdown
La sección debe permanecer deshabilitada hasta validar correctamente el teléfono.

**Estado inicial:**
- Sección aparece en gris/bloqueada
- Mensaje: "Primero verifica tu teléfono para continuar"

**Al verificar teléfono exitosamente:**
- Sección se habilita automáticamente
- Muestra email capturado en paso anterior (no editable)
- Botón "Enviar código" habilitado

**Flujo de verificación:**
1. Usuario hace clic en "Enviar código"
2. Frontend invoca endpoint de generación OTP email
3. Si exitoso:
   - Muestra campo de entrada de 6 dígitos
   - Muestra mensaje: "Código enviado a {email}"
   - Inicia countdown de 10 minutos
   - Botón "Enviar código" cambia a "Reenviar código" (disabled por 1 minuto)
4. Usuario ingresa código
5. Al ingresar 6 dígitos, validar automáticamente
6. Si válido:
   - Marcar "✓ Verificado"
   - Deshabilitar input
   - Habilitar botón "Enviar" del formulario completo
7. Si inválido:
   - Mostrar error: "Código incorrecto"
   - Permitir reintentar
8. Si expira:
   - Mostrar: "Código expirado"
   - Habilitar botón "Reenviar código" (solo 1 vez)

**Manejo de reenvío:**
```typescript
const [emailResendCount, setEmailResendCount] = useState(0);

const handleResendEmailOtp = async () => {
  if (emailResendCount >= 1) {
    toast.error('Ya usaste tu reenvío. Contacta a soporte si necesitas ayuda.');
    return;
  }
  
  const result = await fetch('/api/otp/send-email', {
    method: 'POST',
    body: JSON.stringify({ sessionId, email: formData.email })
  }).then(r => r.json());
  
  if (result.success) {
    setEmailResendCount(prev => prev + 1);
    toast.success('Nuevo código enviado a tu email');
    resetEmailOtpTimer();
  } else {
    toast.error(result.error || 'Error al reenviar código');
  }
};
```

**Validaciones visuales:**
- Email se muestra pero no es editable
- Campo OTP solo acepta números (6 dígitos)
- Countdown visible durante validez
- Indicador claro de estado: Pendiente → Enviado → Verificado
- Límite de reenvío claramente comunicado
```

**Validaciones** (Agregar):
```markdown
- Sección solo se habilita DESPUÉS de verificar teléfono
- Email mostrado coincide con el capturado previamente
- Campo OTP solo acepta input numérico de 6 caracteres
- Validación automática al completar 6 dígitos
- Botón de reenvío solo se habilita después de expiración
- Máximo 1 reenvío permitido por sesión
- Estado "Verificado" persiste si usuario regresa
- No se permite enviar formulario sin ambas verificaciones
```

**Dependencias** (Agregar):
```markdown
- Task 198234 (transición a verificación) completada
- Task 198244 (Twilio Verify Email) implementado
- Task 198239 (ITwilioVerifyService) implementado
- Estado de verificación phone debe ser true
```

---

#### Task 198244 - [BACK] Implementar verificación OTP por Email con Twilio Verify

**Información a agregar:**

**Descripción técnica** (Arquitectura con Twilio Verify):
```markdown
Implementar endpoint que orquesta verificación de email usando Twilio Verify API.

**Arquitectura del flujo:**
1. Frontend solicita envío de OTP por Email
2. Backend llama a ITwilioVerifyService.StartVerificationAsync(sessionId, VerifyChannel.Email)
3. Twilio Verify genera código de 6 dígitos
4. Twilio Verify envía Email automáticamente (plantilla de Twilio)
5. Backend guarda verification_sid en session
6. Backend registra intento en communication_log
7. Frontend solicita validación con código ingresado
8. Backend llama a ITwilioVerifyService.CheckVerificationAsync(sessionId, VerifyChannel.Email, code)
9. Twilio valida y retorna status (approved/pending/canceled)
10. Backend marca email_verified = true si status = "approved"

**⚠️ IMPORTANTE:** 
- Twilio Verify **genera y envía** el código (backend NO genera)
- Twilio Verify **valida** el código (backend NO valida)
- Twilio Verify **usa su propia plantilla** Email (NO usamos communication_template)
- Backend **solo orquesta** llamadas y registra logging
- Mismo flujo que SMS (Task 198240), solo cambia el canal
```

**Lógica de operación** (Endpoint):
```csharp
// Endpoint para solicitar verificación OTP por Email
[HttpPost("api/otp/send-email")]
public async Task<IActionResult> SendOtpEmail([FromBody] SendOtpEmailRequest request)
{
    try
    {
        // 1. Iniciar verificación con Twilio Verify (canal Email)
        var result = await _twilioVerifyService.StartVerificationAsync(
            request.SessionId, 
            VerifyChannel.Email
        );
        
        if (!result.Success)
            return BadRequest(new { error = result.Error });
        
        // 2. Registrar envío exitoso en log
        await _commLogService.LogEmailAsync(new EmailLogEntry
        {
            Type = "OTP_EMAIL",
            Email = request.Email,
            Subject = "Código de verificación SPIDI",  // Twilio template
            BodyPreview = "Código OTP enviado vía Twilio Verify",
            Status = "SENT",
            ExternalMessageId = result.VerificationSid,  // SID de Twilio
            SessionId = request.SessionId
        });
        
        return Ok(new 
        { 
            success = true,
            message = "Código enviado exitosamente a tu email",
            expiresInMinutes = 10  // Twilio default
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error enviando OTP Email. SessionId: {SessionId}", request.SessionId);
        
        await _commLogService.LogEmailAsync(new EmailLogEntry
        {
            Type = "OTP_EMAIL",
            Email = request.Email,
            Status = "FAILED",
            ErrorMessage = ex.Message,
            SessionId = request.SessionId
        });
        
        return StatusCode(500, new { error = "Error al enviar código. Intenta nuevamente." });
    }
}

// Endpoint de validación /api/otp/validate es compartido (Task 198240)
// Solo cambias channel: "email" en el request

// DTO
public record SendOtpEmailRequest(string SessionId, string Email);
```

**Contrato de API:**

**Request: Enviar OTP**
```json
POST /api/otp/send-email
Content-Type: application/json

{
  "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "email": "usuario@example.com"
}
```

**Response Success (200 OK):**
```json
{
  "success": true,
  "message": "Código enviado exitosamente a tu email",
  "expiresInMinutes": 10
}
```

**Request: Validar OTP (compartido con SMS)**
```json
POST /api/otp/validate
Content-Type: application/json

{
  "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "channel": "email",  // "phone" o "email"
  "code": "123456"
}
```

**Response Success (200 OK):**
```json
{
  "success": true,
  "verified": true,
  "channel": "email"
}
```

**Validaciones** (Agregar):
```markdown
- Backend NO genera códigos (Twilio Verify lo hace)
- Backend NO envía emails (Twilio Verify lo hace)
- Backend NO valida códigos (Twilio Verify lo hace)
- Backend solo orquesta llamadas a Twilio Verify API
- Twilio Verify usa su propia plantilla Email (NO se consume communication_template)
- Twilio Verify gestiona expiración automáticamente (10 min)
- Todos los intentos (exitosos/fallidos) se registran en communication_log
- SessionId vincula verificación con sesión de registro
- Validación de email usa mismo endpoint que SMS (parámetro channel diferencia)
- Rate limiting gestionado por Twilio Verify
```

**Dependencias** (Agregar):
```markdown
- Servicio ITwilioVerifyService implementado (Task 198239)
- Tabla registration_session con campo email_verification_sid
- NuGet: Twilio SDK (>= 6.0.0)
- Configuración Twilio en appsettings.json (mismo que SMS)
- Servicio ICommunicationLogService para logging
- Twilio Verify Service debe tener Email habilitado (configuración en Twilio Console)
```

**Diferencias clave vs arquitectura manual:**
```markdown
❌ Arquitectura Manual (ANTERIOR):
- Backend genera código
- Backend obtiene plantilla "OTP_EMAIL" desde communication_template
- Backend renderiza plantilla HTML con tokens
- Backend envía via SendGrid/SMTP
- Backend valida comparando hashes

✅ Arquitectura Twilio Verify (NUEVA):
- Twilio Verify genera código
- Twilio Verify usa plantilla propia (personalizable en Twilio Console)
- Twilio Verify envía email automáticamente
- Twilio Verify valida código directamente
- Backend solo guarda verification_sid

**Ventajas:**
- Sin dependencia de SendGrid/SMTP
- API única para SMS y Email (Twilio Verify)
- Gestión centralizada de verificaciones
- Plantillas Email personalizables en Twilio Console (sin deploy)
- Tracking unificado en dashboard Twilio
```

---

#### Task 198245 - [FRONT] Integrar validación de OTP por correo y control de reenvío

**Información a agregar:**

**Lógica de operación** (Ampliar con implementación completa):
```typescript
// Hook de verificación de email
const useEmailOtpVerification = (sessionId: string, email: string) => {
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpValid, setEmailOtpValid] = useState<boolean | null>(null);
  const [emailOtpExpired, setEmailOtpExpired] = useState(false);
  const [emailOtpResendCount, setEmailOtpResendCount] = useState(0);
  const [emailOtpTimer, setEmailOtpTimer] = useState(600); // 10 min = 600 seg
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Countdown de expiración
  useEffect(() => {
    if (emailOtpSent && emailOtpTimer > 0 && !emailOtpValid) {
      const interval = setInterval(() => {
        setEmailOtpTimer(prev => {
          if (prev <= 1) {
            setEmailOtpExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [emailOtpSent, emailOtpTimer, emailOtpValid]);
  
  // Enviar OTP por email
  const sendEmailOtp = async () => {
    if (isSending) return;
    
    setIsSending(true);
    
    try {
      const response = await fetch('/api/otp/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, email })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setEmailOtpSent(true);
        setEmailOtpExpired(false);
        setEmailOtpTimer(600);
        toast.success(`Código enviado a ${email}`);
      } else {
        toast.error(result.error || 'Error al enviar código');
      }
    } catch (error) {
      toast.error('Error de conexión al enviar código');
    } finally {
      setIsSending(false);
    }
  };
  
  // Reenviar OTP
  const resendEmailOtp = async () => {
    if (emailOtpResendCount >= 1) {
      toast.error('Ya usaste tu reenvío. Contacta a soporte si necesitas ayuda.');
      return;
    }
    
    await sendEmailOtp();
    setEmailOtpResendCount(prev => prev + 1);
  };
  
  // Validar OTP al ingresar 6 dígitos
  useEffect(() => {
    const validateEmailOtp = async () => {
      if (emailOtpCode.length === 6 && !isVerifying) {
        setIsVerifying(true);
        
        try {
const response = await fetch('/api/otp/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sessionId, 
              channel: 'email',
              code: emailOtpCode 
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            setEmailOtpValid(true);
            toast.success('✓ Email verificado correctamente');
            
            // Persistir estado
            localStorage.setItem('spidi_email_verified', 'true');
          } else {
            setEmailOtpValid(false);
            toast.error(result.error || 'Código incorrecto');
            setEmailOtpCode(''); // Limpiar para reintentar
          }
        } catch (error) {
          setEmailOtpValid(false);
          toast.error('Error al validar código');
          setEmailOtpCode('');
        } finally {
          setIsVerifying(false);
        }
      }
    };
    
    validateEmailOtp();
  }, [emailOtpCode, sessionId, isVerifying]);
  
  // Formatear tiempo restante
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return {
    emailOtpSent,
    emailOtpCode,
    setEmailOtpCode,
    emailOtpValid,
    emailOtpExpired,
    emailOtpResendCount,
    emailOtpTimer: formatTime(emailOtpTimer),
    sendEmailOtp,
    resendEmailOtp,
    isVerifying,
    isSending,
    canResend: emailOtpExpired && emailOtpResendCount < 1
  };
};

// Uso en componente:
const EmailVerificationSection = ({ sessionId, email, phoneVerified }) => {
  const {
    emailOtpSent,
    emailOtpCode,
    setEmailOtpCode,
    emailOtpValid,
    emailOtpExpired,
    emailOtpTimer,
    sendEmailOtp,
    resendEmailOtp,
    isVerifying,
    isSending,
    canResend
  } = useEmailOtpVerification(sessionId, email);
  
  return (
    <div className={`verification-section ${!phoneVerified ? 'disabled' : ''}`}>
      <h3>Verificar Correo Electrónico</h3>
      
      {!phoneVerified ? (
        <p className="text-muted">Primero verifica tu teléfono para continuar</p>
      ) : (
        <>
          <p className="email-display">{email}</p>
          
          {!emailOtpSent ? (
            <button onClick={sendEmailOtp} disabled={isSending}>
              {isSending ? 'Enviando...' : 'Enviar código'}
            </button>
          ) : (
            <>
              <div className="otp-input-container">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={emailOtpCode}
                  onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  disabled={emailOtpValid === true}
                />
                
                {isVerifying && <span className="spinner">Verificando...</span>}
                {emailOtpValid === true && <span className="success">✓ Verificado</span>}
                {emailOtpValid === false && <span className="error">✗ Código incorrecto</span>}
              </div>
              
              {!emailOtpExpired && emailOtpValid !== true && (
                <p className="timer">Código válido por: {emailOtpTimer}</p>
              )}
              
              {emailOtpExpired && (
                <p className="expired">Código expirado</p>
              )}
              
              {canResend && (
                <button onClick={resendEmailOtp} className="btn-link">
                  Reenviar código
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
```

**Validaciones** (Agregar):
```markdown
- Sección solo se habilita cuando phoneVerified = true
- Campo OTP solo acepta números, máximo 6 dígitos
- Validación se dispara automáticamente al completar 6 dígitos
- Countdown de 10 minutos visible al usuario
- Botón de reenvío solo disponible después de expiración
- Máximo 1 reenvío por sesión (emailOtpResendCount <= 1)
- Estado de verificación persiste en localStorage
- No se permite enviar formulario completo sin email verificado
- Errores se muestran de forma clara y accionable
- Loading states durante envío y validación
```

**Dependencias** (Agregar):
```markdown
- Task 198243 (sección de verificación email) implementada
- Task 198244 (Twilio Verify Email) implementado
- Task 198239 (ITwilioVerifyService) implementado
- Estado phoneVerified debe ser true para habilitar sección
- localStorage para persistencia de estado
- Toast notifications configuradas (react-hot-toast o similar)
```

---

### HU 198207 - Guardado del Registro

#### Task 198249 - [BACK] Implementar endpoint de recepción del registro inicial

**Información a agregar:**

**Descripción técnica** (Especificar endpoint completo):
```markdown
Implementar endpoint POST /api/drivers/register que recibe datos del formulario, valida sesión verificada, invoca SP de inserción y envía email de bienvenida SOLO si el registro fue exitoso.

**Endpoint:** POST /api/drivers/register
**Content-Type:** application/json
**Headers requeridos:** X-Session-Token con session_id
```

**Lógica de operación** (Implementación completa del endpoint):
```csharp
[ApiController]
[Route("api/drivers")]
public class DriversController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWelcomeEmailService _welcomeEmailService;
    private readonly ILogger<DriversController> _logger;
    
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] DriverRegistrationRequest request)
    {
        // 1. VALIDAR SESSION_ID en header
        if (!Request.Headers.TryGetValue("X-Session-Token", out var sessionIdHeader))
        {
            return BadRequest(new
            {
                success = false,
                errorCode = "SESSION_MISSING",
                message = "Sesión no encontrada. Por favor recarga la página."
            });
        }
        
        var sessionId = sessionIdHeader.ToString();
        
        // 2. VALIDAR que sesión existe y está verificada
        var session = await _context.RegistrationSessions
            .FirstOrDefaultAsync(s => s.SessionId == sessionId);
        
        if (session == null)
        {
            return BadRequest(new
            {
                success = false,
                errorCode = "SESSION_NOT_FOUND",
                message = "Sesión inválida o expirada. Por favor recarga la página."
            });
        }
        
        // 3. VALIDAR que sesión no ha expirado
        if (session.ExpiresAt < DateTime.UtcNow)
        {
            return BadRequest(new
            {
                success = false,
                errorCode = "SESSION_EXPIRED",
                message = "Tu sesión ha expirado. Por favor recarga la página y vuelve a intentarlo."
            });
        }
        
        // 4. VALIDAR verificación completa de teléfono y email
        if (!session.PhoneVerified || !session.EmailVerified)
        {
            return BadRequest(new
            {
                success = false,
                errorCode = "VERIFICATION_INCOMPLETE",
                message = "Debes completar la verificación de teléfono y email antes de continuar."
            });
        }
        
        // 5. VALIDAR coincidencia de phone y email con sesión
        if (session.Phone != request.PhoneNumber || session.Email.ToLower() != request.Email.ToLower())
        {
            _logger.LogWarning("Intento de registro con datos diferentes a sesión verificada. SessionId: {SessionId}", sessionId);
            return BadRequest(new
            {
                success = false,
                errorCode = "DATA_MISMATCH",
                message = "Los datos no coinciden con la verificación realizada."
            });
        }
        
        // 6. INVOCAR Stored Procedure de inserción
        try
        {
            var resultParam = new SqlParameter("@result", SqlDbType.Int) { Direction = ParameterDirection.Output };
            var driverIdParam = new SqlParameter("@driverId", SqlDbType.Int) { Direction = ParameterDirection.Output };
            var errorCodeParam = new SqlParameter("@errorCode", SqlDbType.NVarChar, 50) { Direction = ParameterDirection.Output };
            var errorMessageParam = new SqlParameter("@errorMessage", SqlDbType.NVarChar, 500) { Direction = ParameterDirection.Output };
            
            await _context.Database.ExecuteSqlRawAsync(
                @"EXEC core.sp_insert_driver_from_landing 
                    @firstName, @middleName, @paternalSurname, @maternalSurname, 
                    @phone, @email, 
                    @vehicleMake, @vehicleModel, @vehicleYear, @vehiclePlates, @vehicleColor,
                    @workStateId, @workStateName, @workCityId, @workCityName, @referalSource,
                    @result OUTPUT, @driverId OUTPUT, @errorCode OUTPUT, @errorMessage OUTPUT",
                new SqlParameter("@firstName", request.FirstName),
                new SqlParameter("@middleName", (object)request.MiddleName ?? DBNull.Value),
                new SqlParameter("@paternalSurname", request.PaternalSurname),
                new SqlParameter("@maternalSurname", (object)request.MaternalSurname ?? DBNull.Value),
                new SqlParameter("@phone", request.PhoneNumber),
                new SqlParameter("@email", request.Email),
                new SqlParameter("@vehicleMake", request.VehicleBrand),
                new SqlParameter("@vehicleModel", request.VehicleModel),
                new SqlParameter("@vehicleYear", request.VehicleYear),
                new SqlParameter("@vehiclePlates", request.VehiclePlates),
                new SqlParameter("@vehicleColor", request.VehicleColor),
                new SqlParameter("@workStateId", (object)request.WorkStateId ?? DBNull.Value),
                new SqlParameter("@workStateName", request.WorkStateName),
                new SqlParameter("@workCityId", (object)request.WorkCityId ?? DBNull.Value),
                new SqlParameter("@workCityName", request.WorkCityName),
                new SqlParameter("@referalSource", request.ReferalSource),
                resultParam,
                driverIdParam,
                errorCodeParam,
                errorMessageParam
            );
            
            var result = (int)resultParam.Value;
            
            // 7. PROCESAR resultado del SP
            if (result == 0)
            {
                // Error en inserción
                var errorCode = errorCodeParam.Value?.ToString();
                var errorMessage = errorMessageParam.Value?.ToString();
                
                _logger.LogWarning("Fallo inserción de driver desde landing. ErrorCode: {ErrorCode}, Message: {Message}", 
                    errorCode, errorMessage);
                
                return BadRequest(new
                {
                    success = false,
                    errorCode = errorCode,
                    message = errorMessage
                });
            }
            
            // 8. ✅ REGISTRO EXITOSO - Obtener driverId
            var driverId = (int)driverIdParam.Value;
            
            _logger.LogInformation("Driver registrado exitosamente desde landing. DriverId: {DriverId}, Email: {Email}", 
                driverId, request.Email);
            
            // 9. INVALIDAR sesión (marcar como completada)
            session.Completed = true;
            session.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            
            // 10. ✅ ENVIAR EMAIL DE BIENVENIDA (asíncrono, NO bloquea respuesta)
            //     IMPORTANTE: Solo se ejecuta si el registro fue exitoso
            _ = Task.Run(async () =>
            {
                try
                {
                    await _welcomeEmailService.SendWelcomeEmailAsync(driverId);
                }
                catch (Exception ex)
                {
                    // No romper el flujo si falla el email
                    _logger.LogError(ex, "Error enviando email de bienvenida async para DriverId: {DriverId}", driverId);
                }
            });
            
            // 11. RETORNAR respuesta exitosa al frontend
            return Ok(new
            {
                success = true,
                driverId = driverId,
                message = "¡Registro exitoso! Recibirás un email de bienvenida en breve con los próximos pasos."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción en registro de aspirante. SessionId: {SessionId}", sessionId);
            
            return StatusCode(500, new
            {
                success = false,
                errorCode = "SERVER_ERROR",
                message = "Error del servidor al procesar tu registro. Por favor intenta nuevamente."
            });
        }
    }
}

// DTO de Request
public class DriverRegistrationRequest
{
    public string FirstName { get; set; }
    public string MiddleName { get; set; }
    public string PaternalSurname { get; set; }
    public string MaternalSurname { get; set; }
    public string PhoneNumber { get; set; }
    public string Email { get; set; }
    public string VehicleBrand { get; set; }
    public string VehicleModel { get; set; }
    public string VehicleYear { get; set; }
    public string VehiclePlates { get; set; }
    public string VehicleColor { get; set; }
    public int? WorkStateId { get; set; }
    public string WorkStateName { get; set; }
    public int? WorkCityId { get; set; }
    public string WorkCityName { get; set; }
    public string ReferalSource { get; set; }
}
```

**Request Example:**
```json
POST /api/drivers/register
Headers:
  X-Session-Token: f47ac10b-58cc-4372-a567-0e02b2c3d479
  Content-Type: application/json

Body:
{
  "firstName": "Juan",
  "middleName": "Carlos",
  "paternalSurname": "Pérez",
  "maternalSurname": "García",
  "phoneNumber": "8112345678",
  "email": "juan.perez@example.com",
  "vehicleBrand": "Toyota",
  "vehicleModel": "Corolla",
  "vehicleYear": "2020",
  "vehiclePlates": "ABC1234",
  "vehicleColor": "Blanco",
  "workStateId": 19,
  "workStateName": "Nuevo León",
  "workCityId": 19001,
  "workCityName": "Monterrey"
}
```

**Response Success (200 OK):**
```json
{
  "success": true,
  "driverId": 12345,
  "message": "¡Registro exitoso! Recibirás un email de bienvenida en breve con los próximos pasos."
}
```

**Response Errors:**

**Error: Sesión no verificada (400 Bad Request)**
```json
{
  "success": false,
  "errorCode": "VERIFICATION_INCOMPLETE",
  "message": "Debes completar la verificación de teléfono y email antes de continuar."
}
```

**Error: Teléfono duplicado (400 Bad Request)**
```json
{
  "success": false,
  "errorCode": "DUPLICATE_PHONE",
  "message": "El teléfono ya está registrado"
}
```

**Error: Email duplicado (400 Bad Request)**
```json
{
  "success": false,
  "errorCode": "DUPLICATE_EMAIL",
  "message": "El email ya está registrado"
}
```

**Error: Sesión expirada (400 Bad Request)**
```json
{
  "success": false,
  "errorCode": "SESSION_EXPIRED",
  "message": "Tu sesión ha expirado. Por favor recarga la página y vuelve a intentarlo."
}
```

**Error: Servidor (500 Internal Server Error)**
```json
{
  "success": false,
  "errorCode": "SERVER_ERROR",
  "message": "Error del servidor al procesar tu registro. Por favor intenta nuevamente."
}
```

**IMPORTANTE - Orden de ejecución:**
```markdown
1. ✅ Validar sesión completa
2. ✅ Insertar en BD via SP
3. ✅ Si inserción exitosa → Marcar sesión como completada
4. ✅ Si inserción exitosa → Enviar email de bienvenida (async, NO bloquea)
5. ✅ Retornar respuesta al usuario

❌ NO enviar email si:
- Sesión no está verificada
- SP retorna error (duplicado, constraint, etc.)
- Excepción antes de inserción

✅ Email se envía SOLO después de registro exitoso en BD
✅ Fallo de email NO rompe flujo (ya se registró exitosamente)
```

**Validaciones** (Actualizar):
```markdown
- Header X-Session-Token es obligatorio
- Sesión debe estar activa y verificada ANTES de permitir guardado
- No se permite guardado sin verificación completa de ambos canales (phone_verified=true, email_verified=true)
- Phone y email del payload deben coincidir con sesión verificada
- Email de bienvenida se envía SOLO si inserción en BD fue exitosa
- Email se envía de forma asíncrona (Task.Run) para NO bloquear respuesta al usuario
- Si email falla, NO afecta resultado del registro (usuario ya está registrado)
- Sesión se marca como completed para prevenir reenvíos duplicados
- Respuesta incluye código de error específico para debugging
- Todos los errores se loggean con contexto (sessionId, driverId, email)
```

**Dependencias** (Agregar):
```markdown
- Task 198252: SP core.sp_insert_driver_from_landing implementado
- Task 198258: IWelcomeEmailService implementado
- Tabla core.registration_session con campos phone_verified, email_verified
- Entity Framework DbContext configurado
- Microsoft.Data.SqlClient para invocación de SP con OUTPUT params
- Servicio IWelcomeEmailService registrado en DI
```

---

#### Task 198252 - [DB] Crear Stored Procedure para inserción del registro inicial

**Información a agregar:**

**Descripción técnica** (Reemplazar con especificación completa):
```markdown
Desarrollar el Stored Procedure que inserte la información del aspirante en `core.driver` con driver_status_id=1 (Pendiente) y driver_role='Aspirante'.

**Especificación del SP:**

```sql
CREATE OR ALTER PROCEDURE core.sp_insert_driver_from_landing
    -- Parámetros de entrada
    @firstName NVARCHAR(255),
    @middleName NVARCHAR(255),
    @paternalSurname NVARCHAR(255),
    @maternalSurname NVARCHAR(255),
    @phone VARCHAR(50),
    @email NVARCHAR(255),
    @vehicleMake NVARCHAR(30),
    @vehicleModel NVARCHAR(50),
    @vehicleYear VARCHAR(4),
    @vehiclePlates NVARCHAR(10),
    @vehicleColor NVARCHAR(30),
    @workStateId INT = NULL,
    @workStateName NVARCHAR(30),
    @workCityId INT = NULL,
    @workCityName NVARCHAR(50),
    @referalSource NVARCHAR(50),
    -- Parámetros de salida
    @result INT OUTPUT,              -- 1=success, 0=fail
    @driverId INT OUTPUT,            -- ID generado
    @errorCode NVARCHAR(50) OUTPUT,  -- Código de error
    @errorMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validación adicional de duplicidad (safety check)
        IF EXISTS (SELECT 1 FROM core.driver WHERE phone = @phone)
        BEGIN
            SET @result = 0;
            SET @errorCode = N'DUPLICATE_PHONE';
            SET @errorMessage = N'El teléfono ya está registrado';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        IF EXISTS (SELECT 1 FROM core.driver WHERE email = @email)
        BEGIN
            SET @result = 0;
            SET @errorCode = N'DUPLICATE_EMAIL';
            SET @errorMessage = N'El email ya está registrado';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- Inserción
        INSERT INTO core.driver (
            first_name, middle_name, paternal_surname, maternal_surname, phone, email,
            vehicle_make, vehicle_model, vehicle_year, vehicle_plates, vehicle_color,
            work_state_id, state_name, work_city_id, city_name,
            driver_status_id, driver_role, email_verified, phone_verified, profile_completed,
            registration_date, referal_source
        )
        VALUES (
            @firstName, @middleName, @paternalSurname, @maternalSurname, @phone, LOWER(@email),
            @vehicleMake, @vehicleModel, @vehicleYear, @vehiclePlates, @vehicleColor,
            @workStateId, @workStateName, @workCityId, @workCityName,
            1, 'Aspirante', 1, 1, 0,
            GETUTCDATE(), @referalSource
        );
        
        SET @driverId = SCOPE_IDENTITY();
        SET @result = 1;
        SET @errorCode = NULL;
        SET @errorMessage = NULL;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- Manejo de errores de constraint UNIQUE
        IF ERROR_NUMBER() IN (2601, 2627)
        BEGIN
            SET @result = 0;
            SET @errorCode = N'DUPLICATE_ENTRY';
            SET @errorMessage = N'El teléfono o email ya están registrados';
        END
        ELSE
        BEGIN
            SET @result = 0;
            SET @errorCode = N'DB_ERROR';
            SET @errorMessage = ERROR_MESSAGE();
        END;
    END CATCH;
END;
GO
```
        ELSE
        BEGIN
            SET @result = 0;
            SET @errorCode = 'DB_ERROR';
            SET @errorMessage = ERROR_MESSAGE();
        END
    END CATCH
END
```
```

**Lógica de operación** (Actualizar):
```markdown
El SP debe:
- Recibir parámetros mapeados desde payload del endpoint
- Validar duplicidad de phone y email antes de insertar
- Insertar registro en `core.driver` con:
  - driver_status_id = 1 (Pendiente de revisión)
  - driver_role = 'Aspirante'
  - email_verified = 1 (ya verificado en sesión)
  - phone_verified = 1 (ya verificado en sesión)
  - profile_completed = 0 (aún no completa perfil completo)
- Generar y retornar `driver_id` mediante `SCOPE_IDENTITY()`
- Retornar códigos de error específicos:
  - `DUPLICATE_PHONE`: Teléfono ya registrado
  - `DUPLICATE_EMAIL`: Email ya registrado
  - `DUPLICATE_ENTRY`: Violación de UNIQUE constraint
  - `DB_ERROR`: Error genérico de BD
- Manejo transaccional con ROLLBACK en caso de error
```

---

#### Task 198261 - [DB] Definir mapeo de datos para almacenamiento

**Información a agregar:**

**Lógica de operación** (Especificar mapeo exacto):
```markdown
Mapeo entre Payload → Parámetros SP → Columnas BD:

| Campo Payload       | Parámetro SP       | Columna BD         | Tipo          | Observaciones                    |
|---------------------|--------------------|--------------------|---------------|----------------------------------|
| firstName           | @firstName         | first_name         | varchar(255)  | Obligatorio (primer nombre)      |
| middleName          | @middleName        | middle_name        | varchar(255)  | Opcional (segundo nombre)        |
| paternalSurname     | @paternalSurname   | paternal_surname   | varchar(255)  | Obligatorio (apellido paterno)   |
| maternalSurname     | @maternalSurname   | maternal_surname   | varchar(255)  | Opcional (apellido materno)      |
| phoneNumber         | @phone             | phone              | varchar(50)   | Obligatorio, 10 dígitos          |
| email               | @email             | email              | varchar(255)  | Obligatorio, lowercase en BD     |
| vehicleBrand        | @vehicleMake       | vehicle_make       | nvarchar(30)  | Obligatorio                      |
| vehicleModel        | @vehicleModel      | vehicle_model      | nvarchar(50)  | Obligatorio                      |
| vehicleYear         | @vehicleYear       | vehicle_year       | varchar(4)    | Obligatorio, formato YYYY        |
| vehiclePlates       | @vehiclePlates     | vehicle_plates     | nvarchar(10)  | Obligatorio                      |
| vehicleColor        | @vehicleColor      | vehicle_color      | nvarchar(30)  | Obligatorio                      |
| workStateId         | @workStateId       | work_state_id      | int           | Opcional, si catálogo por ID     |
| workStateName       | @workStateName     | state_name         | nvarchar(30)  | Obligatorio                      |
| workCityId          | @workCityId        | work_city_id       | int           | Opcional, si catálogo por ID     |
| workCityName        | @workCityName      | city_name          | nvarchar(50)  | Obligatorio                      |
| N/A (sistema)       | N/A                | driver_status_id   | int           | Default 1 (Pendiente)            |
| N/A (sistema)       | N/A                | driver_role        | varchar(100)  | Default 'Aspirante'              |
| N/A (sistema)       | N/A                | email_verified     | bit           | Default 1 (verificado en sesión) |
| N/A (sistema)       | N/A                | phone_verified     | bit           | Default 1 (verificado en sesión) |
| N/A (sistema)       | N/A                | profile_completed  | bit           | Default 0 (aún no completo)     |
| N/A (sistema)       | N/A                | registration_date  | datetime2     | Default GETUTCDATE()             |

**Nota importante:**
- Los campos `phoneVerified` y `emailVerified` del payload NO se envían, pero se marcan como 1 (true) en BD
- La verificación se valida en `core.registration_session` antes de invocar el SP
- El driver_status_id = 1 (Pendiente) y driver_role = 'Aspirante' se asignan automáticamente
- Todo aspirante inicial es un driver con rol 'Aspirante' filtrable por vw_driver_applicant
```
```

---

### HU 198212 - Mensaje de Bienvenida

#### Task 198258 - [BACK] Implementar envío de email de bienvenida con plantillas parametrizables

**Objetivo funcional**:
Enviar automáticamente un correo de bienvenida al aspirante una vez que su registro haya sido guardado correctamente en el sistema, para informarle los próximos pasos de su proceso.

**Descripción técnica**:
Implementar caso de uso de envío de email de bienvenida que se invoca después de registrar exitosamente al driver con rol 'Aspirante' en `core.driver`.

**⚠️ IMPORTANTE - Arquitectura con Twilio SendGrid:**
- Plantilla se obtiene desde `core.email_template` (actualizable sin deploy)
- Renderizado con `IEmailTemplateService` (motor de tokens)
- Envío con `IEmailService` → Twilio SendGrid
- Logging automático con `ICommunicationLogService` → `core.communication_log`
- Ejecución asíncrona (NO bloquea respuesta al usuario)

**Lógica de operación**:
```csharp
// Interfaz del caso de uso
public interface IWelcomeEmailService
{
    Task<WelcomeEmailResult> SendWelcomeEmailAsync(long driverId);
}

// Implementación
public class WelcomeEmailService : IWelcomeEmailService
{
    private readonly IDriverRepository _driverRepo;
    private readonly IEmailTemplateService _templateService;  // Motor de plantillas
    private readonly IEmailService _emailService;             // Twilio SendGrid
    private readonly ILogger<WelcomeEmailService> _logger;
    
    public WelcomeEmailService(
        IDriverRepository driverRepo,
        IEmailTemplateService templateService,
        IEmailService emailService,
        ILogger<WelcomeEmailService> logger)
    {
        _driverRepo = driverRepo;
        _templateService = templateService;
        _emailService = emailService;
        _logger = logger;
    }
    
    public async Task<WelcomeEmailResult> SendWelcomeEmailAsync(long driverId)
    {
        try
        {
            // 1. Obtener datos del driver (aspirante)
            var driver = await _driverRepo.GetByIdAsync(driverId);
            if (driver == null)
            {
                _logger.LogError("Driver {DriverId} no encontrado para email de bienvenida", driverId);
                return WelcomeEmailResult.Failure("Driver no encontrado");
            }
            
            // 2. Renderizar plantilla desde BD con tokens
            var tokens = new Dictionary<string, string>
            {
                { "firstName", driver.FirstName }
            };
            
            var renderedEmail = await _templateService.RenderTemplateAsync("WELCOME_EMAIL", tokens);
            
            // 3. Enviar email via Twilio SendGrid (logging automático integrado)
            var sendResult = await _emailService.SendAsync(
                toEmail: driver.Email,
                subject: renderedEmail.Subject,
                bodyHtml: renderedEmail.BodyHtml,
                bodyPlain: renderedEmail.BodyPlain
            );
            
            // 4. Evaluar resultado
            if (!sendResult.Success)
            {
                _logger.LogWarning("Fallo envío email bienvenida a {Email}: {Error}", 
                    driver.Email, sendResult.ErrorMessage);
                return WelcomeEmailResult.Failure(sendResult.ErrorMessage);
            }
            
            _logger.LogInformation("Email de bienvenida enviado exitosamente a {Email} (Driver: {Id})", 
                driver.Email, driverId);
            
            return WelcomeEmailResult.Success(sendResult.MessageId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción enviando email de bienvenida a driver {DriverId}", driverId);
            return WelcomeEmailResult.Failure(ex.Message);
        }
    }
}

// DTO de resultado
public class WelcomeEmailResult
{
    public bool Success { get; set; }
    public string MessageId { get; set; }
    public string ErrorMessage { get; set; }
    
    public static WelcomeEmailResult Success(string messageId) => 
        new() { Success = true, MessageId = messageId };
    
    public static WelcomeEmailResult Failure(string error) => 
        new() { Success = false, ErrorMessage = error };
}

// Registro en DI (Program.cs)
services.AddScoped<IWelcomeEmailService, WelcomeEmailService>();
```

**Invocación desde endpoint de registro (Task 198249):**
```csharp
// En el endpoint POST /api/drivers/register, después de invocar SP exitosamente:
if (spResult.Success)
{
    // ✅ ENVIAR EMAIL DE BIENVENIDA (asíncrono, NO bloquea respuesta)
    _ = Task.Run(async () =>
    {
        try
        {
            await _welcomeEmailService.SendWelcomeEmailAsync(spResult.DriverId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enviando email de bienvenida async. DriverId: {Id}", spResult.DriverId);
            // NO propagar excepción (usuario ya recibió confirmación de registro)
        }
    });
    
    return Ok(new { 
        success = true, 
        driverId = spResult.DriverId,
        message = "¡Registro exitoso! Recibirás un email de bienvenida en breve con los próximos pasos."
    });
}
```

**Validaciones**:
```markdown
- El proceso de envío se ejecuta SOLO después de confirmar el guardado exitoso del registro en BD
- Email se envía de forma ASÍNCRONA (Task.Run) para NO bloquear respuesta al usuario
- Se utiliza correctamente el correo electrónico del driver como destinatario
- El contenido corresponde al mensaje de bienvenida definido en plantilla "WELCOME_EMAIL"
- El sistema puede identificar correctamente éxito o fallo del envío
- No se intenta enviar correo en registros fallidos o no confirmados
- Plantilla "WELCOME_EMAIL" debe existir en `core.email_template` con `active = true`
- Token `{{firstName}}` se reemplaza correctamente con nombre del driver
- Todos los intentos (éxito/fallo) se registran automáticamente en `core.communication_log` por `IEmailService`
- Errores de envío se loggean pero NO se exponen al usuario (ya recibió confirmación de registro)
- Si plantilla no existe, se loggea error crítico
```

**Dependencias**:
```markdown
**Tareas base de email (OBLIGATORIAS):**
- [DB] Persistir catálogo de plantillas de correo electrónico
- [BACK] Implementar motor de plantillas parametrizables para correo electrónico
- [BACK] Implementar servicio reusable de envío de correos electrónicos (Twilio SendGrid)
- [BACK] Registrar trazabilidad de envío de correos electrónicos

**Específicas de esta tarea:**
- Task 198252: SP `core.sp_insert_driver_from_landing` debe retornar `driver_id`
- Task 198249: Endpoint de registro debe invocar este servicio después de insertar
- Plantilla "WELCOME_EMAIL" debe estar creada en `core.email_template` con tokens documentados
- NuGet: SendGrid (>= 9.28.0) ya instalado
- Configuración Twilio SendGrid en appsettings.json ya configurada
- Servicio IDriverRepository registrado en DI
```

**Consideraciones adicionales**:
```markdown
**Ventajas de la arquitectura Twilio SendGrid:**
- Plantilla puede actualizarse en BD sin necesidad de deploy
- Logging automático integrado en `IEmailService` (no requiere implementación manual)
- Servicio está desacoplado: cambiar proveedor solo requiere cambiar implementación de `IEmailService`
- Tracking con MessageId de SendGrid para correlación
- Dashboard de Twilio/SendGrid para monitoreo de deliverability

**Flujo completo de integración:**
1. Usuario completa registro → Endpoint valida sesión verificada
2. SP inserta en `core.driver` con driver_role='Aspirante' → Retorna `driver_id`
3. Endpoint marca sesión como completada
4. Endpoint invoca `SendWelcomeEmailAsync(driverId)` de forma asíncrona
5. `IEmailTemplateService` obtiene plantilla "WELCOME_EMAIL" desde BD (con cache 1h)
6. `IEmailTemplateService` renderiza tokens: `{{firstName}}` → "Juan"
7. `IEmailService` envía via Twilio SendGrid
8. `IEmailService` loggea automáticamente en `core.communication_log` (éxito/fallo)
9. Usuario recibe email con información de próximos pasos

**Contenido sugerido de plantilla "WELCOME_EMAIL":**
- Saludo personalizado: "¡Hola {{firstName}}!"
- Confirmación de registro exitoso
- Próximos pasos: "Revisaremos tu información en 24-48 horas"
- Tiempo estimado: "Proceso completo: 5-7 días hábiles"
- Contacto de soporte: email y WhatsApp
- Footer con branding SPIDI
```

---

#### Task 198260 - [BACK] Implementar persistencia de bitácora de error de envío

**⚠️ NOTA:** Esta tarea fue ABSORBIDA por Task 198258. El logging ahora es parte integral del servicio de envío de email. Mantener esta tarea solo si se requiere servicio de logging independiente para otros casos de uso.

**Información a agregar:**

**Descripción técnica** (Especificar uso de tabla):
```markdown
Implementar en backend la invocación del mecanismo de base de datos para guardar bitácora de intentos de envío de email (exitosos y fallidos).

**Tabla a utilizar:** `core.communication_log` (ver tarea nueva de creación de tabla)
```

**Lógica de operación** (Ampliar):
```markdown
Cuando se intenta enviar email de bienvenida, el backend debe registrar:

**Para intentos EXITOSOS:**
```csharp
await _emailLogService.LogEmail(new EmailLogEntry {
    RecipientEmail = driver.Email,
    EmailType = "WELCOME",
    Subject = emailSubject,
    BodyPreview = emailBody.Substring(0, Math.Min(500, emailBody.Length)),
    Status = "SENT",
    DriverId = driver.Id,
    SentAt = DateTime.UtcNow
});
```

**Para intentos FALLIDOS:**
```csharp
await _emailLogService.LogEmail(new EmailLogEntry {
    RecipientEmail = driver.Email,
    EmailType = "WELCOME",
    Subject = emailSubject,
    BodyPreview = emailBody.Substring(0, Math.Min(500, emailBody.Length)),
    Status = "FAILED",
    ErrorMessage = exception.Message,
    RetryCount = retryAttempt,
    DriverId = driver.Id,
    SentAt = DateTime.UtcNow
});
```

**Para REINTENTOS:**
- Incrementar `retry_count` en el registro existente
- Actualizar `status` a "RETRY" durante reintento
- Actualizar `status` a "SENT" o "FAILED" según resultado final
```

---

---

## TAREAS NUEVAS A CREAR

### HU 198189 - Registro Inicial con Datos Básicos

#### [DB] Crear tabla de estados y ciudades (SOLO SI Cart Services no disponible)

**⚠️ NOTA IMPORTANTE**: Esta tarea es un **PLAN B** alternativo. La solución primaria y recomendada es usar endpoints transformadores desde Cart Services. Solo ejecutar esta tarea si Cart Services NO está disponible en ambiente productivo o si arquitectura decide por catálogo local.

**Objetivo funcional**:
Proveer catálogo local de estados y ciudades como alternativa si Cart Services no puede usarse como fuente de datos.

**Descripción técnica**:
Crear tablas para almacenar catálogo geográfico de ubicaciones de operación SPIDI como snapshot estático.

**Lógica de operación**:
```sql
-- Tabla de estados
CREATE TABLE core.state (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,    -- Código INEGI o custom
    name NVARCHAR(50) NOT NULL,          -- "Nuevo León"
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ciudades
CREATE TABLE core.city (
    id BIGSERIAL PRIMARY KEY,
    state_id BIGINT NOT NULL REFERENCES core.state(id) ON DELETE CASCADE,
    code VARCHAR(10) UNIQUE NOT NULL,    -- Código INEGI o custom
    name NVARCHAR(100) NOT NULL,         -- "Monterrey"
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX ix_city_state ON core.city(state_id);
CREATE INDEX ix_state_active ON core.state(active);
CREATE INDEX ix_city_active ON core.city(active);

-- Datos iniciales de ejemplo (expandir según catálogo real)
INSERT INTO core.state (id, code, name) VALUES
(19, 'NL', 'Nuevo León'),
(22, 'QRO', 'Querétaro'),
-- ... agregar todos los estados con presencia HEB/Mi Tienda
;

INSERT INTO core.city (id, state_id, code, name) VALUES
(19001, 19, 'MTY', 'Monterrey'),
(19002, 19, 'SPN', 'San Pedro Garza García'),
(22001, 22, 'QRO', 'Querétaro'),
-- ... agregar todas las ciudades
;
```

**Dependencias**:
- Catálogo oficial de estados/ciudades con operación HEB/Mi Tienda
- Decisión arquitectónica sobre uso de catálogo local vs. endpoint transformador

**Validaciones**:
- Estados tienen códigos únicos
- Ciudades están correctamente relacionadas con estados
- Solo ubicaciones activas se muestran en formulario
- Catálogo se mantiene sincronizado con tiendas operativas

---

#### [DB] Crear modelo normalizado de direcciones (state, city, neighborhood, zip_code, address, address_type)

**Objetivo funcional**:
Proveer modelo de datos normalizado (3NF) para almacenamiento de direcciones de aspirantes y drivers, eliminando duplicación de datos geográficos.

**Descripción técnica**:
Crear tablas normalizadas para gestión de direcciones siguiendo jerarquía: estado → ciudad → colonia → código postal → dirección.

**Lógica de operación**:
```sql
-- ========================================
-- 1. TABLA DE ESTADOS
-- ========================================
CREATE TABLE core.state (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,           -- 'NL', 'QRO', 'CDMX'
    name NVARCHAR(50) NOT NULL,                 -- 'Nuevo León', 'Querétaro'
    active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE INDEX ix_state_code ON core.state(code);
GO
CREATE INDEX ix_state_active ON core.state(active);
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', @value = N'Catálogo de estados de la República Mexicana',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'state';
GO

-- ========================================
-- 2. TABLA DE CIUDADES
-- ========================================
CREATE TABLE core.city (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    state_id BIGINT NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,           -- 'MTY', 'QRO', 'CDMX'
    name NVARCHAR(100) NOT NULL,                -- 'Monterrey', 'Querétaro'
    active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_city_state FOREIGN KEY (state_id) REFERENCES core.state(id) ON DELETE CASCADE
);
GO

CREATE INDEX ix_city_state ON core.city(state_id);
GO
CREATE INDEX ix_city_code ON core.city(code);
GO
CREATE INDEX ix_city_active ON core.city(active);
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', @value = N'Catálogo de ciudades por estado',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'city';
GO

-- ========================================
-- 3. TABLA DE COLONIAS
-- ========================================
CREATE TABLE core.neighborhood (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    city_id BIGINT NOT NULL,
    name NVARCHAR(100) NOT NULL,                -- 'Centro', 'Del Valle', 'Contry'
    active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_neighborhood_city FOREIGN KEY (city_id) REFERENCES core.city(id) ON DELETE CASCADE
);
GO

CREATE INDEX ix_neighborhood_city ON core.neighborhood(city_id);
GO
CREATE INDEX ix_neighborhood_active ON core.neighborhood(active);
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', @value = N'Catálogo de colonias por ciudad',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'neighborhood';
GO

-- ========================================
-- 4. TABLA DE CÓDIGOS POSTALES
-- ========================================
CREATE TABLE core.zip_code (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    neighborhood_id BIGINT NOT NULL,
    code VARCHAR(5) UNIQUE NOT NULL,            -- '64000', '76000'
    active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_zip_code_neighborhood FOREIGN KEY (neighborhood_id) REFERENCES core.neighborhood(id) ON DELETE CASCADE
);
GO

CREATE INDEX ix_zip_code_neighborhood ON core.zip_code(neighborhood_id);
GO
CREATE INDEX ix_zip_code_code ON core.zip_code(code);
GO
CREATE INDEX ix_zip_code_active ON core.zip_code(active);
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', @value = N'Catálogo de códigos postales por colonia',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'zip_code';
GO

-- ========================================
-- 5. TABLA DE DIRECCIONES
-- ========================================
CREATE TABLE core.address (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    zip_code_id BIGINT NOT NULL,
    street NVARCHAR(100) NOT NULL,              -- 'Av. Constitución', 'Calle Juárez'
    ext_number NVARCHAR(10) NOT NULL,           -- '123', 'S/N'
    int_number NVARCHAR(20),                    -- '4B', 'Depto 301' (opcional)
    reference_notes NVARCHAR(255),              -- 'Frente a parque', 'Edificio azul'
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_address_zip_code FOREIGN KEY (zip_code_id) REFERENCES core.zip_code(id)
);
GO

CREATE INDEX ix_address_zip_code ON core.address(zip_code_id);
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', @value = N'Direcciones normalizadas (calle, número, referencias)',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'address';
GO

-- ========================================
-- 6. TABLA DE TIPOS DE DIRECCIÓN
-- ========================================
CREATE TABLE core.address_type (
    id SMALLINT IDENTITY(1,1) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,           -- 'PERSONAL', 'FISCAL'
    name NVARCHAR(50) NOT NULL,                 -- 'Dirección Personal', 'Dirección Fiscal'
    description NVARCHAR(255),
    active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE INDEX ix_address_type_code ON core.address_type(code);
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', @value = N'Catálogo de tipos de dirección (PERSONAL, FISCAL)',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'address_type';
GO

-- Datos iniciales de tipos de dirección
INSERT INTO core.address_type (code, name, description) VALUES
('PERSONAL', N'Dirección Personal', N'Domicilio de residencia del aspirante/driver'),
('FISCAL', N'Dirección Fiscal', N'Domicilio fiscal para emisión de facturas y trámites fiscales');
GO
```

**Dependencias**:
- Esquema `core` debe existir en la base de datos
- Catálogo geográfico completo (puede poblarse desde Sepomex o fuente HEB)

**Validaciones**:
- Modelo normalizado garantiza consistencia de datos geográficos (3NF)
- Foreign keys previenen datos huérfanos (CASCADE en algunos casos)
- Códigos postales son únicos en todo el sistema
- Solo ubicaciones activas se muestran en formularios
- Índices optimizan búsquedas jerárquicas (estado → ciudad → colonia → CP)

**Consideraciones técnicas**:
- **Ventaja sobre modelo denormalizado**: Evita duplicación de "Nuevo León", "Monterrey", etc.
- **Reportes fáciles**: `SELECT COUNT(*) FROM driver d JOIN driver_address da ... JOIN city c WHERE c.name = 'Monterrey'`
- **Validación centralizada**: Solo se pueden seleccionar colonias/CPs que existen en catálogo
- **Extensibilidad**: Agregar nueva ciudad no requiere cambio de esquema, solo INSERT en catálogo
- **Mantenimiento**: Correcciones de nombres (ej: "Mty" → "Monterrey") se hace 1 vez en catálogo
- **IMPORTANTE**: Este modelo reemplaza los campos denormalizados (personal_street, fiscal_city, etc.) en `applicant_profile` y `driver`

**Población de catálogo**:
```sql
-- Ejemplo de población (expandir según cobertura SPIDI)
INSERT INTO core.state (id, code, name) VALUES 
(19, 'NL', N'Nuevo León'),
(22, 'QRO', N'Querétaro');

INSERT INTO core.city (id, state_id, code, name) VALUES
(19001, 19, 'MTY', N'Monterrey'),
(19002, 19, 'SPN', N'San Pedro Garza García');

INSERT INTO core.neighborhood (id, city_id, name) VALUES
(1900101, 19001, N'Centro'),
(1900102, 19001, N'Del Valle');

INSERT INTO core.zip_code (id, neighborhood_id, code) VALUES
(190010101, 1900101, '64000'),
(190010201, 1900102, '64670');
```

---

#### [DB] Crear tabla applicant_address (relación aspirantes → direcciones)

**Objetivo funcional**:
Establecer relaciónMany-to-One entre aspirantes y direcciones normalizadas, permitiendo que un aspirante tenga dirección personal y fiscal.

**Descripción técnica**:
Tabla de unión que relaciona aspirantes con sus direcciones (personal y fiscal) usando el modelo normalizado.

**Lógica de operación**:
```sql
CREATE TABLE core.applicant_address (
    applicant_id BIGINT NOT NULL,
    address_id BIGINT NOT NULL,
    address_type_id SMALLINT NOT NULL,
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    
    -- PK compuesta: Un aspirante solo puede tener 1 dirección de cada tipo
    CONSTRAINT PK_applicant_address PRIMARY KEY (applicant_id, address_type_id),
    
    -- Foreign Keys
    CONSTRAINT FK_applicant_address_applicant 
        FOREIGN KEY (applicant_id) 
        REFERENCES core.applicant(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT FK_applicant_address_address 
        FOREIGN KEY (address_id) 
        REFERENCES core.address(id),
    
    CONSTRAINT FK_applicant_address_type 
        FOREIGN KEY (address_type_id) 
        REFERENCES core.address_type(id)
);
GO

-- Índices
CREATE INDEX ix_applicant_address_applicant ON core.applicant_address(applicant_id);
GO
CREATE INDEX ix_applicant_address_address ON core.applicant_address(address_id);
GO
CREATE INDEX ix_applicant_address_type ON core.applicant_address(address_type_id);
GO

-- Documentación
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Relación Many-to-One entre aspirantes y direcciones (personal, fiscal)',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'applicant_address';
GO
```

**Dependencias**:
- Tabla `core.applicant` debe existir
- Tabla `core.address` del modelo normalizado debe existir
- Tabla `core.address_type` con tipos PERSONAL y FISCAL debe existir

**Validaciones**:
- PK compuesta `(applicant_id, address_type_id)` garantiza que un aspirante solo tiene 1 dirección de cada tipo
- ON DELETE CASCADE: Al eliminar aspirante, se eliminan sus relaciones de dirección
- Un aspirante DEBE tener dirección personal Y fiscal para completar perfil

**Consideraciones técnicas**:
- Esta tabla reemplaza los campos denormalizados en `applicant_profile`:
  - ❌ `personal_street`, `personal_city`, `personal_state`, `personal_zip`
  - ❌ `fiscal_street`, `fiscal_city`, `fiscal_state`, `fiscal_zip`
- Los datos de dirección ahora se obtienen con JOIN:
  ```sql
  -- Obtener dirección personal del aspirante
  SELECT a.street, a.ext_number, a.int_number, z.code, n.name as colonia, c.name as ciudad, s.name as estado
  FROM core.applicant_address aa
  INNER JOIN core.address a ON aa.address_id = a.id
  INNER JOIN core.zip_code z ON a.zip_code_id = z.id
  INNER JOIN core.neighborhood n ON z.neighborhood_id = n.id
  INNER JOIN core.city c ON n.city_id = c.id
  INNER JOIN core.state s ON c.state_id = s.id
  INNER JOIN core.address_type at ON aa.address_type_id = at.id
  WHERE aa.applicant_id = @applicant_id AND at.code = 'PERSONAL';
  ```
- Al convertir aspirante → driver, se copian estas relaciones a `driver_address`

---

#### [DB] Crear tabla driver_address (relación drivers → direcciones)

**Objetivo funcional**:
Establecer relación Many-to-One entre drivers y direcciones normalizadas, copiando las direcciones del aspirante al momento de la conversión.

**Descripción técnica**:
Tabla de unión que relaciona drivers con sus direcciones (personal y fiscal) usando el modelo normalizado.

**Lógica de operación**:
```sql
CREATE TABLE core.driver_address (
    driver_id BIGINT NOT NULL,
    address_id BIGINT NOT NULL,
    address_type_id SMALLINT NOT NULL,
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    
    -- PK compuesta: Un driver solo puede tener 1 dirección de cada tipo
    CONSTRAINT PK_driver_address PRIMARY KEY (driver_id, address_type_id),
    
    -- Foreign Keys
    CONSTRAINT FK_driver_address_driver 
        FOREIGN KEY (driver_id) 
        REFERENCES core.driver(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT FK_driver_address_address 
        FOREIGN KEY (address_id) 
        REFERENCES core.address(id),
    
    CONSTRAINT FK_driver_address_type 
        FOREIGN KEY (address_type_id) 
        REFERENCES core.address_type(id)
);
GO

-- Índices
CREATE INDEX ix_driver_address_driver ON core.driver_address(driver_id);
GO
CREATE INDEX ix_driver_address_address ON core.driver_address(address_id);
GO
CREATE INDEX ix_driver_address_type ON core.driver_address(address_type_id);
GO

-- Documentación
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Relación Many-to-One entre drivers y direcciones (personal, fiscal)',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'driver_address';
GO
```

**Dependencias**:
- Tabla `core.driver` debe existir
- Tabla `core.address` del modelo normalizado debe existir
- Tabla `core.address_type` con tipos PERSONAL y FISCAL debe existir

**Validaciones**:
- PK compuesta `(driver_id, address_type_id)` garantiza que un driver solo tiene 1 dirección de cada tipo
- ON DELETE CASCADE: Al eliminar driver, se eliminan sus relaciones de dirección
- Las direcciones se COPIAN desde `applicant_address`, no se mueven (para preservar historial)

**Consideraciones técnicas**:
- Esta tabla reemplaza los campos denormalizados en `driver`:
  - ❌ `personal_street`, `personal_city`, `personal_state`, `personal_zip`
  - ❌ `fiscal_street`, `fiscal_city`, `fiscal_state`, `fiscal_zip`
- El SP `sp_convert_applicant_to_driver` copia las relaciones:
  ```sql
  -- Copiar direcciones del aspirante al driver
  INSERT INTO core.driver_address (driver_id, address_id, address_type_id)
  SELECT @p_driver_id, address_id, address_type_id
  FROM core.applicant_address
  WHERE applicant_id = @p_applicant_id;
  ```
- Los datos de dirección se obtienen con JOIN (misma consulta que aspirantes)
- **IMPORTANTE**: Las direcciones se COMPARTEN entre aspirante y driver (mismo `address_id`)
- Si se requiere modificar dirección del driver sin afectar historial del aspirante, crear nueva fila en `core.address`

---

#### [DB] Crear tabla core.applicant

**Objetivo funcional**:
Almacenar información básica de aspirantes registrados a través del landing público de reclutamiento.

**Descripción técnica**:
Crear tabla para persistir datos capturados en el formulario de registro inicial (HU 198189) y flujo de verificación OTP.

**Lógica de operación**:
```sql
-- Tabla de aspirantes (landing público) - SQL Server
CREATE TABLE core.applicant (
    -- Identificación
    id                     BIGINT IDENTITY(1,1) PRIMARY KEY,
    
    -- Datos personales (estructura mexicana)
    first_name             NVARCHAR(100) NOT NULL,   -- Primer nombre
    middle_name            NVARCHAR(100),             -- Segundo nombre (opcional)
    paternal_surname       NVARCHAR(100) NOT NULL,   -- Apellido paterno
    maternal_surname       NVARCHAR(100),             -- Apellido materno (opcional)
    phone                  VARCHAR(10) NOT NULL,
    email                  NVARCHAR(255) NOT NULL,
    
    -- Ubicación de trabajo preferida
    work_state_id          BIGINT,                        -- Opcional: ID del catálogo de estados
    state                  NVARCHAR(30) NOT NULL,          -- Nombre del estado (obligatorio)
    work_city_id           BIGINT,                        -- Opcional: ID del catálogo de ciudades
    city                   NVARCHAR(50) NOT NULL,          -- Nombre de la ciudad (obligatorio)
    
    -- Datos del vehículo
    vehicle_make           NVARCHAR(30),                   -- Marca
    vehicle_model          NVARCHAR(50),                   -- Modelo
    vehicle_year           VARCHAR(4),                    -- Año (formato YYYY)
    vehicle_plates         NVARCHAR(10),                   -- Placas
    vehicle_color          NVARCHAR(30),                   -- Color
    
    -- Estado del aspirante
    status                 NVARCHAR(30) NOT NULL DEFAULT 'Pendiente',  -- RN06: Pendiente, Aprobado, Rechazado, etc.
    referral_source        NVARCHAR(50),  -- ¿Cómo te enteraste? (Facebook, Recomendación, Google, Volante, etc.)
    -- Auditoría
    created_at             DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at             DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Índices para búsquedas frecuentes
CREATE UNIQUE INDEX ux_applicant_phone ON core.applicant(phone);
GO
CREATE UNIQUE INDEX ux_applicant_email ON core.applicant(email);
GO
CREATE INDEX ix_applicant_status ON core.applicant(status);
GO
CREATE INDEX ix_applicant_created_at ON core.applicant(created_at DESC);
GO

-- Documentación (SQL Server Extended Properties)
EXEC sp_addextendedproperty 
    @name = N'MS_Description', @value = N'Aspirantes registrados a través del landing de reclutamiento',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'applicant';
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', @value = N'Teléfono de 10 dígitos (sin +52), único',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'applicant',
    @level2type = N'COLUMN', @level2name = N'phone';
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', @value = N'Email del aspirante, único (case-insensitive)',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'applicant',
    @level2type = N'COLUMN', @level2name = N'email';
GO
```

**Estructura de datos:**

| Columna          | Tipo          | Obligatorio | Descripción                                    |
|------------------|---------------|-------------|------------------------------------------------|
| id               | bigserial     | Sí (PK)     | Identificador único autogenerado               |
| first_name       | varchar(100)  | Sí          | Primer nombre del aspirante                    |
| middle_name      | varchar(100)  | No          | Segundo nombre del aspirante (opcional)        |
| paternal_surname | varchar(100)  | Sí          | Apellido paterno del aspirante                 |
| maternal_surname | varchar(100)  | No          | Apellido materno del aspirante (opcional)      |
| phone            | varchar(10)   | Sí (Unique) | Teléfono móvil (10 dígitos)                    |
| email            | varchar(255)  | Sí (Unique) | Correo electrónico (case-insensitive)          |
| work_state_id    | bigint        | No          | FK opcional a catálogo de estados              |
| state            | varchar(30)   | Sí          | Nombre del estado de trabajo preferido         |
| work_city_id     | bigint        | No          | FK opcional a catálogo de ciudades             |
| city             | varchar(50)   | Sí          | Nombre de la ciudad de trabajo preferida       |
| vehicle_make     | varchar(30)   | No          | Marca del vehículo                             |
| vehicle_model    | varchar(50)   | No          | Modelo del vehículo                            |
| vehicle_year     | varchar(4)    | No          | Año del vehículo (YYYY)                        |
| vehicle_plates   | varchar(10)   | No          | Placas del vehículo                            |
| vehicle_color    | varchar(30)   | No          | Color del vehículo                             |
| status           | varchar(30)   | Sí          | Estado del proceso (default: 'Pendiente')      |
| created_at       | timestamptz   | Sí          | Fecha de creación del registro                 |
| updated_at       | timestamptz   | Sí          | Última fecha de actualización                  |
| referral_source  | varchar(50)   | Si          | Como te enteraste de spidi?                    |

**Dependencias**:
- Esquema `core` debe existir en la base de datos
- Opcionalmente: Tablas `core.state` y `core.city` si se usan FKs (Plan B si Cart Services no disponible)

**Validaciones**:
- Constraint UNIQUE en `phone` previene duplicados de teléfono
- Constraint UNIQUE en `LOWER(email)` previene duplicados de email (case-insensitive)
- Estado default 'Pendiente' se asigna automáticamente en nuevos registros
- Índices en phone y email optimizan validación de duplicidad
- Índice en status optimiza consultas por estado del proceso
- Timestamps se actualizan automáticamente al crear (created_at, updated_at)

**Consideraciones técnicas**:
- **IMPORTANTE**: Esta tabla es la PRIMERA dependencia de todas las tareas del Feature 195500
- El endpoint de prevalidación de duplicidad consulta esta tabla
- El Stored Procedure `core.sp_insert_applicant` inserta en esta tabla
- Si se usa catálogo local de ubicaciones, work_state_id/work_city_id serán FKs
- Si se usa transformación desde Cart Services, work_state_id/work_city_id serán NULL (solo se usan nombres)
- Email se almacena en minúsculas mediante constraint UNIQUE LOWER(email)
- Teléfono se almacena sin prefijo +52 (solo 10 dígitos)
- **DOCUMENTOS**: Los documentos cargados en app móvil se relacionan con `applicant_id`, NO con driver_id
- **DRIVER**: Al firmar contrato, se crea registro en `core.driver` con FK `source_applicant_id` apuntando a este aspirante
- **TRAZABILIDAD**: Un driver siempre mantiene referencia a su aspirante original vía `source_applicant_id`

---

#### [DB] Crear tabla core.applicant_profile (Perfil extendido para app móvil)

**Objetivo funcional**:
Almacenar información adicional del aspirante capturada en la aplicación móvil (paso 2 del flujo), incluyendo datos fiscales, bancarios y domicilio completo.

**Descripción técnica**:
Crear tabla de perfil extendido que complementa los datos básicos de `core.applicant` con información detallada necesaria para crear el driver.

**Lógica de operación**:
```sql
-- Perfil extendido del aspirante (app móvil) - SQL Server
-- MODELO NORMALIZADO: Los datos de dirección NO están aquí, están en core.applicant_address
CREATE TABLE core.applicant_profile (
    id                     BIGINT IDENTITY(1,1) PRIMARY KEY,
    applicant_id           BIGINT NOT NULL,
    
    -- Identidad extendida
    nationality            NVARCHAR(80),
    birth_date             DATE,
    gender                 NVARCHAR(20),
    
    -- Datos fiscales (extraídos de CSF vía OCR)
    rfc                    VARCHAR(13),
    fiscal_regime          NVARCHAR(120),
    
    -- Datos bancarios (extraídos de carátula CLABE vía OCR)
    bank_name              NVARCHAR(80),
    bank_clabe             VARCHAR(18),
    
    -- Control de completitud
    profile_completed      BIT NOT NULL DEFAULT 0,
    completed_at           DATETIME2(7),
    
    -- Auditoría
    created_at             DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at             DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT uq_applicant_profile UNIQUE (applicant_id),
    CONSTRAINT FK_applicant_profile_applicant 
        FOREIGN KEY (applicant_id) 
        REFERENCES core.applicant(id) 
        ON DELETE CASCADE
);
GO

-- Índices
CREATE INDEX ix_applicant_profile_applicant ON core.applicant_profile(applicant_id);
GO
CREATE INDEX ix_applicant_profile_rfc ON core.applicant_profile(rfc);
GO
CREATE INDEX ix_applicant_profile_completed ON core.applicant_profile(profile_completed);
GO

-- Documentación
EXEC sp_addextendedproperty 
    @name = N'MS_Description', @value = N'Perfil extendido de aspirantes capturado en app móvil',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'applicant_profile';
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', @value = N'FK al aspirante original (1:1)',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'applicant_profile',
    @level2type = N'COLUMN', @level2name = N'applicant_id';
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', @value = N'RFC extraído de CSF mediante OCR',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'applicant_profile',
    @level2type = N'COLUMN', @level2name = N'rfc';
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', @value = N'CLABE extraída de carátula bancaria mediante OCR',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'applicant_profile',
    @level2type = N'COLUMN', @level2name = N'bank_clabe';
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', @value = N'Flag que indica si el perfil está completo para conversión a driver',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'applicant_profile',
    @level2type = N'COLUMN', @level2name = N'profile_completed';
GO
```

**Estructura de datos:**

| Columna               | Tipo          | Obligatorio | Descripción                                         |
|-----------------------|---------------|-------------|-----------------------------------------------------|
| id                    | bigserial     | Sí (PK)     | Identificador único autogenerado                    |
| applicant_id          | bigint        | Sí (FK)     | Referencia al aspirante (relación 1:1)              |
| nationality           | varchar(80)   | No          | Nacionalidad                                        |
| birth_date            | date          | No          | Fecha de nacimiento                                 |
| gender                | varchar(20)   | No          | Género                                              |
| rfc                   | varchar(13)   | No          | RFC extraído de CSF                                 |
| fiscal_regime         | varchar(120)  | No          | Régimen fiscal                                      |
| bank_name             | varchar(80)   | No          | Nombre del banco                                    |
| bank_clabe            | varchar(18)   | No          | CLABE interbancaria                                 |
| profile_completed     | boolean       | Sí          | Flag de completitud del perfil                      |
| completed_at          | timestamptz   | No          | Fecha en que se completó el perfil                  |
| created_at            | timestamptz   | Sí          | Fecha de creación del perfil                        |
| updated_at            | timestamptz   | Sí          | Última fecha de actualización                       |

**IMPORTANTE - Modelo Normalizado:**
- ❌ **NO** contiene campos de dirección (personal_street, fiscal_city, etc.)
- ✅ Las direcciones se almacenan en modelo normalizado: `core.applicant_address` → `core.address` → `core.zip_code` → `core.neighborhood` → `core.city` → `core.state`
- ✅ Para obtener dirección personal: `JOIN core.applicant_address WHERE address_type_id = 'PERSONAL'`
- ✅ Para obtener dirección fiscal: `JOIN core.applicant_address WHERE address_type_id = 'FISCAL'`

**Dependencias**:
- Tabla `core.applicant` debe existir
- Esquema `core` debe existir en la base de datos

**Validaciones**:
- Constraint UNIQUE en `applicant_id` garantiza relación 1:1 con aspirante
- Un aspirante solo puede tener un perfil extendido
- Flag `profile_completed` se marca `true` cuando todos los datos necesarios están capturados
- Índice en `rfc` optimiza búsquedas fiscales
- Índice en `profile_completed` optimiza consultas de aspirantes listos para enviar propuesta de trabajo

**Consideraciones técnicas**:
- **IMPORTANTE**: Esta tabla se crea en PASO 2 (app móvil), NO en landing
- **MODELO NORMALIZADO**: NO contiene campos de dirección (están en `core.applicant_address`)
- Datos fiscales (RFC, régimen) provienen de OCR de documento CSF (Constancia de Situación Fiscal)
- Datos bancarios provienen de OCR de carátula CLABE
- La conversión a `core.driver` requiere:
  - `profile_completed = true`
  - Dirección personal registrada en `core.applicant_address`
  - Dirección fiscal registrada en `core.applicant_address`
- Al crear driver se copian:
  - Datos de `core.applicant` (nombre, teléfono, email, vehículo)
  - Datos de `core.applicant_profile` (nacionalidad, fecha nacimiento, género, RFC, régimen fiscal, banco, CLABE)
  - Relaciones de direcciones desde `core.applicant_address` a `core.driver_address`
- **DOCUMENTOS**: Los documentos (CSF, CLABE, INE, etc.) se relacionan con `applicant_id`, NO con esta tabla
- Driver mantiene FK `source_applicant_id` para acceder a documentos originales y direcciones originales

---

#### [DB] Crear Stored Procedure para convertir aspirante a driver

**Objetivo funcional**:
Proveer mecanismo transaccional para convertir un aspirante en driver al firmar contrato, consolidando datos de `core.applicant` y `core.applicant_profile`.

**Descripción técnica**:
Crear Stored Procedure que valide completitud del perfil y cree registro en `core.driver` con todos los datos del aspirante.

**Lógica de operación**:
```sql
-- SQL Server Stored Procedure (MODELO NORMALIZADO)
CREATE OR ALTER PROCEDURE core.sp_convert_applicant_to_driver
    @p_applicant_id BIGINT,
    @p_driver_id BIGINT OUTPUT,
    @p_result INT OUTPUT,
    @p_error_message NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_first_name NVARCHAR(100), @v_middle_name NVARCHAR(100), 
            @v_paternal_surname NVARCHAR(100), @v_maternal_surname NVARCHAR(100),
            @v_phone VARCHAR(10), @v_email NVARCHAR(255),
            @v_vehicle_make NVARCHAR(30), @v_vehicle_model NVARCHAR(50),
            @v_vehicle_year VARCHAR(4), @v_vehicle_plates NVARCHAR(10), @v_vehicle_color NVARCHAR(30);
            
    DECLARE @v_nationality NVARCHAR(80), @v_birth_date DATE, @v_gender NVARCHAR(20),
            @v_rfc VARCHAR(13), @v_fiscal_regime NVARCHAR(120),
            @v_bank_name NVARCHAR(80), @v_bank_clabe VARCHAR(18),
            @v_profile_completed BIT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que aspirante existe
        SELECT 
            @v_first_name = first_name, 
            @v_middle_name = middle_name,
            @v_paternal_surname = paternal_surname,
            @v_maternal_surname = maternal_surname,
            @v_phone = phone, 
            @v_email = email,
            @v_vehicle_make = vehicle_make,
            @v_vehicle_model = vehicle_model,
            @v_vehicle_year = vehicle_year,
            @v_vehicle_plates = vehicle_plates,
            @v_vehicle_color = vehicle_color
        FROM core.applicant 
        WHERE id = @p_applicant_id;
        
        IF @@ROWCOUNT = 0
        BEGIN
            SET @p_result = 0;
            SET @p_error_message = N'Aspirante no encontrado';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- Validar que perfil está completo
        SELECT 
            @v_nationality = nationality,
            @v_birth_date = birth_date,
            @v_gender = gender,
            @v_rfc = rfc,
            @v_fiscal_regime = fiscal_regime,
            @v_bank_name = bank_name,
            @v_bank_clabe = bank_clabe,
            @v_profile_completed = profile_completed
        FROM core.applicant_profile 
        WHERE applicant_id = @p_applicant_id 
          AND profile_completed = 1;
        
        IF @@ROWCOUNT = 0
        BEGIN
            SET @p_result = 0;
            SET @p_error_message = N'Perfil del aspirante incompleto. Debe completar app móvil.';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- Validar que no existe driver ya creado para este aspirante
        IF EXISTS (SELECT 1 FROM core.driver WHERE source_applicant_id = @p_applicant_id)
        BEGIN
            SET @p_result = 0;
            SET @p_error_message = N'Ya existe un driver para este aspirante';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- Validar que el aspirante tiene direcciones personal y fiscal
        IF NOT EXISTS (
            SELECT 1 
            FROM core.applicant_address aa
            INNER JOIN core.address_type at ON aa.address_type_id = at.id
            WHERE aa.applicant_id = @p_applicant_id AND at.code = 'PERSONAL'
        )
        BEGIN
            SET @p_result = 0;
            SET @p_error_message = N'El aspirante no tiene dirección personal registrada';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        IF NOT EXISTS (
            SELECT 1 
            FROM core.applicant_address aa
            INNER JOIN core.address_type at ON aa.address_type_id = at.id
            WHERE aa.applicant_id = @p_applicant_id AND at.code = 'FISCAL'
        )
        BEGIN
            SET @p_result = 0;
            SET @p_error_message = N'El aspirante no tiene dirección fiscal registrada';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- Crear driver consolidando datos de applicant + applicant_profile
        INSERT INTO core.driver (
            source_applicant_id,
            first_name, middle_name, paternal_surname, maternal_surname, phone, email,
            nationality, birth_date, gender,
            rfc, fiscal_regime,
            vehicle_make, vehicle_model, vehicle_year, vehicle_plates, vehicle_color,
            bank_name, bank_clabe,
            status
        )
        VALUES (
            @p_applicant_id,
            @v_first_name, @v_middle_name, @v_paternal_surname, @v_maternal_surname, @v_phone, @v_email,
            @v_nationality, @v_birth_date, @v_gender,
            @v_rfc, @v_fiscal_regime,
            @v_vehicle_make, @v_vehicle_model, @v_vehicle_year, @v_vehicle_plates, @v_vehicle_color,
            @v_bank_name, @v_bank_clabe,
            N'Habilitado'
        );
        
        SET @p_driver_id = SCOPE_IDENTITY();
        
        -- Copiar relaciones de direcciones del aspirante al driver (MODELO NORMALIZADO)
        INSERT INTO core.driver_address (driver_id, address_id, address_type_id)
        SELECT @p_driver_id, address_id, address_type_id
        FROM core.applicant_address
        WHERE applicant_id = @p_applicant_id;
        
        -- Actualizar estado del aspirante
        UPDATE core.applicant 
        SET status = N'Convertido', 
            updated_at = GETUTCDATE() 
        WHERE id = @p_applicant_id;
        
        COMMIT TRANSACTION;
        
        SET @p_result = 1;
        SET @p_error_message = NULL;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SET @p_result = 0;
        SET @p_error_message = ERROR_MESSAGE();
    END CATCH;
END;
GO

-- Documentación
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Convierte un aspirante en driver al firmar contrato. Requiere perfil completo.',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'PROCEDURE', @level1name = N'sp_convert_applicant_to_driver';
GO
```

**Validaciones del SP**:
- Valida existencia del aspirante
- Valida que `applicant_profile` existe y `profile_completed = true`
- Valida que no existe driver previo con mismo `source_applicant_id` (constraint UNIQUE)
- **NUEVO (Modelo Normalizado)**: Valida que el aspirante tiene dirección personal registrada en `applicant_address`
- **NUEVO (Modelo Normalizado)**: Valida que el aspirante tiene dirección fiscal registrada en `applicant_address`
- Crea driver con estado inicial 'Habilitado' (SIN campos denormalizados de dirección)
- **NUEVO (Modelo Normalizado)**: Copia relaciones de direcciones desde `applicant_address` a `driver_address`
- Actualiza estado del aspirante a 'Convertido'
- Manejo transaccional completo con ROLLBACK en caso de error
- Manejo de excepciones con mensajes claros

**Dependencias**:
- Tabla `core.applicant` con datos
- Tabla `core.applicant_profile` con perfil completo (SIN campos de dirección)
- Tabla `core.driver` creada con FK `source_applicant_id` (SIN campos denormalizados de dirección)
- **NUEVO**: Tabla `core.state` (catálogo de estados)
- **NUEVO**: Tabla `core.city` (catálogo de ciudades)
- **NUEVO**: Tabla `core.neighborhood` (catálogo de colonias)
- **NUEVO**: Tabla `core.zip_code` (catálogo de códigos postales)
- **NUEVO**: Tabla `core.address` (direcciones normalizadas)
- **NUEVO**: Tabla `core.address_type` (tipos: PERSONAL, FISCAL)
- **NUEVO**: Tabla `core.applicant_address` (relación aspirante → dirección)
- **NUEVO**: Tabla `core.driver_address` (relación driver → dirección)

**Consideraciones técnicas**:
- **IMPORTANTE**: Los documentos NO se migran porque ya están ligados a `applicant_id`
- Para obtener documentos del driver: `SELECT d.* FROM core.document d INNER JOIN core.driver dr ON d.applicant_id = dr.source_applicant_id WHERE dr.id = {driver_id}`
- **IMPORTANTE (Modelo Normalizado)**: Para obtener direcciones del driver: `SELECT a.* FROM core.address a INNER JOIN core.driver_address da ON a.id = da.address_id WHERE da.driver_id = {driver_id}`
- El SP se invoca desde endpoint de firma de contrato
- Después de crear driver, se debe actualizar `core.contract.driver_id` con el nuevo ID
- Estado 'Convertido' permite filtrar aspirantes que ya son drivers
- No se eliminan datos del aspirante ni sus direcciones para mantener auditoría completa
- Las relaciones de direcciones se COPIAN (no se mueven) para preservar historial del aspirante

---

#### [BACK] Crear endpoint de prevalidación de duplicidad

**Objetivo funcional**:
Permitir validar si teléfono o email ya están registrados ANTES de iniciar proceso de verificación OTP.

**Descripción técnica**:
Endpoint que verifica existencia de registro previo (aspirante o driver) con teléfono o email dado.

**⚠️ MODELO BASE - ENTIDAD ÚNICA:**
- **NO existe tabla `core.applicant`** (modelo base usa entidad única)
- Se consulta **`core.driver`** con filtro de estado
- Aspirantes: `driver_status_id IN (1,2,3,4,5)` (usa vista `vw_driver_applicant`)
- Drivers operativos: `driver_status_id IN (6,7)`

**Lógica de operación**:
```csharp
// Controller
[HttpPost("check-duplicate")]
public async Task<IActionResult> CheckDuplicate([FromBody] CheckDuplicateRequest request)
{
    var result = await _driverService.CheckDuplicate(request.Phone, request.Email);
    
    if (result.IsDuplicate)
    {
        return Ok(new {
            isDuplicate = true,
            duplicatedFields = result.DuplicatedFields,
            existingStatus = result.ExistingStatus,
            message = result.Message
        });
    }
    
    return Ok(new {
        isDuplicate = false,
        duplicatedFields = new string[] {},
        existingStatus = null,
        message = "Datos disponibles para registrarse"
    });
}

// Service (ACTUALIZADO AL MODELO BASE)
public async Task<DuplicateCheckResult> CheckDuplicate(string phone, string email)
{
    var duplicatedFields = new List<string>();
    string existingStatus = null;
    
    // Verificar teléfono en core.driver (cualquier estado)
    var driverByPhone = await _context.Drivers
        .Where(d => d.Phone == phone)
        .Select(d => new { d.DriverStatusId, d.DriverRole })
        .FirstOrDefaultAsync();
    
    if (driverByPhone != null)
    {
        duplicatedFields.Add("phone");
        existingStatus = driverByPhone.DriverStatusId <= 5 ? "aspirante" : "driver";
    }
    
    // Verificar email en core.driver (cualquier estado)
    var driverByEmail = await _context.Drivers
        .Where(d => d.Email.ToLower() == email.ToLower())
        .Select(d => new { d.DriverStatusId, d.DriverRole })
        .FirstOrDefaultAsync();
    
    if (driverByEmail != null && !duplicatedFields.Contains("phone"))
    {
        duplicatedFields.Add("email");
        existingStatus = driverByEmail.DriverStatusId <= 5 ? "aspirante" : "driver";
    }
    
    // Mensajes diferenciados según estado
    var message = duplicatedFields.Count switch {
        0 => "Datos disponibles para registrarse",
        1 => GenerateMessage(duplicatedFields[0], existingStatus),
        _ => $"El teléfono y email ya están registrados como {existingStatus}. Contacta a soporte."
    };
    
    return new DuplicateCheckResult {
        IsDuplicate = duplicatedFields.Any(),
        DuplicatedFields = duplicatedFields,
        ExistingStatus = existingStatus,
        Message = message
    };
}

private string GenerateMessage(string field, string status)
{
    var fieldName = field == "phone" ? "teléfono" : "email";
    var statusText = status == "aspirante" 
        ? "en proceso de registro" 
        : "como driver activo";
    
    return $"El {fieldName} ya está registrado {statusText}. Si necesitas ayuda, contacta a soporte.";
}
```

**Request:**
```json
POST /api/drivers/check-duplicate
{
  "phone": "8112345678",
  "email": "correo@dominio.com"
}
```

**Response (sin duplicado):**
```json
{
  "isDuplicate": false,
  "duplicatedFields": [],
  "existingStatus": null,
  "message": "Datos disponibles para registrarse"
}
```

**Response (duplicado como aspirante):**
```json
{
  "isDuplicate": true,
  "duplicatedFields": ["phone"],
  "existingStatus": "aspirante",
  "message": "El teléfono ya está registrado en proceso de registro. Si necesitas ayuda, contacta a soporte."
}
```

**Response (duplicado como driver activo):**
```json
{
  "isDuplicate": true,
  "duplicatedFields": ["email"],
  "existingStatus": "driver",
  "message": "El email ya está registrado como driver activo. Si necesitas ayuda, contacta a soporte."
}
```

**Dependencias**:
- Tabla `core.driver` con índices en `phone` y `email`
- Vista `core.vw_driver_applicant` (aspirantes: status 1-5)
- Vista `core.vw_driver_operational` (drivers: status 6-7)
- Catálogo `core.driver_status` con estados 1-9
- Endpoint debe ejecutarse ANTES de mostrar sección de verificación OTP

**Validaciones**:
- Consulta **`core.driver`** (entidad única del modelo base)
- Detecta duplicados en CUALQUIER estado (aspirante o driver)
- Diferencia mensajes según estado actual del registro
- Retorna campos duplicados específicos y estado existente
- Mensaje claro orienta al usuario a soporte
- No expone información sensible de registros existentes
- Si encuentra duplicado en estado 5-Rechazado o 8-Suspendido, permite re-registro (opcional, según RN)

**Estados del catálogo (referencia):**
- 1 = Pendiente (aspirante inicial)
- 2 = En Revisión  
- 3 = Propuesta Enviada
- 4 = Aprobado
- 5 = Rechazado
- 6 = Habilitado (driver activo)
- 7 = Deshabilitado
- 8 = Suspendido
- 9 = Con Incapacidad

---

### HU 198195 - Verificación OTP SMS

#### [DB] Crear tabla de sesiones de registro

**Objetivo funcional**:
Almacenar estado temporal de registro incluyendo OTPs generados y estado de verificación por canal.

**Descripción técnica**:
Crear tabla para gestión de sesiones anónimas durante flujo de registro.

**Lógica de operación**:
```sql
CREATE TABLE core.registration_session (
    -- Identificación
    session_id VARCHAR(50) PRIMARY KEY,            -- GUID generado por backend
    
    -- Datos del aspirante
    phone VARCHAR(10),
    email NVARCHAR(255),
    
    -- OTP y verificación - SMS
    phone_otp_hash VARCHAR(64),                    -- SHA256 del código OTP
    phone_otp_generated_at TIMESTAMPTZ,
    phone_otp_expires_at TIMESTAMPTZ,
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    phone_retry_count SMALLINT NOT NULL DEFAULT 0,
    
    -- OTP y verificación - Email
    email_otp_hash VARCHAR(64),                    -- SHA256 del código OTP
    email_otp_generated_at TIMESTAMPTZ,
    email_otp_expires_at TIMESTAMPTZ,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_retry_count SMALLINT NOT NULL DEFAULT 0,
    
    -- Control de sesión
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    completed BOOLEAN NOT NULL DEFAULT false,      -- Marca true al registrar exitosamente
    completed_at TIMESTAMPTZ,
    
    -- Auditoría
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- Índices
CREATE INDEX ix_registration_session_phone ON core.registration_session(phone);
CREATE INDEX ix_registration_session_email ON core.registration_session(email);
CREATE INDEX ix_registration_session_expires ON core.registration_session(expires_at);
CREATE INDEX ix_registration_session_completed ON core.registration_session(completed);

-- Job de limpieza (ejecutar diariamente)
-- DELETE FROM core.registration_session 
-- WHERE expires_at < CURRENT_TIMESTAMP OR (completed = true AND completed_at < CURRENT_TIMESTAMP - INTERVAL '7 days');
```

**Dependencias**:
- Modelo de datos SPIDI
- Job scheduler para limpieza automática de sesiones expiradas

**Validaciones**:
- `session_id` es único (PK)
- OTPs se almacenan como hash SHA256, NO texto plano
- Sesiones expiran automáticamente después de 24h
- Índices optimizan búsquedas frecuentes
- Job de limpieza previene crecimiento infinito de tabla
- Sesiones completadas se marcan pero no se eliminan inmediatamente (para auditoría)

---

#### [DB] Crear tabla de bitácora de comunicaciones

**Objetivo funcional**:
Registrar historial de envíos de SMS y emails para auditoría y troubleshooting.

**Descripción técnica**:
Crear tabla para tracking completo de comunicaciones enviadas (OTP, bienvenida, notificaciones).

**Lógica de operación**:
```sql
CREATE TABLE core.communication_log (
    -- Identificación
    id BIGSERIAL PRIMARY KEY,
    
    -- Tipo y destinatario
    communication_type VARCHAR(50) NOT NULL,    -- OTP_SMS, OTP_EMAIL, WELCOME_EMAIL
    channel VARCHAR(20) NOT NULL,               -- SMS, EMAIL
    recipient VARCHAR(255) NOT NULL,            -- Teléfono o email
    
    -- Contenido (preview para debugging)
    subject NVARCHAR(255),                      -- Para emails
    body_preview TEXT,                          -- Primeros 500 chars
    
    -- Estado y resultado
    status VARCHAR(20) NOT NULL,                -- SENT, FAILED, RETRY
    external_id VARCHAR(100),                   -- Message SID de Twilio, etc.
    error_message TEXT,
    retry_count SMALLINT DEFAULT 0,
    
    -- Contexto
    session_id VARCHAR(50),                     -- Relación con registration_session
    applicant_id BIGINT REFERENCES core.applicant(id) ON DELETE SET NULL,
    driver_id BIGINT REFERENCES core.driver(id) ON DELETE SET NULL,
    
    -- Timing
    sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- Índices
CREATE INDEX ix_communication_log_recipient ON core.communication_log(recipient);
CREATE INDEX ix_communication_log_session ON core.communication_log(session_id);
CREATE INDEX ix_communication_log_status ON core.communication_log(status);
CREATE INDEX ix_communication_log_type ON core.communication_log(communication_type);
CREATE INDEX ix_communication_log_sent_at ON core.communication_log(sent_at);
CREATE INDEX ix_communication_log_applicant ON core.communication_log(applicant_id);

-- Vista para análisis de tasa de éxito
CREATE VIEW core.v_communication_success_rate AS
SELECT 
    communication_type,
    channel,
    DATE(sent_at) as date,
    COUNT(*) as total_sent,
    SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
    ROUND(100.0 * SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM core.communication_log
GROUP BY communication_type, channel, DATE(sent_at)
ORDER BY date DESC, communication_type;
```

**Dependencias**:
- Tabla `core.applicant` (FK opcional)
- Tabla `core.driver` (FK opcional)
- Tabla `core.registration_session` (relación por session_id)

**Validaciones**:
- Todos los envíos se registran (éxito y fallo)
- `external_id` captura ID de proveedores (Twilio SID, etc.)
- Índices optimizan consultas de troubleshooting
- Vista `v_communication_success_rate` permite monitorear calidad del servicio
- Retención de logs: indefinida o según política de la empresa

---

#### [BACK] Crear servicio de logging de comunicaciones

**Objetivo funcional**:
Proveer servicio centralizado para registrar todas las comunicaciones enviadas.

**Descripción técnica**:
Servicio de negocio que abstrae persistencia en `core.communication_log`.

**Lógica de operación**:
```csharp
public interface ICommunicationLogService
{
    Task LogSmsAsync(SmsLogEntry entry);
    Task LogEmailAsync(EmailLogEntry entry);
    Task UpdateStatusAsync(long logId, string status, string errorMessage = null);
}

public class CommunicationLogService : ICommunicationLogService
{
    private readonly AppDbContext _context;
    
    public async Task LogSmsAsync(SmsLogEntry entry)
    {
        var log = new CommunicationLog
        {
            CommunicationType = entry.Type, // "OTP_SMS"
            Channel = "SMS",
            Recipient = entry.PhoneNumber,
            BodyPreview = entry.MessagePreview,
            Status = entry.Status,
            ExternalId = entry.TwilioSid,
            ErrorMessage = entry.ErrorMessage,
            RetryCount = entry.RetryCount,
            SessionId = entry.SessionId,
            ApplicantId = entry.ApplicantId,
            SentAt = DateTime.UtcNow,
            IpAddress = entry.IpAddress
        };
        
        _context.CommunicationLogs.Add(log);
        await _context.SaveChangesAsync();
    }
    
    public async Task LogEmailAsync(EmailLogEntry entry)
    {
        var log = new CommunicationLog
        {
            CommunicationType = entry.Type, // "WELCOME_EMAIL", "OTP_EMAIL"
            Channel = "EMAIL",
            Recipient = entry.Email,
            Subject = entry.Subject,
            BodyPreview = entry.BodyPreview?.Substring(0, Math.Min(500, entry.BodyPreview?.Length ?? 0)),
            Status = entry.Status,
            ExternalId = entry.ExternalMessageId,
            ErrorMessage = entry.ErrorMessage,
            RetryCount = entry.RetryCount,
            SessionId = entry.SessionId,
            ApplicantId = entry.ApplicantId,
            SentAt = DateTime.UtcNow,
            IpAddress = entry.IpAddress
        };
        
        _context.CommunicationLogs.Add(log);
        await _context.SaveChangesAsync();
    }
    
    public async Task UpdateStatusAsync(long logId, string status, string errorMessage = null)
    {
        var log = await _context.CommunicationLogs.FindAsync(logId);
        if (log != null)
        {
            log.Status = status;
            if (errorMessage != null)
                log.ErrorMessage = errorMessage;
            if (status == "RETRY")
                log.RetryCount++;
            
            await _context.SaveChangesAsync();
        }
    }
}
```

**Dependencias**:
- Tabla `core.communication_log` creada
- Entity Framework DbContext configurado
- DTOs: `SmsLogEntry`, `EmailLogEntry`

**Validaciones**:
- Servicio registra logs de forma asíncrona
- No arroja excepciones que rompan flujo principal (try-catch interno)
- Logs incluyen contexto suficiente para debugging
- `BodyPreview` se trunca a 500 caracteres automáticamente
- Datos sensibles (OTP completo) NO se loggean

---

### HU 198201 - Verificación OTP Email / HU 198212 - Mensaje Bienvenida

#### [DB] Crear tabla unificada de plantillas de comunicación (SMS y Email)

**Objetivo funcional**:
Almacenar plantillas parametrizables para TODAS las comunicaciones (SMS y Email) sin necesidad de deploy para cambios de contenido.

**Descripción técnica**:
Crear tabla unificada `core.communication_template` que gestione plantillas de SMS y Email con tokens reemplazables.

**Lógica de operación**:
```sql
-- SQL Server
CREATE TABLE core.communication_template (
    -- Identificación
    id SMALLINT IDENTITY(1,1) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,            -- WELCOME_EMAIL, OTP_EMAIL, OTP_SMS
    name NVARCHAR(100) NOT NULL,
    channel VARCHAR(20) NOT NULL,                -- EMAIL, SMS
    
    -- Contenido para EMAIL
    subject NVARCHAR(255),                       -- Solo para emails: "{{firstName}}, bienvenido a SPIDI"
    body_html NVARCHAR(MAX),                     -- Solo para emails: HTML con tokens
    body_plain NVARCHAR(MAX),                    -- Para emails: texto plano fallback, Para SMS: contenido del mensaje
    
    -- Variables disponibles (para documentación)
    available_tokens NVARCHAR(500),              -- JSON: ["firstName", "verificationCode", "expirationMinutes"]
    
    -- Control
    active BIT NOT NULL DEFAULT 1,
    version SMALLINT NOT NULL DEFAULT 1,         -- Para versionado de plantillas
    
    -- Auditoría
    created_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    created_by NVARCHAR(100),
    updated_by NVARCHAR(100)
);
GO

-- Índices
CREATE INDEX ix_communication_template_code ON core.communication_template(code);
GO
CREATE INDEX ix_communication_template_channel ON core.communication_template(channel);
GO
CREATE INDEX ix_communication_template_active ON core.communication_template(active);
GO

-- Documentación
EXEC sp_addextendedproperty 
    @name = N'MS_Description', @value = N'Plantillas parametrizables para SMS y Email',
    @level0type = N'SCHEMA', @level0name = N'core',
    @level1type = N'TABLE', @level1name = N'communication_template';
GO

-- ========================================
-- PLANTILLA 1: Email de Bienvenida
-- ========================================
INSERT INTO core.communication_template (code, name, channel, subject, body_html, body_plain, available_tokens)
VALUES (
    'WELCOME_EMAIL',
    'Correo de Bienvenida',
    'EMAIL',
    N'¡Bienvenido a SPIDI, {{firstName}}!',
    N'<html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #00A859;">¡Hola {{firstName}}!</h1>
            <p>Gracias por registrarte en SPIDI. Tu solicitud ha sido recibida exitosamente.</p>
            
            <h2>Próximos pasos:</h2>
            <ol>
                <li>Revisaremos tu información en las próximas 24-48 horas</li>
                <li>Validaremos tus documentos y antecedentes</li>
                <li>Te contactaremos por correo o teléfono con los siguientes pasos</li>
            </ol>
            
            <p>El proceso completo toma entre 5-7 días hábiles.</p>
            
            <p style="margin-top: 30px;">
                Si tienes preguntas, contáctanos en:<br>
                📧 <a href="mailto:soporte@spidi.com.mx">soporte@spidi.com.mx</a><br>
                📱 WhatsApp: +52 81 1234 5678
            </p>
            
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #666;">
                © 2026 SPIDI Inc. Todos los derechos reservados.
            </p>
        </div>
    </body>
    </html>',
    N'Hola {{firstName}},

Gracias por registrarte en SPIDI. Tu solicitud ha sido recibida exitosamente.

Próximos pasos:
1. Revisaremos tu información en las próximas 24-48 horas
2. Validaremos tus documentos y antecedentes
3. Te contactaremos con los siguientes pasos

El proceso toma entre 5-7 días hábiles.

Si tienes preguntas, contáctanos en soporte@spidi.com.mx

© 2026 SPIDI Inc.',
    N'["firstName"]'
);

-- ========================================
-- PLANTILLA 2: OTP Email
-- ========================================
INSERT INTO core.communication_template (code, name, channel, subject, body_html, body_plain, available_tokens)
VALUES (
    'OTP_EMAIL',
    'Código de Verificación por Email',
    'EMAIL',
    N'Tu código de verificación SPIDI',
    N'<html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #00A859;">Código de Verificación</h1>
            <p>Tu código de verificación para completar tu registro en SPIDI es:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
                <h2 style="margin: 0; font-size: 32px; letter-spacing: 8px; color: #00A859;">{{verificationCode}}</h2>
            </div>
            
            <p>Este código es válido por <strong>{{expirationMinutes}} minutos</strong>.</p>
            
            <p style="color: #666; font-size: 14px;">
                Si no solicitaste este código, puedes ignorar este mensaje.
            </p>
        </div>
    </body>
    </html>',
    N'Tu código de verificación SPIDI: {{verificationCode}}

Este código es válido por {{expirationMinutes}} minutos.

Si no solicitaste este código, ignora este mensaje.',
    N'["verificationCode", "expirationMinutes"]'
);

-- ========================================
-- PLANTILLA 3: OTP SMS
-- ========================================
INSERT INTO core.communication_template (code, name, channel, subject, body_html, body_plain, available_tokens)
VALUES (
    'OTP_SMS',
    'Código de Verificación por SMS',
    'SMS',
    NULL,  -- SMS no tiene subject
    NULL,  -- SMS no tiene HTML
    N'Tu código de verificación SPIDI es: {{verificationCode}}. Válido por {{expirationMinutes}} minutos.',
    N'["verificationCode", "expirationMinutes"]'
);
GO
```

**Dependencias**:
- Modelo de datos SPIDI
- Servicio backend que procese tokens ({{variable}})

**Validaciones**:
- Plantillas EMAIL tienen `subject`, `body_html` y `body_plain`
- Plantillas SMS solo usan `body_plain` (texto puro)
- Todos los tokens están documentados en `available_tokens`
- HTML es responsivo y se visualiza correctamente en clientes de email
- SMS no excede 160 caracteres después de reemplazo de tokens
- Plantillas pueden actualizarse sin deploy (UPDATE en BD)
- Campo `version` permite rollback si es necesario
- Campo `channel` permite filtrar plantillas por tipo

**Consideraciones adicionales**:
- Para SMS: máximo 160 caracteres recomendado (límite estándar GSM)
- Para Email HTML: usar estilos inline (mejor compatibilidad)
- Tokens se reemplazan con sintaxis Mustache: `{{nombreToken}}`
- `available_tokens` es JSON string para compatibilidad SQL Server

---

#### [BACK] Crear servicio unificado de renderizado de plantillas

**Objetivo funcional**:
Procesar plantillas de comunicación (SMS y Email) sustituyendo tokens por valores reales.

**Descripción técnica**:
Servicio que obtiene plantilla de BD y reemplaza tokens dinámicos para cualquier canal.

**Lógica de operación**:
```csharp
// Interfaces
public interface ICommunicationTemplateService
{
    Task<RenderedEmail> RenderEmailTemplateAsync(string templateCode, Dictionary<string, string> tokens);
    Task<string> RenderSmsTemplateAsync(string templateCode, Dictionary<string, string> tokens);
}

// Implementación
public class CommunicationTemplateService : ICommunicationTemplateService
{
    private readonly AppDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CommunicationTemplateService> _logger;
    
    public async Task<RenderedEmail> RenderEmailTemplateAsync(string templateCode, Dictionary<string, string> tokens)
    {
        // Obtener plantilla (con cache)
        var template = await GetTemplateAsync(templateCode, "EMAIL");
        
        if (template == null)
            throw new TemplateNotFoundException($"Email template '{templateCode}' not found");
        
        // Renderizar subject
        var subject = ReplaceTokens(template.Subject, tokens);
        
        // Renderizar body HTML
        var bodyHtml = ReplaceTokens(template.BodyHtml, tokens);
        
        // Renderizar body plain
        var bodyPlain = string.IsNullOrEmpty(template.BodyPlain) 
            ? StripHtml(bodyHtml) 
            : ReplaceTokens(template.BodyPlain, tokens);
        
        return new RenderedEmail
        {
            Subject = subject,
            BodyHtml = bodyHtml,
            BodyPlain = bodyPlain
        };
    }
    
    public async Task<string> RenderSmsTemplateAsync(string templateCode, Dictionary<string, string> tokens)
    {
        // Obtener plantilla SMS (con cache)
        var template = await GetTemplateAsync(templateCode, "SMS");
        
        if (template == null)
            throw new TemplateNotFoundException($"SMS template '{templateCode}' not found");
        
        // Para SMS solo renderizar body_plain
        var smsMessage = ReplaceTokens(template.BodyPlain, tokens);
        
        // Validar longitud (advertencia si excede 160 caracteres)
        if (smsMessage.Length > 160)
        {
            _logger.LogWarning("SMS template '{Code}' rendered to {Length} chars (> 160). Message: {Message}", 
                templateCode, smsMessage.Length, smsMessage);
        }
        
        return smsMessage;
    }
    
    private async Task<CommunicationTemplate> GetTemplateAsync(string code, string channel)
    {
        var cacheKey = $"comm_template_{channel}_{code}";
        
        if (!_cache.TryGetValue(cacheKey, out CommunicationTemplate template))
        {
            template = await _context.CommunicationTemplates
                .FirstOrDefaultAsync(t => t.Code == code && t.Channel == channel && t.Active);
            
            if (template != null)
            {
                // Cache por 1 hora
                _cache.Set(cacheKey, template, TimeSpan.FromHours(1));
            }
        }
        
        return template;
    }
    
    private string ReplaceTokens(string content, Dictionary<string, string> tokens)
    {
        if (string.IsNullOrEmpty(content) || tokens == null)
            return content;
        
        foreach (var token in tokens)
        {
            content = content.Replace($"{{{{{token.Key}}}}}", token.Value);
        }
        
        return content;
    }
    
    private string StripHtml(string html)
    {
        // Simple HTML strip - puede usar HTML Agility Pack para mejor resultado
        return Regex.Replace(html ?? "", "<.*?>", string.Empty);
    }
}

// DTOs
public class RenderedEmail
{
    public string Subject { get; set; }
    public string BodyHtml { get; set; }
    public string BodyPlain { get; set; }
}

public class TemplateNotFoundException : Exception
{
    public TemplateNotFoundException(string message) : base(message) { }
}
```

**Uso en servicios de envío:**

```csharp
// En servicio de envío de Email de Bienvenida (Task 198258):
var renderedEmail = await _templateService.RenderEmailTemplateAsync("WELCOME_EMAIL", new Dictionary<string, string>
{
    { "firstName", applicant.FirstName }
});

await _emailService.SendAsync(applicant.Email, renderedEmail.Subject, renderedEmail.BodyHtml, renderedEmail.BodyPlain);

// En servicio de envío de OTP por SMS (Task 198240):
var smsMessage = await _templateService.RenderSmsTemplateAsync("OTP_SMS", new Dictionary<string, string>
{
    { "verificationCode", otpCode },
    { "expirationMinutes", "10" }
});

await _twilioClient.SendSmsAsync(phoneNumber, smsMessage);

// En servicio de envío de OTP por Email (Task 198244):
var renderedEmail = await _templateService.RenderEmailTemplateAsync("OTP_EMAIL", new Dictionary<string, string>
{
    { "verificationCode", otpCode },
    { "expirationMinutes", "10" }
});

await _emailService.SendAsync(email, renderedEmail.Subject, renderedEmail.BodyHtml, renderedEmail.BodyPlain);
```

**Dependencias**:
- Tabla `core.communication_template` creada e inicializada
- Entity Framework DbContext
- MemoryCache configurado (para cache de plantillas)
- NuGet: System.Text.RegularExpressions (para strip HTML)

**Validaciones**:
- Plantillas se cachean por 1h para optimizar performance
- Cache key incluye canal (EMAIL/SMS) y código de plantilla
- Tokens faltantes se dejan como están (no se rompe si falta un token opcional)
- HTML se sanitiza si es necesario (prevenir XSS)
- Función de strip HTML genera plain text básico si no existe en BD
- Servicio arroja excepción clara si plantilla no existe o no está activa
- Para SMS: log warning si mensaje excede 160 caracteres después de renderizar
- Servicio es thread-safe (puede usarse en concurrencia)

---

#### [BACK] Crear servicio de renderizado de plantillas de email

**⚠️ NOTA:** Esta tarea fue REEMPLAZADA por la tarea anterior "[BACK] Crear servicio unificado de renderizado de plantillas". Mantener solo si se requiere servicio específico de email separado del de SMS.

**Objetivo funcional (DEPRECADO)**:
Procesar plantillas de email sustituyendo tokens por valores reales.

**Descripción técnica (DEPRECADO)**:
Servicio que obtiene plantilla de BD y reemplaza tokens dinámicos.

**Lógica de operación (DEPRECADO)**:
```csharp
public interface IEmailTemplateService
{
    Task<RenderedEmail> RenderTemplateAsync(string templateCode, Dictionary<string, string> tokens);
}

public class EmailTemplateService : IEmailTemplateService
{
    private readonly AppDbContext _context;
    private readonly IMemoryCache _cache;
    
    public async Task<RenderedEmail> RenderTemplateAsync(string templateCode, Dictionary<string, string> tokens)
    {
        // Obtener plantilla (con cache)
        var template = await GetTemplateAsync(templateCode);
        
        if (template == null)
            throw new TemplateNotFoundException($"Template '{templateCode}' not found");
        
        // Renderizar subject
        var subject = ReplaceTokens(template.Subject, tokens);
        
        // Renderizar body HTML
        var bodyHtml = ReplaceTokens(template.BodyHtml, tokens);
        
        // Renderizar body plain
        var bodyPlain = string.IsNullOrEmpty(template.BodyPlain) 
            ? StripHtml(bodyHtml) 
            : ReplaceTokens(template.BodyPlain, tokens);
        
        return new RenderedEmail
        {
            Subject = subject,
            BodyHtml = bodyHtml,
            BodyPlain = bodyPlain
        };
    }
    
    private async Task<EmailTemplate> GetTemplateAsync(string code)
    {
        var cacheKey = $"email_template_{code}";
        
        if (!_cache.TryGetValue(cacheKey, out EmailTemplate template))
        {
            template = await _context.EmailTemplates
                .FirstOrDefaultAsync(t => t.Code == code && t.Active);
            
            if (template != null)
            {
                _cache.Set(cacheKey, template, TimeSpan.FromHours(1));
            }
        }
        
        return template;
    }
    
    private string ReplaceTokens(string content, Dictionary<string, string> tokens)
    {
        if (string.IsNullOrEmpty(content) || tokens == null)
            return content;
        
        foreach (var token in tokens)
        {
            content = content.Replace($"{{{{{token.Key}}}}}", token.Value);
        }
        
        return content;
    }
    
    private string StripHtml(string html)
    {
        // Simple HTML strip - puede usar librería HTML Agility Pack para mejor resultado
        return Regex.Replace(html, "<.*?>", string.Empty);
    }
}

// Uso en envío de email de bienvenida:
var renderedEmail = await _emailTemplateService.RenderTemplateAsync("WELCOME", new Dictionary<string, string>
{
    { "firstName", applicant.FirstName }
});

await _emailService.SendAsync(applicant.Email, renderedEmail.Subject, renderedEmail.BodyHtml, renderedEmail.BodyPlain);
```

**Dependencias**:
- Tabla `core.email_template` creada
- Entity Framework DbContext
- MemoryCache configurado (para cache de plantillas)

**Validaciones**:
- Plantillas se cachean por 1h para optimizar performance
- Tokens faltantes se dejan como están (no se rompe si falta un token)
- HTML se sanitiza si es necesario (prevenir XSS)
- Función de strip HTML genera plain text básico si no existe en BD
- Servicio arroja excepción clara si plantilla no existe

---

#### [INTEGRACION] Configurar servicio de Twilio SendGrid para emails

**Objetivo funcional**:
Configurar y verificar integración con Twilio SendGrid (o servicio de email definido) para envío de correos.

**Descripción técnica**:
Setup de configuración, autenticación y cliente de Twilio SendGrid.

**Lógica de operación**:

**1. Configuración (appsettings.json):**
```json
{
  "Twilio": {
    "AccountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "AuthToken": "your_auth_token_here",
    "PhoneNumber": "+525512345678",
    "SendGrid": {
      "ApiKey": "SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "FromEmail": "noreply@spidi.com.mx",
      "FromName": "SPIDI Plataforma"
    }
  }
}
```

**2. Modelo de configuración:**
```csharp
public class TwilioSendGridConfig
{
    public string ApiKey { get; set; }
    public string FromEmail { get; set; }
    public string FromName { get; set; }
}
```

**3. Servicio de email:**
```csharp
public interface IEmailService
{
    Task<EmailSendResult> SendAsync(string toEmail, string subject, string bodyHtml, string bodyPlain = null);
}

public class TwilioSendGridEmailService : IEmailService
{
    private readonly SendGridClient _client;
    private readonly TwilioSendGridConfig _config;
    private readonly ILogger<TwilioSendGridEmailService> _logger;
    private readonly ICommunicationLogService _logService;
    
    public TwilioSendGridEmailService(
        IOptions<TwilioSendGridConfig> config,
        ILogger<TwilioSendGridEmailService> logger,
        ICommunicationLogService logService)
    {
        _config = config.Value;
        _client = new SendGridClient(_config.ApiKey);
        _logger = logger;
        _logService = logService;
    }
    
    public async Task<EmailSendResult> SendAsync(string toEmail, string subject, string bodyHtml, string bodyPlain = null)
    {
        try
        {
            var from = new EmailAddress(_config.FromEmail, _config.FromName);
            var to = new EmailAddress(toEmail);
            
            var msg = MailHelper.CreateSingleEmail(
                from, 
                to, 
                subject, 
                bodyPlain ?? StripHtml(bodyHtml), 
                bodyHtml
            );
            
            var response = await _client.SendEmailAsync(msg);
            
            // Log exitoso
            await _logService.LogEmailAsync(new EmailLogEntry
            {
                Type = "GENERIC_EMAIL",
                Email = toEmail,
                Subject = subject,
                BodyPreview = bodyHtml?.Substring(0, Math.Min(500, bodyHtml.Length)),
                Status = response.IsSuccessStatusCode ? "SENT" : "FAILED",
                ExternalMessageId = response.Headers.GetValues("X-Message-Id").FirstOrDefault()
            });
            
            if (response.IsSuccessStatusCode)
            {
                return EmailSendResult.Success(response.Headers.GetValues("X-Message-Id").FirstOrDefault());
            }
            else
            {
                var errorBody = await response.Body.ReadAsStringAsync();
                _logger.LogError("SendGrid error {StatusCode}: {Error}", response.StatusCode, errorBody);
                return EmailSendResult.Failure($"Error al enviar email: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción al enviar email a {Email}", toEmail);
            
            // Log fallido
            await _logService.LogEmailAsync(new EmailLogEntry
            {
                Type = "GENERIC_EMAIL",
                Email = toEmail,
                Subject = subject,
                Status = "FAILED",
                ErrorMessage = ex.Message
            });
            
            return EmailSendResult.Failure(ex.Message);
        }
    }
    
    private string StripHtml(string html) => Regex.Replace(html ?? "", "<.*?>", string.Empty);
}

public class EmailSendResult
{
    public bool Success { get; set; }
    public string MessageId { get; set; }
    public string ErrorMessage { get; set; }
    
    public static EmailSendResult Success(string messageId) => new() { Success = true, MessageId = messageId };
    public static EmailSendResult Failure(string error) => new() { Success = false, ErrorMessage = error };
}
```

**4. Registro en DI:**
```csharp
// Program.cs o Startup.cs
services.Configure<TwilioSendGridConfig>(configuration.GetSection("Twilio:SendGrid"));
services.AddScoped<IEmailService, TwilioSendGridEmailService>();
```

**Dependencias**:
- NuGet: `SendGrid` (librería oficial)
- API Key de Twilio SendGrid configurada
- Dominio `spidi.com.mx` verificado en SendGrid
- SPF, DKIM, DMARC configurados para deliverability

**Validaciones**:
- Autenticación con SendGrid funciona correctamente
- Emails se envían desde dominio verificado
- Errores de SendGrid se loggean apropiadamente
- Response headers incluyen `X-Message-Id` para tracking
- Servicio maneja rate limits de SendGrid
- Todos los envíos se registran en `core.communication_log`

---

### HU 198212 - Mensaje de Bienvenida

#### [BACK] Crear job de reintento de email de bienvenida

**Objetivo funcional**:
Reintentar envío de email de bienvenida cuando el primer intento falla, según política de 1 reintento a los 10 minutos.

**Descripción técnica**:
Background job que detecta emails fallidos y reintenta según configuración.

**Lógica de operación**:
```csharp
public class WelcomeEmailRetryJob : IHostedService, IDisposable
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<WelcomeEmailRetryJob> _logger;
    private Timer _timer;
    
    public WelcomeEmailRetryJob(IServiceProvider serviceProvider, ILogger<WelcomeEmailRetryJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }
    
    public Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Welcome Email Retry Job iniciado");
        
        // Ejecutar cada 5 minutos
        _timer = new Timer(DoWork, null, TimeSpan.Zero, TimeSpan.FromMinutes(5));
        
        return Task.CompletedTask;
    }
    
    private async void DoWork(object state)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var templateService = scope.ServiceProvider.GetRequiredService<IEmailTemplateService>();
        var logService = scope.ServiceProvider.GetRequiredService<ICommunicationLogService>();
        
        // Buscar emails fallidos elegibles para reintento
        var failedEmails = await context.CommunicationLogs
            .Where(log => 
                log.CommunicationType == "WELCOME_EMAIL" &&
                log.Status == "FAILED" &&
                log.RetryCount == 0 &&
                log.SentAt < DateTime.UtcNow.AddMinutes(-10) &&  // Esperar 10 min
                log.SentAt > DateTime.UtcNow.AddHours(-24))      // No reintentar emails muy viejos
            .Include(log => log.Applicant)
            .ToListAsync();
        
        _logger.LogInformation("Encontrados {Count} emails de bienvenida para reintentar", failedEmails.Count);
        
        foreach (var failedLog in failedEmails)
        {
            try
            {
                if (failedLog.Applicant == null)
                {
                    _logger.LogWarning("Applicant no encontrado para log {LogId}", failedLog.Id);
                    continue;
                }
                
                // Renderizar plantilla
                var renderedEmail = await templateService.RenderTemplateAsync("WELCOME", new Dictionary<string, string>
                {
                    { "firstName", failedLog.Applicant.FirstName }
                });
                
                // Reintentar envío
                var result = await emailService.SendAsync(
                    failedLog.Recipient,
                    renderedEmail.Subject,
                    renderedEmail.BodyHtml,
                    renderedEmail.BodyPlain
                );
                
                if (result.Success)
                {
                    // Actualizar log original
                    await logService.UpdateStatusAsync(failedLog.Id, "SENT");
                    
                    _logger.LogInformation(
                        "Reintento exitoso de email bienvenida para {Email}",
                        failedLog.Recipient
                    );
                }
                else
                {
                    // Marcar como retry failed
                    await logService.UpdateStatusAsync(failedLog.Id, "RETRY_FAILED", result.ErrorMessage);
                    
                    _logger.LogError(
                        "Reintento fallido de email bienvenida para {Email}: {Error}",
                        failedLog.Recipient,
                        result.ErrorMessage
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reintentando email {LogId}", failedLog.Id);
            }
        }
    }
    
    public Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Welcome Email Retry Job detenido");
        _timer?.Change(Timeout.Infinite, 0);
        return Task.CompletedTask;
    }
    
    public void Dispose()
    {
        _timer?.Dispose();
    }
}

// Registro en DI
services.AddHostedService<WelcomeEmailRetryJob>();
```

**Dependencias**:
- Tabla `core.communication_log` con registros de intentos
- Servicio de email configurado
- Servicio de plantillas configurado
- IHostedService habilitado en .NET

**Validaciones**:
- Job se ejecuta cada 5 minutos automáticamente
- Solo reintenta emails que tienen exactamente 0 reintentos previos
- Espera mínimo 10 minutos desde primer intento
- No reintenta emails con más de 24h de antiguedad
- Log original se actualiza con resultado del reintento
- No hay reintentos infinitos (máximo 1 según spec)
- Logs estructurados permiten monitoreo del job

---

### TAREAS TRANSVERSALES

#### [FRONT] Implementar limpieza de sesión post-registro exitoso

**Objetivo funcional**:
Limpiar localStorage y sessionStorage después de registro exitoso para prevenir duplicados.

**Descripción técnica**:
Función de limpieza invocada al confirmar registro guardado correctamente.

**Lógica de operación**:
```typescript
// En tarea 198248, agregar after success:
const handleSubmitSuccess = (response: RegistrationResponse) => {
  // Mostrar mensaje de éxito
  toast.success(response.message || 'Registro completado exitosamente');
  
  // Limpiar datos del formulario
  clearRegistrationData();
  
  // Redirigir a página de confirmación
  router.push('/registro/confirmacion');
};

const clearRegistrationData = () => {
  // Limpiar localStorage
  const keysToRemove = [
    'spidi_registration_data',
    'spidi_registration_step',
    'spidi_session_token',
    'spidi_phone_verified',
    'spidi_email_verified'
  ];
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Limpiar sessionStorage
  sessionStorage.clear();
  
  console.log('Datos de registro limpiados');
};

// Interceptor de navegación (prevenir "volver")
useEffect(() => {
  const handleBeforeUnload = () => {
    // Si ya completó registro, limpiar
    if (registrationCompleted) {
      clearRegistrationData();
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [registrationCompleted]);
```

**Dependencias**:
- Tarea 198248 (manejo de éxito)
- Tarea 198235 (persistencia en localStorage)

**Validaciones**:
- localStorage se limpia completamente tras éxito
- sessionStorage también se limpia
- Usuario no puede usar botón "atrás" para regresar al formulario con datos
- Si intenta registrarse nuevamente, debe iniciar desde cero
- Limpieza ocurre DESPUÉS de redirección (para evitar pérdida de estado)

---

#### [FRONT] Implementar recuperación de sesión al recargar página

**Objetivo funcional**:
Restaurar avance del registro cuando usuario recarga página o cierra/reabre navegador dentro de 24h.

**Descripción técnica**:
Hook de React que detecta datos en localStorage y restaura estado correcto del wizard.

**Lógica de operación**:
```typescript
// useRegistrationRecovery.ts
export const useRegistrationRecovery = () => {
  const [recovered, setRecovered] = useState(false);
  const { setFormData, setCurrentStep, setPhoneVerified, setEmailVerified } = useRegistrationForm();
  
  useEffect(() => {
    const recoverSession = () => {
      const savedData = localStorage.getItem('spidi_registration_data');
      
      if (!savedData) {
        setRecovered(false);
        return;
      }
      
      try {
        const data = JSON.parse(savedData);
        const sessionAge = Date.now() - (data.timestamp || 0);
        
        // Verificar que sesión sea válida (< 24h)
        if (sessionAge > 24 * 60 * 60 * 1000) {
          // Sesión expirada, limpiar
          localStorage.removeItem('spidi_registration_data');
          setRecovered(false);
          return;
        }
        
        // Restaurar datos del formulario
        if (data.formData) {
          setFormData(data.formData);
        }
        
        // Restaurar estado de verificación
        const phoneVerified = data.phoneVerified || false;
        const emailVerified = data.emailVerified || false;
        
        setPhoneVerified(phoneVerified);
        setEmailVerified(emailVerified);
        
        // Determinar paso actual según avance
        let step = 0; // Datos básicos
        
        if (phoneVerified && emailVerified) {
          step = 2; // Listo para enviar
        } else if (phoneVerified) {
          step = 1; // Verificar email
        } else if (data.formData?.phone && data.formData?.email) {
          step = 1; // Verificar teléfono
        }
        
        setCurrentStep(step);
        setRecovered(true);
        
        // Notificar usuario
        toast.info('Hemos recuperado tu sesión. Puedes continuar donde lo dejaste.');
        
        console.log(`Sesión recuperada: paso ${step}, phone verified: ${phoneVerified}, email verified: ${emailVerified}`);
      } catch (error) {
        console.error('Error recuperando sesión:', error);
        localStorage.removeItem('spidi_registration_data');
        setRecovered(false);
      }
    };
    
    recoverSession();
  }, []);
  
  return { recovered };
};

// En componente principal de registro:
const RegistroPage = () => {
  const { recovered } = useRegistrationRecovery();
  const { currentStep, formData } = useRegistrationForm();
  
  if (!recovered && currentStep === 0 && !formData) {
    // Primera vez, mostrar splash o intro
  }
  
  return (
    <WizardContainer>
      {currentStep === 0 && <DatosBasicosStep />}
      {currentStep === 1 && <VerificacionStep />}
      {currentStep === 2 && <ConfirmacionStep />}
    </WizardContainer>
  );
};
```

**Dependencias**:
- Tarea 198235 (persistencia en localStorage)
- Hook de formulario y state management

**Validaciones**:
- Sesiones > 24h se descartan automáticamente
- Estado del wizard refleja correctamente el avance recuperado
- Datos del formulario se restauran sin pérdida
- Estado de verificación (phone/email) se restaura
- Usuario recibe notificación clara de que su sesión fue recuperada
- Si hay error en parsing, sesión se descarta sin romper app

---

## RESUMEN DE TAREAS NUEVAS

### Por Tipo:
- **[DB]**: 4 tareas obligatorias (applicant, registration_session, communication_log, email_template) + 1 condicional (state/city solo si Cart Services no disponible)
- **[BACK]**: 7 tareas (endpoints, servicios, jobs)
- **[FRONT]**: 2 tareas (limpieza sesión, recuperación sesión)
- **[INTEGRACION]**: 2 tareas (Cart Services transformadores, Twilio SendGrid)

### Total: 15 tareas nuevas obligatorias + 1 condicional + 14 tareas a refinar

**Nota**: La tarea de crear tablas `state/city` solo se ejecuta si Cart Services NO está disponible. La solución primaria usa endpoints transformadores.

---

## PRIORIZACIÓN SUGERIDA

### 🔴 **Prioridad 1 - Bloqueantes para MVP** (Debe completarse antes de iniciar desarrollo):
1. [DB] Crear tabla `core.applicant`
2. [DB] Crear tabla `registration_session`
3. [DB] Crear tabla `communication_log`
4. [DB] Crear tabla `email_template`
5. [BACK] Crear endpoint de prevalidación de duplicidad
6. [INTEGRACION] Crear endpoints transformadores de catálogo geográfico (desde Cart Services)
7. [INTEGRACION] Configurar Twilio SendGrid
8. Refinar Task 198237 (confirmar Cart Services como solución)
9. Refinar Task 198239 (definir mecanismo de sesión)
10. Refinar Task 198252 (especificar SP completo)

### 🟡 **Prioridad 2 - Necesarias para calidad** (Implementar durante desarrollo):
11. [BACK] Crear servicio de logging de comunicaciones
12. [BACK] Crear servicio de renderizado de plantillas
13. [BACK] Crear job de reintento de emails
14. [FRONT] Implementar limpieza de sesión
15. [FRONT] Implementar recuperación de sesión
16. Refinar Task 198234 (agregar prevalidación)
17. Refinar Task 198240 (manejo errores Twilio SMS)
18. Refinar Task 198241 (validación OTP telefónico y reenvío)
19. Refinar Task 198243 (implementar verificación email OTP)
20. Refinar Task 198244 (canal de envío OTP email)
21. Refinar Task 198245 (validación OTP email y reenvío)
22. Refinar Task 198249 (validación de sesión)
23. Refinar Task 198260 (usar tabla de log)
24. Refinar Task 198261 (documentar mapeo completo)

### 🟢 **Prioridad 3 - Plan B / Contingencia** (Solo si solución primaria no es viable):
25. [DB] Crear tablas `state` y `city` (SOLO si Cart Services no está disponible en producción)

**NOTA**: La solución primaria para catálogo geográfico es usar Cart Services con endpoints transformadores. Las tablas locales son contingencia.

---

## IMPACTO EN ESTIMACIÓN

- **Tareas nuevas P1**: +2 sprints de preparación
- **Tareas nuevas P2**: Incluidas en desarrollo normal (+0.5 sprint)
- **Refinamiento de existentes**: +0.5 sprint de ajustes

**Total impacto**: +3 sprints vs. estimación original

**Nota sobre Cart Services**: La solución de endpoints transformadores está confirmada como viable. No hay riesgo adicional por indefinición del catálogo geográfico. El impacto estimado ya considera esta solución.

---

## VALIDACIÓN CON ARQUITECTURA

Antes de iniciar desarrollo, validar con arquitectura:
- ✅ Cart Services `/api/stores` confirmado como fuente de ubicaciones (requiere transformación en backend)
- ⚠️ Uso de Twilio SendGrid vs. otro servicio de email - PENDIENTE CONFIRMAR
- ✅ Estrategia de catálogo geográfico: Endpoint transformador desde tiendas activas (CONFIRMADA)
- ✅ Mecanismo de sesión para OTP: Tabla temporal + JWT/sessionId (RECOMENDADO)
- ⚠️ Políticas de retención de logs (communication_log) - PENDIENTE DEFINIR
- ⚠️ Configuración de dominio verificado para emails - PENDIENTE VALIDAR

**DECISIONES CONFIRMADAS:**
1. **Cart Services** es viable y será la fuente única de verdad para ubicaciones
2. **Endpoints transformadores** en backend SPIDI construirán catálogos desde tiendas activas
3. **Cache de 24h** para reducir llamadas a Cart Services
4. **Fallback estático** como safety net si Cart Services falla
5. **Tabla core.applicant** se crea como parte del Feature 195500 (no es infraestructura previa)

**PENDIENTES DE VALIDACIÓN:**
1. Confirmar servicio de email (Twilio SendGrid, SMTP, otro)
2. Obtener credenciales y API keys necesarias
3. Confirmar dominio `spidi.com.mx` verificado para envío de emails
4. Definir política de retención de logs operacionales
5. **Obtener bearer token de Cart Services para ambiente DEV/QA/PROD** (consultar con equipo Cart Services o Azure Key Vault)
6. **Ejecutar script DDL de tabla core.applicant en ambiente DEV/QA/PROD** antes de comenzar desarrollo del feature
