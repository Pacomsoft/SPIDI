# Refinamiento de Tareas - Feature 195500

> Documento de recomendaciones para ajuste de tareas existentes y creación de tareas nuevas necesarias para completar el alcance del feature.

---

## TAREAS EXISTENTES A REFINAR

### HU 198189 - Registro Inicial con Datos Básicos

#### Task 198234 - [FRONT] Implementar transición del paso de datos básicos al paso de verificación

**Información a agregar:**

**Lógica de operación** (Ampliar):
```markdown
Al hacer clic en Siguiente:
- El sistema valida todos los campos del formulario
- **AGREGAR:** Invoca endpoint de prevalidación de duplicidad
  ```typescript
  const checkResult = await fetch('/api/applicants/check-duplicate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      phone: formData.phone, 
      email: formData.email 
    })
  }).then(r => r.json());
  
  if (checkResult.isDuplicate) {
    // Mostrar error específico
    if (checkResult.duplicatedFields.includes('phone')) {
      setError('phone', { message: 'Este número de teléfono ya está registrado' });
    }
    if (checkResult.duplicatedFields.includes('email')) {
      setError('email', { message: 'Este correo electrónico ya está registrado' });
    }
    return; // NO permitir avanzar
  }
  ```
- Si existen errores de validación, no permite avanzar
- Si la información es válida y no hay duplicados, se oculta la sección de datos básicos
- Se muestra la sección de verificación de teléfono y correo
```

**Validaciones** (Agregar):
```markdown
- La prevalidación de duplicidad se ejecuta ANTES de transicionar
- El usuario NO puede avanzar si existe duplicado de teléfono o email
- Los mensajes de error indican claramente qué campo está duplicado
- El botón "Siguiente" queda bloqueado hasta resolver duplicados
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

### HU 198195 - Verificación OTP SMS

#### Task 198239 - [BACK] Implementar servicio reusable de OTP

**Información a agregar:**

**Descripción técnica** (Ampliar con definición de sesión):
```markdown
Desarrollar un servicio reusable de OTP que soporte distintos canales de verificación.

**Mecanismo de Sesión:**
El servicio debe usar tabla temporal `core.registration_session` para almacenar estado de verificación por sesión anónima:
- `session_id` (GUID): Identificador único de sesión
- `phone`, `email`: Datos del aspirante
- `phone_otp_hash`, `email_otp_hash`: Hash SHA256 del OTP (NO texto plano)
- `phone_verified`, `email_verified`: Banderas de verificación
- `otp_generated_at`, `otp_expires_at`: Control de tiempo
- `retry_count`: Contador de reenvíos
- `created_at`, `expires_at`: Tiempo de vida de sesión (24h)

**Algoritmo de OTP:**
- Código numérico de 6 dígitos
- Generación: `Random.Next(100000, 999999)`
- Almacenamiento: Hash SHA256 del código
- Validación: Comparar hash del código ingresado vs. hash almacenado
```

**Lógica de operación** (Implementación completa):
```csharp
// Interface
public interface IOtpService
{
    Task<OtpSessionResult> CreateSessionAsync(string phone, string email, string ipAddress, string userAgent);
    Task<OtpGenerationResult> GenerateOtpAsync(string sessionId, OtpChannel channel);
    Task<OtpValidationResult> ValidateOtpAsync(string sessionId, OtpChannel channel, string code);
}

public enum OtpChannel { Phone, Email }

// Implementación
public class OtpService : IOtpService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    
    public async Task<OtpSessionResult> CreateSessionAsync(string phone, string email, string ipAddress, string userAgent)
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
        
        return new OtpSessionResult { SessionId = session.SessionId, Success = true };
    }
    
    public async Task<OtpGenerationResult> GenerateOtpAsync(string sessionId, OtpChannel channel)
    {
        var session = await _context.RegistrationSessions.FindAsync(sessionId);
        if (session == null || session.ExpiresAt < DateTime.UtcNow)
            return new OtpGenerationResult { Success = false, Error = "Sesión inválida o expirada" };
        
        // Validar límite de reintentos
        var retryCount = channel == OtpChannel.Phone ? session.PhoneRetryCount : session.EmailRetryCount;
        if (retryCount >= 1)
            return new OtpGenerationResult { Success = false, Error = "Límite de reintentos alcanzado" };
        
        // Generar código de 6 dígitos
        var otpCode = Random.Shared.Next(100000, 999999).ToString();
        var otpHash = ComputeSha256Hash(otpCode);
        var expiresAt = DateTime.UtcNow.AddMinutes(_config.GetValue<int>("Otp:ExpirationMinutes", 10));
        
        // Almacenar en sesión según canal
        if (channel == OtpChannel.Phone)
        {
            session.PhoneOtpHash = otpHash;
            session.PhoneOtpGeneratedAt = DateTime.UtcNow;
            session.PhoneOtpExpiresAt = expiresAt;
            session.PhoneRetryCount++;
        }
        else
        {
            session.EmailOtpHash = otpHash;
            session.EmailOtpGeneratedAt = DateTime.UtcNow;
            session.EmailOtpExpiresAt = expiresAt;
            session.EmailRetryCount++;
        }
        
        await _context.SaveChangesAsync();
        
        return new OtpGenerationResult 
        { 
            Success = true, 
            OtpCode = otpCode,  // SOLO para enviar por SMS/Email, NO persistir
            ExpiresAt = expiresAt 
        };
    }
    
    public async Task<OtpValidationResult> ValidateOtpAsync(string sessionId, OtpChannel channel, string code)
    {
        var session = await _context.RegistrationSessions.FindAsync(sessionId);
        if (session == null)
            return new OtpValidationResult { Success = false, Error = "Sesión no encontrada" };
        
        if (session.ExpiresAt < DateTime.UtcNow)
            return new OtpValidationResult { Success = false, Error = "Sesión expirada" };
        
        var (otpHash, expiresAt, alreadyVerified) = channel == OtpChannel.Phone
            ? (session.PhoneOtpHash, session.PhoneOtpExpiresAt, session.PhoneVerified)
            : (session.EmailOtpHash, session.EmailOtpExpiresAt, session.EmailVerified);
        
        if (alreadyVerified)
            return new OtpValidationResult { Success = false, Error = "Ya fue verificado" };
        
        if (string.IsNullOrEmpty(otpHash))
            return new OtpValidationResult { Success = false, Error = "OTP no generado" };
        
        if (expiresAt < DateTime.UtcNow)
            return new OtpValidationResult { Success = false, Error = "OTP expirado" };
        
        // Validar hash
        var inputHash = ComputeSha256Hash(code);
        if (inputHash != otpHash)
            return new OtpValidationResult { Success = false, Error = "Código inválido" };
        
        // Marcar como verificado
        if (channel == OtpChannel.Phone)
            session.PhoneVerified = true;
        else
            session.EmailVerified = true;
        
        await _context.SaveChangesAsync();
        
        return new OtpValidationResult { Success = true };
    }
    
    private static string ComputeSha256Hash(string input)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var bytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes);
    }
}

// DTOs
public record OtpSessionResult(bool Success = false, string SessionId = null, string Error = null);
public record OtpGenerationResult(bool Success = false, string OtpCode = null, DateTime? ExpiresAt = null, string Error = null);
public record OtpValidationResult(bool Success = false, string Error = null);

// Configuración (appsettings.json)
{
  "Otp": {
    "ExpirationMinutes": 10,
    "MaxRetries": 1
  }
}

// Registro en DI
services.AddScoped<IOtpService, OtpService>();
```

**Nota crítica:** El código OTP se genera en backend SPIDI, NO en Twilio. Twilio es SOLO el canal de envío del código.

**Dependencias** (Agregar):
```markdown
- Tabla `core.registration_session` creada (ver tarea nueva DB)
- System.Security.Cryptography para SHA256 (.NET Core nativo)
- Configuración de tiempo de expiración en appsettings.json (Otp:ExpirationMinutes)
- Entity Framework DbContext configurado
- Servicio registrado en DI: IOtpService
```

**Validaciones**:
```markdown
- OTP se genera en backend SPIDI (NO Twilio)
- Hash SHA256 se almacena (NO código plain text)
- Expiración configurable (default 10 min)
- Límite de 1 reintento por canal
- Sesión válida por 24h
- Estados phone_verified/email_verified se marcan solo tras validación exitosa
- Códigos erróneos no exponen información de sesión
```

---

#### Task 198240 - [BACK] Implementar canal de envío OTP por SMS con Twilio

**Información a agregar:**

**Lógica de operación** (Flujo completo con servicio OTP):
```csharp
// Endpoint para solicitar OTP por SMS
[HttpPost("send-otp-sms")]
public async Task<IActionResult> SendOtpSms([FromBody] SendOtpRequest request)
{
    // 1. Generar OTP usando servicio reusable
    var otpResult = await _otpService.GenerateOtpAsync(request.SessionId, OtpChannel.Phone);
    
    if (!otpResult.Success)
        return BadRequest(new { error = otpResult.Error });
    
    // 2. Enviar OTP por Twilio
    try
    {
        var message = await MessageResource.CreateAsync(
            to: new PhoneNumber($"+52{request.PhoneNumber}"),
            from: new PhoneNumber(_twilioConfig.PhoneNumber),
            body: $"Tu código de verificación SPIDI es: {otpResult.OtpCode}. Válido por 10 minutos."
        );
        
        // 3. Registrar envío exitoso
        await _commLogService.LogSmsAsync(new SmsLogEntry
        {
            Type = "OTP_SMS",
            PhoneNumber = request.PhoneNumber,
            Status = "SENT",
            ExternalId = message.Sid,
            SessionId = request.SessionId
        });
        
        return Ok(new { success = true, expiresAt = otpResult.ExpiresAt });
    }
    catch (ApiException ex)
    {
        var errorMessage = ex.Code switch
        {
            21211 => "Número de teléfono inválido",
            21408 => "Error de configuración. Contacta a soporte.",
            21606 => "Este número no puede recibir SMS",
            20003 => "Error de autenticación con servicio de SMS",
            20429 => "Demasiados intentos. Intenta en 5 minutos.",
            _ => "Error al enviar SMS. Intenta nuevamente."
        };
        
        _logger.LogError(ex, "Twilio Error {Code} para {Phone}", ex.Code, request.PhoneNumber);
        
        await _commLogService.LogSmsAsync(new SmsLogEntry
        {
            Type = "OTP_SMS",
            PhoneNumber = request.PhoneNumber,
            Status = "FAILED",
            ErrorMessage = errorMessage,
            SessionId = request.SessionId
        });
        
        return BadRequest(new { error = errorMessage });
    }
}

// Endpoint para validar OTP
[HttpPost("validate-otp")]
public async Task<IActionResult> ValidateOtp([FromBody] ValidateOtpRequest request)
{
    var result = await _otpService.ValidateOtpAsync(
        request.SessionId, 
        request.Channel == "phone" ? OtpChannel.Phone : OtpChannel.Email,
        request.Code
    );
    
    if (!result.Success)
        return BadRequest(new { error = result.Error });
    
    return Ok(new { success = true, verified = true });
}
```

**IMPORTANTE:** Twilio NO gestiona OTPs. Solo envía el código generado por backend SPIDI.

**Validaciones** (Agregar):
```markdown
- OTP se genera en backend SPIDI mediante IOtpService (Task 198239)
- Twilio SOLO envía el código (no lo genera ni almacena)
- Errores de Twilio se mapean a mensajes claros para usuario
- Errores 4xx se muestran al usuario con acción sugerida
- Errores 5xx se loggean sin exponer detalles técnicos
- Rate limits (429) muestran tiempo de espera
- Todos los intentos se registran en communication_log (success y failed)
- SessionId vincula OTP generado con envío por SMS
```

**Dependencias**:
```markdown
- Servicio IOtpService implementado (Task 198239)
- Tabla registration_session con datos de sesión
- NuGet: Twilio SDK
- Configuración Twilio en appsettings.json (AccountSid, AuthToken, PhoneNumber)
- Servicio ICommunicationLogService para logging
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
- Task 198244 (endpoint de envío email OTP) implementado
- Task 198239 (IOtpService) implementado
- Estado de verificación phone debe ser true
```

---

#### Task 198244 - [BACK] Implementar canal de envío OTP por correo electrónico

**Información a agregar:**

**Descripción técnica** (Ampliar):
```markdown
Implementar endpoint que genera OTP mediante IOtpService y lo envía por email usando servicio de correo configurado (Twilio SendGrid u otro).

**IMPORTANTE:** Similar a SMS, el backend genera el OTP, NO el servicio de email.
```

**Lógica de operación** (Implementación completa):
```csharp
// Endpoint para solicitar OTP por Email
[HttpPost("send-otp-email")]
public async Task<IActionResult> SendOtpEmail([FromBody] SendOtpEmailRequest request)
{
    // 1. Generar OTP usando servicio reusable con canal Email
    var otpResult = await _otpService.GenerateOtpAsync(request.SessionId, OtpChannel.Email);
    
    if (!otpResult.Success)
        return BadRequest(new { error = otpResult.Error });
    
    // 2. Renderizar plantilla de email con código OTP
    var renderedEmail = await _emailTemplateService.RenderTemplateAsync("OTP_EMAIL", new Dictionary<string, string>
    {
        { "verificationCode", otpResult.OtpCode },
        { "expirationMinutes", "10" }
    });
    
    // 3. Enviar email
    try
    {
        var result = await _emailService.SendAsync(
            request.Email,
            renderedEmail.Subject,
            renderedEmail.BodyHtml,
            renderedEmail.BodyPlain
        );
        
        // 4. Registrar envío
        await _commLogService.LogEmailAsync(new EmailLogEntry
        {
            Type = "OTP_EMAIL",
            Email = request.Email,
            Subject = renderedEmail.Subject,
            BodyPreview = renderedEmail.BodyPlain?.Substring(0, Math.Min(200, renderedEmail.BodyPlain.Length)),
            Status = result.Success ? "SENT" : "FAILED",
            ExternalMessageId = result.MessageId,
            ErrorMessage = result.ErrorMessage,
            SessionId = request.SessionId
        });
        
        if (result.Success)
        {
            return Ok(new { success = true, expiresAt = otpResult.ExpiresAt });
        }
        else
        {
            return BadRequest(new { error = "Error al enviar email. Verifica tu correo e intenta nuevamente." });
        }
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error enviando OTP por email a {Email}", request.Email);
        
        await _commLogService.LogEmailAsync(new EmailLogEntry
        {
            Type = "OTP_EMAIL",
            Email = request.Email,
            Status = "FAILED",
            ErrorMessage = ex.Message,
            SessionId = request.SessionId
        });
        
        return StatusCode(500, new { error = "Error del servidor al enviar email" });
    }
}

// Endpoint para validar OTP (compartido con SMS, usa parámetro channel)
[HttpPost("validate-otp")]
public async Task<IActionResult> ValidateOtp([FromBody] ValidateOtpRequest request)
{
    var channel = request.Channel.ToLower() == "email" ? OtpChannel.Email : OtpChannel.Phone;
    
    var result = await _otpService.ValidateOtpAsync(
        request.SessionId, 
        channel,
        request.Code
    );
    
    if (!result.Success)
        return BadRequest(new { error = result.Error });
    
    return Ok(new { success = true, verified = true, channel = request.Channel });
}

// DTOs
public record SendOtpEmailRequest(string SessionId, string Email);
```

**IMPORTANTE:** El servicio de email (SendGrid, SMTP, etc.) SOLO envía el mensaje con el código. NO genera ni valida OTPs.

**Validaciones** (Agregar):
```markdown
- OTP se genera en backend SPIDI mediante IOtpService con OtpChannel.Email
- Servicio de email SOLO envía el mensaje (no genera OTP)
- Plantilla "OTP_EMAIL" se renderiza correctamente con tokens
- Email se envía con formato HTML + plain text fallback
- Errores del servicio de email se loggean sin exponer detalles técnicos
- Todos los intentos (exitosos/fallidos) se registran en communication_log
- SessionId vincula OTP generado con envío por email
- Validación de email usa mismo endpoint que SMS (parámetro channel diferencia)
- Rate limiting para prevenir spam de OTPs por email
```

**Dependencias** (Agregar):
```markdown
- Servicio IOtpService implementado (Task 198239)
- Tabla registration_session con campo email_otp_hash
- Servicio IEmailService configurado (Twilio SendGrid o alternativa)
- Plantilla "OTP_EMAIL" creada en tabla email_template
- Servicio IEmailTemplateService para renderizar plantilla
- Servicio ICommunicationLogService para logging
- Configuración de email service en appsettings.json
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
      const response = await fetch('/api/otp/send-otp-email', {
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
          const response = await fetch('/api/otp/validate-otp', {
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
- Task 198244 (endpoint de envío email OTP) implementado
- Task 198239 (IOtpService backend) implementado
- Estado phoneVerified debe ser true para habilitar sección
- localStorage para persistencia de estado
- Toast notifications configuradas (react-hot-toast o similar)
```

---

### HU 198207 - Guardado del Registro

#### Task 198249 - [BACK] Implementar endpoint de recepción del registro inicial

**Información a agregar:**

**Lógica de operación** (Ampliar con validación de sesión):
```markdown
El endpoint debe recibir un payload con la información del registro.

**ANTES de procesar el payload, validar:**
1. Header `X-Session-Token` contiene JWT válido o session_id válido
2. Sesión existe en `core.registration_session` y no ha expirado
3. `session.phone_verified = true`
4. `session.email_verified = true`
5. `session.phone` coincide con `payload.phoneNumber`
6. `session.email` coincide con `payload.email`

Si alguna validación falla:
```json
{
  "success": false,
  "errorCode": "VERIFICATION_INCOMPLETE",
  "message": "Debes completar la verificación de teléfono y email"
}
```

**Lógica de procesamiento:**
- Validar integridad del payload (campos obligatorios presentes)
- Mapear payload a parámetros del SP
- Invocar SP de inserción
- Procesar respuesta del SP
- Si éxito: Invocar caso de uso de envío de email bienvenida
- Si éxito: Invalidar sesión (marcar como `completed`)
- Retornar respuesta estructurada al frontend
```

**Validaciones** (Actualizar):
```markdown
- Sesión debe estar activa y verificada ANTES de permitir guardado
- No se permite guardado sin verificación completa de ambos canales
- Phone y email del payload deben coincidir con sesión verificada
- Respuesta incluye código de error específico para debugging
```

---

#### Task 198252 - [DB] Crear Stored Procedure para inserción del registro inicial

**Información a agregar:**

**Descripción técnica** (Reemplazar con especificación completa):
```markdown
Desarrollar el Stored Procedure que inserte la información del aspirante en `core.applicant`.

**Especificación del SP:**

```sql
CREATE PROCEDURE core.sp_insert_applicant
    -- Parámetros de entrada
    @firstName NVARCHAR(100),
    @lastName NVARCHAR(150),
    @phone VARCHAR(10),
    @email NVARCHAR(255),
    @vehicleMake NVARCHAR(30),
    @vehicleModel NVARCHAR(50),
    @vehicleYear VARCHAR(4),
    @vehiclePlates VARCHAR(10),
    @vehicleColor NVARCHAR(30),
    @workStateId BIGINT = NULL,
    @workStateName NVARCHAR(30),
    @workCityId BIGINT = NULL,
    @workCityName NVARCHAR(50),
    
    -- Parámetros de salida
    @result INT OUTPUT,              -- 1=success, 0=fail
    @applicantId BIGINT OUTPUT,      -- ID generado
    @errorCode NVARCHAR(50) OUTPUT,  -- Código de error
    @errorMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validación adicional de duplicidad (safety check)
        IF EXISTS (SELECT 1 FROM core.applicant WHERE phone = @phone)
        BEGIN
            SET @result = 0;
            SET @errorCode = 'DUPLICATE_PHONE';
            SET @errorMessage = 'El teléfono ya está registrado';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF EXISTS (SELECT 1 FROM core.applicant WHERE LOWER(email) = LOWER(@email))
        BEGIN
            SET @result = 0;
            SET @errorCode = 'DUPLICATE_EMAIL';
            SET @errorMessage = 'El email ya está registrado';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Inserción
        INSERT INTO core.applicant (
            first_name, last_name, phone, email,
            vehicle_make, vehicle_model, vehicle_year, vehicle_plates, vehicle_color,
            work_state_id, state, work_city_id, city,
            status, created_at, updated_at
        )
        VALUES (
            @firstName, @lastName, @phone, LOWER(@email),
            @vehicleMake, @vehicleModel, @vehicleYear, @vehiclePlates, @vehicleColor,
            @workStateId, @workStateName, @workCityId, @workCityName,
            'Pendiente', GETUTCDATE(), GETUTCDATE()
        );
        
        SET @applicantId = SCOPE_IDENTITY();
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
            SET @errorCode = 'DUPLICATE_ENTRY';
            SET @errorMessage = 'El teléfono o email ya están registrados';
        END
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
- Insertar registro en `core.applicant` con estatus inicial 'Pendiente'
- Generar y retornar `applicant_id` mediante `SCOPE_IDENTITY()`
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
| firstName           | @firstName         | first_name         | nvarchar(100) | Obligatorio                      |
| lastName            | @lastName          | last_name          | nvarchar(150) | Obligatorio                      |
| phoneNumber         | @phone             | phone              | varchar(10)   | Obligatorio, 10 dígitos          |
| email               | @email             | email              | nvarchar(255) | Obligatorio, lowercase en BD     |
| vehicleBrand        | @vehicleMake       | vehicle_make       | nvarchar(30)  | Obligatorio                      |
| vehicleModel        | @vehicleModel      | vehicle_model      | nvarchar(50)  | Obligatorio                      |
| vehicleYear         | @vehicleYear       | vehicle_year       | varchar(4)    | Obligatorio, formato YYYY        |
| vehiclePlates       | @vehiclePlates     | vehicle_plates     | varchar(10)   | Obligatorio                      |
| vehicleColor        | @vehicleColor      | vehicle_color      | nvarchar(30)  | Obligatorio                      |
| workStateId         | @workStateId       | work_state_id      | bigint        | Opcional, si catálogo por ID     |
| workStateName       | @workStateName     | state              | nvarchar(30)  | Obligatorio                      |
| workCityId          | @workCityId        | work_city_id       | bigint        | Opcional, si catálogo por ID     |
| workCityName        | @workCityName      | city               | nvarchar(50)  | Obligatorio                      |
| N/A (sistema)       | N/A                | status             | varchar(30)   | Default 'Pendiente' (RN06)       |
| N/A (sistema)       | N/A                | created_at         | timestamptz   | Default GETUTCDATE()             |
| N/A (sistema)       | N/A                | updated_at         | timestamptz   | Default GETUTCDATE()             |

**Nota importante:**
- Los campos `phoneVerified` y `emailVerified` del payload NO se persisten en `core.applicant`
- La verificación se valida en `core.registration_session` antes de invocar el SP
- El estado 'Pendiente' se asigna automáticamente en BD
```

---

### HU 198212 - Mensaje de Bienvenida

#### Task 198260 - [BACK] Implementar persistencia de bitácora de error de envío

**Información a agregar:**

**Descripción técnica** (Especificar uso de tabla):
```markdown
Implementar en backend la invocación del mecanismo de base de datos para guardar bitácora de intentos de envío de email (exitosos y fallidos).

**Tabla a utilizar:** `core.email_log` (ver tarea nueva de creación de tabla)
```

**Lógica de operación** (Ampliar):
```markdown
Cuando se intenta enviar email de bienvenida, el backend debe registrar:

**Para intentos EXITOSOS:**
```csharp
await _emailLogService.LogEmail(new EmailLogEntry {
    RecipientEmail = applicant.Email,
    EmailType = "WELCOME",
    Subject = emailSubject,
    BodyPreview = emailBody.Substring(0, Math.Min(500, emailBody.Length)),
    Status = "SENT",
    ApplicantId = applicant.Id,
    SentAt = DateTime.UtcNow
});
```

**Para intentos FALLIDOS:**
```csharp
await _emailLogService.LogEmail(new EmailLogEntry {
    RecipientEmail = applicant.Email,
    EmailType = "WELCOME",
    Subject = emailSubject,
    BodyPreview = emailBody.Substring(0, Math.Min(500, emailBody.Length)),
    Status = "FAILED",
    ErrorMessage = exception.Message,
    RetryCount = retryAttempt,
    ApplicantId = applicant.Id,
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

#### [BACK] Crear endpoint de prevalidación de duplicidad

**Objetivo funcional**:
Permitir validar si teléfono o email ya están registrados ANTES de iniciar proceso de verificación OTP.

**Descripción técnica**:
Endpoint que verifica existencia de aspirante con teléfono o email dado.

**Lógica de operación**:
```csharp
// Controller
[HttpPost("check-duplicate")]
public async Task<IActionResult> CheckDuplicate([FromBody] CheckDuplicateRequest request)
{
    var result = await _applicantService.CheckDuplicate(request.Phone, request.Email);
    
    if (result.IsDuplicate)
    {
        return Ok(new {
            isDuplicate = true,
            duplicatedFields = result.DuplicatedFields,
            message = result.Message
        });
    }
    
    return Ok(new {
        isDuplicate = false,
        duplicatedFields = new string[] {},
        message = "Datos disponibles para registrarse"
    });
}

// Service
public async Task<DuplicateCheckResult> CheckDuplicate(string phone, string email)
{
    var duplicatedFields = new List<string>();
    
    // Verificar teléfono
    var phoneExists = await _context.Applicants
        .AnyAsync(a => a.Phone == phone);
    
    if (phoneExists)
        duplicatedFields.Add("phone");
    
    // Verificar email
    var emailExists = await _context.Applicants
        .AnyAsync(a => a.Email.ToLower() == email.ToLower());
    
    if (emailExists)
        duplicatedFields.Add("email");
    
    var message = duplicatedFields.Count switch {
        0 => "Datos disponibles",
        1 => duplicatedFields[0] == "phone" 
            ? "El teléfono ya está registrado. Si necesitas ayuda, contacta a soporte."
            : "El email ya está registrado. Si necesitas ayuda, contacta a soporte.",
        _ => "El teléfono y email ya están registrados. Contacta a soporte si necesitas ayuda."
    };
    
    return new DuplicateCheckResult {
        IsDuplicate = duplicatedFields.Any(),
        DuplicatedFields = duplicatedFields,
        Message = message
    };
}
```

**Request:**
```json
POST /api/applicants/check-duplicate
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
  "message": "Datos disponibles para registrarse"
}
```

**Response (con duplicado):**
```json
{
  "isDuplicate": true,
  "duplicatedFields": ["phone"],
  "message": "El teléfono ya está registrado. Si necesitas ayuda, contacta a soporte."
}
```

**Dependencias**:
- Tabla `core.applicant` con índices en `phone` y `email`
- Endpoint debe ejecutarse ANTES de mostrar sección de verificación OTP

**Validaciones**:
- Detecta correctamente duplicados de phone (exacto)
- Detecta correctamente duplicados de email (case-insensitive)
- Retorna campos duplicados específicos
- Mensaje claro orienta al usuario a soporte
- No expone información sensible de registros existentes

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

#### [DB] Crear tabla de plantillas de email

**Objetivo funcional**:
Almacenar plantillas de correos electrónicos con contenido parametrizable para OTP y bienvenida.

**Descripción técnica**:
Crear tabla para gestión de plantillas de email sin necesidad de deploy para cambios de contenido.

**Lógica de operación**:
```sql
CREATE TABLE core.email_template (
    -- Identificación
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,            -- WELCOME, OTP_EMAIL, etc.
    name NVARCHAR(100) NOT NULL,
    
    -- Contenido
    subject NVARCHAR(255) NOT NULL,              -- Puede incluir tokens: "{{firstName}}, bienvenido a SPIDI"
    body_html TEXT NOT NULL,                     -- HTML con tokens
    body_plain TEXT,                             -- Texto plano fallback
    
    -- Variables disponibles (para documentación)
    available_tokens JSONB,                      -- ["firstName", "verificationCode", "expirationMinutes"]
    
    -- Control
    active BOOLEAN NOT NULL DEFAULT true,
    version SMALLINT NOT NULL DEFAULT 1,         -- Para versionado de plantillas
    
    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by NVARCHAR(100),
    updated_by NVARCHAR(100)
);

-- Índice
CREATE INDEX ix_email_template_code ON core.email_template(code);
CREATE INDEX ix_email_template_active ON core.email_template(active);

-- Plantilla inicial: Email de Bienvenida
INSERT INTO core.email_template (code, name, subject, body_html, body_plain, available_tokens)
VALUES (
    'WELCOME',
    'Correo de Bienvenida',
    '¡Bienvenido a SPIDI, {{firstName}}!',
    '<html>
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
    'Hola {{firstName}},

Gracias por registrarte en SPIDI. Tu solicitud ha sido recibida exitosamente.

Próximos pasos:
1. Revisaremos tu información en las próximas 24-48 horas
2. Validaremos tus documentos y antecedentes
3. Te contactaremos con los siguientes pasos

El proceso toma entre 5-7 días hábiles.

Si tienes preguntas, contáctanos en soporte@spidi.com.mx

© 2026 SPIDI Inc.',
    '["firstName"]'::jsonb
);

-- Plantilla inicial: OTP Email
INSERT INTO core.email_template (code, name, subject, body_html, body_plain, available_tokens)
VALUES (
    'OTP_EMAIL',
    'Código de Verificación por Email',
    'Tu código de verificación SPIDI',
    '<html>
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
    'Tu código de verificación SPIDI: {{verificationCode}}

Este código es válido por {{expirationMinutes}} minutos.

Si no solicitaste este código, ignora este mensaje.',
    '["verificationCode", "expirationMinutes"]'::jsonb
);
```

**Dependencias**:
- Modelo de datos SPIDI
- Servicio backend que procese tokens ({{variable}})

**Validaciones**:
- Plantillas incluyen tokens documentados en `available_tokens`
- HTML es responsivo y se visualiza correctamente en clientes de email
- Versión plain text existe como fallback
- Plantillas pueden actualizarse sin deploy (UPDATE en BD)
- Campo `version` permite rollback si es necesario

---

#### [BACK] Crear servicio de renderizado de plantillas de email

**Objetivo funcional**:
Procesar plantillas de email sustituyendo tokens por valores reales.

**Descripción técnica**:
Servicio que obtiene plantilla de BD y reemplaza tokens dinámicos.

**Lógica de operación**:
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
- **[DB]**: 3 tareas obligatorias (registration_session, communication_log, email_template) + 1 condicional (state/city solo si Cart Services no disponible)
- **[BACK]**: 7 tareas (endpoints, servicios, jobs)
- **[FRONT]**: 2 tareas (limpieza sesión, recuperación sesión)
- **[INTEGRACION]**: 2 tareas (Cart Services transformadores, Twilio SendGrid)

### Total: 14 tareas nuevas obligatorias + 1 condicional + 13 tareas a refinar

**Nota**: La tarea de crear tablas `state/city` solo se ejecuta si Cart Services NO está disponible. La solución primaria usa endpoints transformadores.

---

## PRIORIZACIÓN SUGERIDA

### 🔴 **Prioridad 1 - Bloqueantes para MVP** (Debe completarse antes de iniciar desarrollo):
1. [DB] Crear tabla `registration_session`
2. [DB] Crear tabla `communication_log`
3. [DB] Crear tabla `email_template`
4. [BACK] Crear endpoint de prevalidación de duplicidad
5. [INTEGRACION] Crear endpoints transformadores de catálogo geográfico (desde Cart Services)
6. [INTEGRACION] Configurar Twilio SendGrid
7. Refinar Task 198237 (confirmar Cart Services como solución)
8. Refinar Task 198239 (definir mecanismo de sesión)
9. Refinar Task 198252 (especificar SP completo)

### 🟡 **Prioridad 2 - Necesarias para calidad** (Implementar durante desarrollo):
10. [BACK] Crear servicio de logging de comunicaciones
11. [BACK] Crear servicio de renderizado de plantillas
12. [BACK] Crear job de reintento de emails
13. [FRONT] Implementar limpieza de sesión
14. [FRONT] Implementar recuperación de sesión
15. Refinar Task 198234 (agregar prevalidación)
16. Refinar Task 198240 (manejo errores Twilio SMS)
17. Refinar Task 198243 (implementar verificación email OTP)
18. Refinar Task 198244 (canal de envío OTP email)
19. Refinar Task 198245 (validación OTP email y reenvío)
20. Refinar Task 198249 (validación de sesión)
21. Refinar Task 198260 (usar tabla de log)
22. Refinar Task 198261 (documentar mapeo completo)

### 🟢 **Prioridad 3 - Plan B / Contingencia** (Solo si solución primaria no es viable):
23. [DB] Crear tablas `state` y `city` (SOLO si Cart Services no está disponible en producción)

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

**PENDIENTES DE VALIDACIÓN:**
1. Confirmar servicio de email (Twilio SendGrid, SMTP, otro)
2. Obtener credenciales y API keys necesarias
3. Confirmar dominio `spidi.com.mx` verificado para envío de emails
4. Definir política de retención de logs operacionales
5. **Obtener bearer token de Cart Services para ambiente DEV/QA/PROD** (consultar con equipo Cart Services o Azure Key Vault)
