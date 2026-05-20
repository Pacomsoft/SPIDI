import type { ITrainingRepository } from '../../domain/contracts/training-repository.interface';
import type {
  ITrainingListItemDTO,
  ITrainingDetailDTO,
  ICreateTrainingDTO,
  IUpdateTrainingDTO,
  ISendTrainingDTO,
  ITrainingProgressDTO,
  ITrainingFiltersDTO,
} from '../../domain/contracts/training.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IToastContext } from '@/modules/shared/domain/contracts/toast.interface';
import * as XLSX from 'xlsx';

const MOCK_TRAININGS: ITrainingDetailDTO[] = [
  {
    trainingId: 'TRN-001',
    title: 'Protocolo de seguridad en entregas',
    trainingType: 'Mandatory',
    content: '<p>Este módulo cubre los protocolos esenciales de seguridad que todo repartidor debe conocer antes de iniciar operaciones.</p><p>Incluye manejo de mercancía frágil, identificación de zonas de riesgo y comunicación con el centro de operaciones en caso de incidencia.</p>',
    documentUrl: 'https://storage.example.com/docs/protocolo-seguridad.pdf',
    hasQuiz: true,
    questions: [
      {
        questionIndex: 0,
        questionText: '¿Cuál es la primera acción ante un accidente de tráfico durante una entrega?',
        options: [
          { optionIndex: 0, text: 'Continuar la entrega y reportar después' },
          { optionIndex: 1, text: 'Llamar al número de emergencias y notificar a operaciones' },
          { optionIndex: 2, text: 'Abandonar el vehículo y esperar ayuda' },
          { optionIndex: 3, text: 'Contactar al cliente del pedido' },
          { optionIndex: 4, text: 'Fotografiar la escena y continuar' },
        ],
        correctOption: 1,
      },
      {
        questionIndex: 1,
        questionText: '¿Qué equipo de protección es obligatorio al transportar productos refrigerados?',
        options: [
          { optionIndex: 0, text: 'Guantes térmicos únicamente' },
          { optionIndex: 1, text: 'Ninguno, el contenedor es suficiente' },
          { optionIndex: 2, text: 'Guantes térmicos y contenedor isotérmico certificado' },
          { optionIndex: 3, text: 'Sólo el contenedor isotérmico' },
          { optionIndex: 4, text: 'Mascarilla y guantes de látex' },
        ],
        correctOption: 2,
      },
      {
        questionIndex: 2,
        questionText: '¿Con qué frecuencia debe verificarse el estado del vehículo antes de iniciar turno?',
        options: [
          { optionIndex: 0, text: 'Una vez por semana' },
          { optionIndex: 1, text: 'Cada vez antes de iniciar el turno' },
          { optionIndex: 2, text: 'Una vez al mes' },
          { optionIndex: 3, text: 'Solo cuando hay fallas visibles' },
          { optionIndex: 4, text: 'Al inicio de cada mes' },
        ],
        correctOption: 1,
      },
      {
        questionIndex: 3,
        questionText: '¿Qué documento debe portarse siempre durante las entregas?',
        options: [
          { optionIndex: 0, text: 'Solo el teléfono con la aplicación' },
          { optionIndex: 1, text: 'Licencia de conducir, tarjeta de circulación y póliza de seguro' },
          { optionIndex: 2, text: 'Únicamente la licencia de conducir' },
          { optionIndex: 3, text: 'Credencial de empleado' },
          { optionIndex: 4, text: 'Comprobante de domicilio' },
        ],
        correctOption: 1,
      },
      {
        questionIndex: 4,
        questionText: '¿Cuál es el tiempo máximo de espera en punto de recolección antes de cancelar el servicio?',
        options: [
          { optionIndex: 0, text: '5 minutos' },
          { optionIndex: 1, text: '30 minutos' },
          { optionIndex: 2, text: '10 minutos según protocolo estándar' },
          { optionIndex: 3, text: '20 minutos' },
          { optionIndex: 4, text: 'No hay límite de tiempo' },
        ],
        correctOption: 2,
      },
    ],
    minimumScore: 80,
    createdBy: 'admin@spidi.mx',
    createdAt: '2025-01-10T09:00:00.000Z',
    isOnboarding: true,
  },
  {
    trainingId: 'TRN-002',
    title: 'Uso correcto de la aplicación SPIDI',
    trainingType: 'Mandatory',
    content: '<p>Guía completa sobre el uso de la aplicación móvil SPIDI para repartidores.</p><p>Aprende a aceptar pedidos, marcar estatus, reportar incidencias y gestionar tu perfil desde la app.</p>',
    hasQuiz: true,
    questions: [
      {
        questionIndex: 0,
        questionText: '¿Cómo se marca un pedido como entregado en la aplicación?',
        options: [
          { optionIndex: 0, text: 'Llamando al soporte' },
          { optionIndex: 1, text: 'Presionando "Confirmar entrega" y tomando foto de evidencia' },
          { optionIndex: 2, text: 'Enviando mensaje al cliente' },
          { optionIndex: 3, text: 'Cerrando la aplicación' },
          { optionIndex: 4, text: 'Esperando confirmación automática' },
        ],
        correctOption: 1,
      },
      {
        questionIndex: 1,
        questionText: '¿Qué hacer si la aplicación no carga al iniciar turno?',
        options: [
          { optionIndex: 0, text: 'No trabajar ese día' },
          { optionIndex: 1, text: 'Reiniciar la app; si persiste, contactar soporte técnico' },
          { optionIndex: 2, text: 'Reinstalar sin avisar' },
          { optionIndex: 3, text: 'Usar versión web sin reportar' },
          { optionIndex: 4, text: 'Esperar hasta el día siguiente' },
        ],
        correctOption: 1,
      },
      {
        questionIndex: 2,
        questionText: '¿Cuál es el proceso para reportar una incidencia en la aplicación?',
        options: [
          { optionIndex: 0, text: 'Menú > Soporte > Nueva incidencia > Descripción + foto' },
          { optionIndex: 1, text: 'Llamar al supervisor directamente' },
          { optionIndex: 2, text: 'Enviar correo a soporte' },
          { optionIndex: 3, text: 'Publicar en el grupo de WhatsApp' },
          { optionIndex: 4, text: 'No hay proceso, solo continuar' },
        ],
        correctOption: 0,
      },
      {
        questionIndex: 3,
        questionText: '¿Con qué frecuencia debe actualizarse la aplicación?',
        options: [
          { optionIndex: 0, text: 'Nunca, la versión instalada es suficiente' },
          { optionIndex: 1, text: 'Cada vez que el sistema notifique una actualización disponible' },
          { optionIndex: 2, text: 'Una vez al año' },
          { optionIndex: 3, text: 'Solo si hay problemas' },
          { optionIndex: 4, text: 'Cada seis meses' },
        ],
        correctOption: 1,
      },
      {
        questionIndex: 4,
        questionText: '¿Qué información NO debe compartirse desde la aplicación?',
        options: [
          { optionIndex: 0, text: 'Estatus del pedido' },
          { optionIndex: 1, text: 'Ubicación del vehículo' },
          { optionIndex: 2, text: 'Datos personales del cliente a terceros' },
          { optionIndex: 3, text: 'Tiempo estimado de llegada' },
          { optionIndex: 4, text: 'Número de pedido' },
        ],
        correctOption: 2,
      },
    ],
    minimumScore: 75,
    createdBy: 'admin@spidi.mx',
    createdAt: '2025-01-15T10:30:00.000Z',
  },
  {
    trainingId: 'TRN-003',
    title: 'Atención al cliente en última milla',
    trainingType: 'Optional',
    content: '<p>Técnicas de comunicación efectiva con el cliente durante el proceso de entrega.</p><p>Este módulo aborda desde el saludo inicial hasta la resolución de quejas en campo, mejorando la experiencia del usuario final.</p>',
    hasQuiz: false,
    createdBy: 'capacitacion@spidi.mx',
    createdAt: '2025-02-01T08:00:00.000Z',
  },
  {
    trainingId: 'TRN-004',
    title: 'Manejo defensivo y conducción segura',
    trainingType: 'Mandatory',
    content: '<p>Principios del manejo defensivo aplicados a la distribución de última milla en zonas urbanas de alta densidad.</p><p>Incluye técnicas de anticipación, gestión del espacio y procedimientos ante condiciones climáticas adversas.</p>',
    documentUrl: 'https://storage.example.com/docs/manejo-defensivo.pdf',
    hasQuiz: true,
    questions: [
      {
        questionIndex: 0,
        questionText: '¿Cuál es la distancia de seguimiento segura a velocidad de 60 km/h en zona urbana?',
        options: [
          { optionIndex: 0, text: '1 segundo de distancia' },
          { optionIndex: 1, text: '2 segundos de distancia' },
          { optionIndex: 2, text: 'Al menos 3 segundos de distancia' },
          { optionIndex: 3, text: '5 metros fijos' },
          { optionIndex: 4, text: 'Depende del tipo de vehículo adelante' },
        ],
        correctOption: 2,
      },
      {
        questionIndex: 1,
        questionText: '¿Qué acción prioritaria tomar al detectar lluvia intensa durante una entrega?',
        options: [
          { optionIndex: 0, text: 'Acelerar para terminar la entrega rápido' },
          { optionIndex: 1, text: 'Reducir velocidad, encender luces y aumentar distancia de seguimiento' },
          { optionIndex: 2, text: 'Continuar al mismo ritmo' },
          { optionIndex: 3, text: 'Detenerse indefinidamente' },
          { optionIndex: 4, text: 'Llamar al cliente para cancelar' },
        ],
        correctOption: 1,
      },
      {
        questionIndex: 2,
        questionText: '¿Cuándo es obligatorio usar los espejos retrovisores?',
        options: [
          { optionIndex: 0, text: 'Solo al reversa' },
          { optionIndex: 1, text: 'Cada 5-8 segundos durante la conducción normal' },
          { optionIndex: 2, text: 'Solo en autopista' },
          { optionIndex: 3, text: 'Solo al cambiar de carril' },
          { optionIndex: 4, text: 'Únicamente cuando se detecta tráfico' },
        ],
        correctOption: 1,
      },
      {
        questionIndex: 3,
        questionText: '¿Qué es el punto ciego en un vehículo?',
        options: [
          { optionIndex: 0, text: 'La parte delantera del cofre' },
          { optionIndex: 1, text: 'El área no visible por espejos ni visión directa del conductor' },
          { optionIndex: 2, text: 'La zona trasera del vehículo' },
          { optionIndex: 3, text: 'El área cubierta por el parabrisas' },
          { optionIndex: 4, text: 'El espacio entre los asientos' },
        ],
        correctOption: 1,
      },
      {
        questionIndex: 4,
        questionText: '¿Cuál es la velocidad máxima permitida en zonas escolares durante horario activo?',
        options: [
          { optionIndex: 0, text: '40 km/h' },
          { optionIndex: 1, text: '60 km/h' },
          { optionIndex: 2, text: '20 km/h' },
          { optionIndex: 3, text: '30 km/h según señalización vigente' },
          { optionIndex: 4, text: '10 km/h' },
        ],
        correctOption: 3,
      },
    ],
    minimumScore: 85,
    createdBy: 'admin@spidi.mx',
    createdAt: '2025-02-10T11:00:00.000Z',
  },
  {
    trainingId: 'TRN-005',
    title: 'Política de privacidad y manejo de datos',
    trainingType: 'CompanyPolicy',
    content: '<p>Política interna de SPIDI sobre el manejo de datos personales de clientes y repartidores, conforme a la Ley Federal de Protección de Datos Personales.</p><p>Todo el personal operativo debe completar este módulo antes de acceder a información de clientes en la plataforma.</p>',
    documentUrl: 'https://storage.example.com/docs/politica-privacidad.pdf',
    hasQuiz: false,
    createdBy: 'legal@spidi.mx',
    createdAt: '2025-02-20T09:00:00.000Z',
  },
  {
    trainingId: 'TRN-006',
    title: 'Optimización de rutas con la herramienta de navegación',
    trainingType: 'Optional',
    content: '<p>Aprende a utilizar las funcionalidades avanzadas de navegación de la app SPIDI para optimizar tus rutas de entrega.</p><p>Reducción de tiempos de trayecto, gestión de múltiples paradas y uso del modo offline.</p>',
    hasQuiz: false,
    createdBy: 'capacitacion@spidi.mx',
    createdAt: '2025-03-01T10:00:00.000Z',
  },
  {
    trainingId: 'TRN-007',
    title: 'Código de conducta y ética laboral',
    trainingType: 'CompanyPolicy',
    content: '<p>Normas de comportamiento y ética que rigen la relación entre repartidores, clientes y la empresa SPIDI.</p><p>Incluye política de tolerancia cero al acoso, procedimiento de denuncia y derechos del trabajador.</p>',
    documentUrl: 'https://storage.example.com/docs/codigo-conducta.pdf',
    hasQuiz: false,
    createdBy: 'rrhh@spidi.mx',
    createdAt: '2025-03-05T09:00:00.000Z',
  },
  {
    trainingId: 'TRN-008',
    title: 'Primeros auxilios básicos en campo',
    trainingType: 'Mandatory',
    content: '<p>Módulo de primeros auxilios orientado a situaciones comunes en el trabajo de reparto: caídas, golpes, quemaduras y atención básica en accidentes de tráfico.</p>',
    documentUrl: 'https://storage.example.com/docs/primeros-auxilios.pdf',
    hasQuiz: true,
    questions: [
      {
        questionIndex: 0,
        questionText: '¿Cuál es el primer paso ante una persona inconsciente sin respiración?',
        options: [
          { optionIndex: 0, text: 'Darle agua' },
          { optionIndex: 1, text: 'Llamar al 911 e iniciar RCP si está capacitado' },
          { optionIndex: 2, text: 'Moverla a otro lugar' },
          { optionIndex: 3, text: 'Esperar a que despierte' },
          { optionIndex: 4, text: 'Sacudirla fuertemente' },
        ],
        correctOption: 1,
      },
      {
        questionIndex: 1,
        questionText: '¿Cómo controlar una hemorragia leve en campo?',
        options: [
          { optionIndex: 0, text: 'Aplicar torniquete inmediatamente' },
          { optionIndex: 1, text: 'Presión directa con paño limpio durante 10-15 minutos' },
          { optionIndex: 2, text: 'Lavar con agua caliente' },
          { optionIndex: 3, text: 'Dejar que la sangre drene' },
          { optionIndex: 4, text: 'Aplicar alcohol directamente' },
        ],
        correctOption: 1,
      },
      {
        questionIndex: 2,
        questionText: '¿Qué NO debe hacerse ante una quemadura de primer grado?',
        options: [
          { optionIndex: 0, text: 'Aplicar agua fría corriente' },
          { optionIndex: 1, text: 'Cubrir con apósito estéril' },
          { optionIndex: 2, text: 'Aplicar hielo directamente sobre la quemadura' },
          { optionIndex: 3, text: 'Retirar la fuente de calor' },
          { optionIndex: 4, text: 'Acudir a atención médica si persiste' },
        ],
        correctOption: 2,
      },
      {
        questionIndex: 3,
        questionText: '¿A qué número llamar en caso de emergencia médica en México?',
        options: [
          { optionIndex: 0, text: '060' },
          { optionIndex: 1, text: '100' },
          { optionIndex: 2, text: '911' },
          { optionIndex: 3, text: '800' },
          { optionIndex: 4, text: '055' },
        ],
        correctOption: 2,
      },
      {
        questionIndex: 4,
        questionText: '¿Qué elemento del botiquín básico se usa para limpiar heridas superficiales?',
        options: [
          { optionIndex: 0, text: 'Alcohol al 96%' },
          { optionIndex: 1, text: 'Agua oxigenada al 3% o solución salina' },
          { optionIndex: 2, text: 'Acetona' },
          { optionIndex: 3, text: 'Cloro diluido' },
          { optionIndex: 4, text: 'Alcohol en gel' },
        ],
        correctOption: 1,
      },
    ],
    minimumScore: 80,
    createdBy: 'admin@spidi.mx',
    createdAt: '2025-03-15T08:00:00.000Z',
  },
  {
    trainingId: 'TRN-009',
    title: 'Gestión de incidencias y devoluciones',
    trainingType: 'Mandatory',
    content: '<p>Procedimientos para gestionar pedidos con problemas: paquetes dañados, entregas fallidas y devoluciones al almacén.</p><p>Incluye el flujo de documentación y tiempos de respuesta esperados.</p>',
    hasQuiz: false,
    createdBy: 'operaciones@spidi.mx',
    createdAt: '2025-03-20T09:30:00.000Z',
  },
  {
    trainingId: 'TRN-010',
    title: 'Beneficios y prestaciones del repartidor SPIDI',
    trainingType: 'Optional',
    content: '<p>Conoce todos los beneficios disponibles para repartidores activos: seguro de accidentes, fondo de ahorro, descuentos en plataformas aliadas y programa de reconocimiento mensual.</p>',
    hasQuiz: false,
    createdBy: 'rrhh@spidi.mx',
    createdAt: '2025-04-01T10:00:00.000Z',
  },
  {
    trainingId: 'TRN-011',
    title: 'Manejo de efectivo y pagos en punto de entrega',
    trainingType: 'Mandatory',
    content: '<p>Procedimientos para el manejo de cobros en efectivo, terminales POS portátiles y recibos digitales durante las entregas que requieren pago al momento.</p>',
    hasQuiz: true,
    questions: [
      {
        questionIndex: 0,
        questionText: '¿Qué hacer si el cliente no tiene cambio exacto para el pago en efectivo?',
        options: [
          { optionIndex: 0, text: 'Cancelar la entrega' },
          { optionIndex: 1, text: 'Ofrecer cobro con terminal o registrar diferencia según protocolo' },
          { optionIndex: 2, text: 'Dejar el pedido sin cobrar' },
          { optionIndex: 3, text: 'Llamar al supervisor inmediatamente' },
          { optionIndex: 4, text: 'Redondear a favor del repartidor' },
        ],
        correctOption: 1,
      },
      {
        questionIndex: 1,
        questionText: '¿Cada cuánto tiempo debe liquidarse el efectivo recolectado?',
        options: [
          { optionIndex: 0, text: 'Al final de la semana' },
          { optionIndex: 1, text: 'Al final de cada turno según política operativa' },
          { optionIndex: 2, text: 'Al final del mes' },
          { optionIndex: 3, text: 'Cuando acumule más de $500' },
          { optionIndex: 4, text: 'Nunca, se descuenta del saldo' },
        ],
        correctOption: 1,
      },
      {
        questionIndex: 2,
        questionText: '¿Qué comprobante debe entregarse al cliente tras un pago en efectivo?',
        options: [
          { optionIndex: 0, text: 'Ninguno es necesario' },
          { optionIndex: 1, text: 'Recibo digital enviado por la aplicación al correo del cliente' },
          { optionIndex: 2, text: 'Nota manuscrita' },
          { optionIndex: 3, text: 'Solo el número de pedido verbal' },
          { optionIndex: 4, text: 'Foto del pago' },
        ],
        correctOption: 1,
      },
      {
        questionIndex: 3,
        questionText: '¿Qué hacer si la terminal POS no conecta durante la entrega?',
        options: [
          { optionIndex: 0, text: 'Dejar el pedido y retirarse' },
          { optionIndex: 1, text: 'Intentar pago en efectivo o reprogramar según guía de contingencia' },
          { optionIndex: 2, text: 'Cobrar el doble en el siguiente pedido' },
          { optionIndex: 3, text: 'Ignorar el cobro y marcar como entregado' },
          { optionIndex: 4, text: 'Llamar al cliente de la siguiente entrega' },
        ],
        correctOption: 1,
      },
      {
        questionIndex: 4,
        questionText: '¿Cuál es la política ante un faltante de efectivo al liquidar?',
        options: [
          { optionIndex: 0, text: 'Se descuenta automáticamente sin aviso' },
          { optionIndex: 1, text: 'Se levanta reporte, se investiga y se aplica procedimiento disciplinario si aplica' },
          { optionIndex: 2, text: 'El supervisor lo cubre sin consecuencias' },
          { optionIndex: 3, text: 'Se ignora si es menor a $50' },
          { optionIndex: 4, text: 'Se transfiere la deuda al siguiente turno' },
        ],
        correctOption: 1,
      },
    ],
    minimumScore: 80,
    createdBy: 'finanzas@spidi.mx',
    createdAt: '2025-04-10T09:00:00.000Z',
  },
  {
    trainingId: 'TRN-012',
    title: 'Política de uso de vehículo de empresa',
    trainingType: 'CompanyPolicy',
    content: '<p>Normas para el uso, mantenimiento preventivo y reporte de daños de vehículos asignados por SPIDI.</p><p>Incluye prohibiciones, responsabilidades del repartidor y proceso de asignación de unidades de sustitución.</p>',
    documentUrl: 'https://storage.example.com/docs/politica-vehiculos.pdf',
    hasQuiz: false,
    createdBy: 'flota@spidi.mx',
    createdAt: '2025-04-15T10:00:00.000Z',
  },
];

const MOCK_PROGRESS: ITrainingProgressDTO[] = [
  { progressId: 'PRG-001', trainingId: 'TRN-001', driverName: 'Carlos Mendoza López', driverId: 'DRV-001', answersCount: 5, correctAnswers: 5, responseDate: '2025-02-01T14:30:00.000Z' },
  { progressId: 'PRG-002', trainingId: 'TRN-001', driverName: 'Ana García Ruiz', driverId: 'DRV-002', answersCount: 5, correctAnswers: 4, responseDate: '2025-02-02T09:15:00.000Z' },
  { progressId: 'PRG-003', trainingId: 'TRN-001', driverName: 'Roberto Sánchez Torres', driverId: 'DRV-003', answersCount: 5, correctAnswers: 3, responseDate: '2025-02-03T11:00:00.000Z' },
  { progressId: 'PRG-004', trainingId: 'TRN-001', driverName: 'María Flores Hernández', driverId: 'DRV-004', answersCount: 5, correctAnswers: 5, responseDate: '2025-02-04T16:45:00.000Z' },
  { progressId: 'PRG-005', trainingId: 'TRN-002', driverName: 'Carlos Mendoza López', driverId: 'DRV-001', answersCount: 5, correctAnswers: 4, responseDate: '2025-02-10T10:00:00.000Z' },
  { progressId: 'PRG-006', trainingId: 'TRN-002', driverName: 'Luis Ramírez Vega', driverId: 'DRV-005', answersCount: 5, correctAnswers: 5, responseDate: '2025-02-11T13:30:00.000Z' },
  { progressId: 'PRG-007', trainingId: 'TRN-004', driverName: 'Ana García Ruiz', driverId: 'DRV-002', answersCount: 5, correctAnswers: 5, responseDate: '2025-03-01T08:30:00.000Z' },
  { progressId: 'PRG-008', trainingId: 'TRN-004', driverName: 'Roberto Sánchez Torres', driverId: 'DRV-003', answersCount: 5, correctAnswers: 4, responseDate: '2025-03-02T12:00:00.000Z' },
  { progressId: 'PRG-009', trainingId: 'TRN-004', driverName: 'Jorge Pérez Castro', driverId: 'DRV-006', answersCount: 5, correctAnswers: 3, responseDate: '2025-03-03T15:00:00.000Z' },
  { progressId: 'PRG-010', trainingId: 'TRN-008', driverName: 'María Flores Hernández', driverId: 'DRV-004', answersCount: 5, correctAnswers: 5, responseDate: '2025-04-01T09:00:00.000Z' },
  { progressId: 'PRG-011', trainingId: 'TRN-008', driverName: 'Luis Ramírez Vega', driverId: 'DRV-005', answersCount: 5, correctAnswers: 4, responseDate: '2025-04-02T14:00:00.000Z' },
  { progressId: 'PRG-012', trainingId: 'TRN-008', driverName: 'Carlos Mendoza López', driverId: 'DRV-001', answersCount: 5, correctAnswers: 5, responseDate: '2025-04-03T10:30:00.000Z' },
  { progressId: 'PRG-013', trainingId: 'TRN-011', driverName: 'Ana García Ruiz', driverId: 'DRV-002', answersCount: 5, correctAnswers: 3, responseDate: '2025-04-20T11:00:00.000Z' },
  { progressId: 'PRG-014', trainingId: 'TRN-011', driverName: 'Jorge Pérez Castro', driverId: 'DRV-006', answersCount: 5, correctAnswers: 5, responseDate: '2025-04-21T09:00:00.000Z' },
  { progressId: 'PRG-015', trainingId: 'TRN-011', driverName: 'Roberto Sánchez Torres', driverId: 'DRV-003', answersCount: 5, correctAnswers: 4, responseDate: '2025-04-22T13:00:00.000Z' },
  { progressId: 'PRG-016', trainingId: 'TRN-002', driverName: 'María Flores Hernández', driverId: 'DRV-004', answersCount: 5, correctAnswers: 5, responseDate: '2025-02-12T08:00:00.000Z' },
  { progressId: 'PRG-017', trainingId: 'TRN-004', driverName: 'Luis Ramírez Vega', driverId: 'DRV-005', answersCount: 5, correctAnswers: 5, responseDate: '2025-03-05T10:00:00.000Z' },
  { progressId: 'PRG-018', trainingId: 'TRN-001', driverName: 'Jorge Pérez Castro', driverId: 'DRV-006', answersCount: 5, correctAnswers: 4, responseDate: '2025-02-05T15:00:00.000Z' },
];

let trainingCounter = MOCK_TRAININGS.length;
const trainingStore: ITrainingDetailDTO[] = [...MOCK_TRAININGS];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateXlsx<T extends Record<string, unknown>>(items: T[]): Blob {
  const ws = XLSX.utils.json_to_sheet(items);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function generateCsv(rows: Record<string, unknown>[]): Blob {
  if (rows.length === 0) return new Blob([''], { type: 'text/csv' });
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ];
  return new Blob([csvLines.join('\n')], { type: 'text/csv' });
}

export class MockTrainingRepository implements ITrainingRepository {
  constructor(private readonly toast?: IToastContext) {}
  async getTrainings(
    filters: ITrainingFiltersDTO,
  ): Promise<IResultApi<{ items: ITrainingListItemDTO[]; total: number }>> {
    await delay(300);
    let filtered = trainingStore.filter((t) => {
      if (!filters.search) return true;
      const q = filters.search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.trainingType.toLowerCase().includes(q);
    });

    const sortKey = (filters.sortBy as keyof ITrainingDetailDTO) ?? 'createdAt';
    filtered = [...filtered].sort((a, b) => {
      const aVal = String(a[sortKey] ?? '');
      const bVal = String(b[sortKey] ?? '');
      return filters.sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    const total = filtered.length;
    const start = (filters.page - 1) * filters.pageSize;
    const items: ITrainingListItemDTO[] = filtered
      .slice(start, start + filters.pageSize)
      .map(({ trainingId, title, trainingType, createdAt }) => ({
        trainingId,
        title,
        trainingType,
        createdAt,
      }));

    return { success: true, data: { items, total } };
  }

  async getTrainingById(id: string): Promise<IResultApi<ITrainingDetailDTO>> {
    await delay(300);
    const training = trainingStore.find((t) => t.trainingId === id);
    if (!training) {
      return { success: false, error: { statusCode: 404, message: `Training '${id}' not found` } };
    }
    return { success: true, data: { ...training } };
  }

  async createTraining(data: ICreateTrainingDTO): Promise<IResultApi<ITrainingDetailDTO>> {
    await delay(300);
    trainingCounter += 1;
    const newTraining: ITrainingDetailDTO = {
      ...data,
      trainingId: `TRN-${String(trainingCounter).padStart(3, '0')}`,
      createdBy: 'admin@spidi.mx',
      createdAt: new Date().toISOString(),
    };
    trainingStore.push(newTraining);
    this.toast?.showToast({ type: 'success', message: 'Capacitación creada correctamente' });
    return { success: true, data: { ...newTraining } };
  }

  async updateTraining(id: string, data: IUpdateTrainingDTO): Promise<IResultApi<ITrainingDetailDTO>> {
    await delay(300);
    const index = trainingStore.findIndex((t) => t.trainingId === id);
    if (index === -1) {
      this.toast?.showToast({ type: 'danger', message: `Capacitación '${id}' no encontrada` });
      return { success: false, error: { statusCode: 404, message: `Training '${id}' not found` } };
    }
    trainingStore[index] = { ...trainingStore[index], ...data };
    this.toast?.showToast({ type: 'success', message: 'Cambios guardados correctamente' });
    return { success: true, data: { ...trainingStore[index] } };
  }

  async sendTraining(data: ISendTrainingDTO): Promise<IResultApi<{ sent: number; failed: string[] }>> {
    await delay(300);
    const training = trainingStore.find((t) => t.trainingId === data.trainingId);
    if (!training) {
      this.toast?.showToast({ type: 'danger', message: `Capacitación '${data.trainingId}' no encontrada` });
      return { success: false, error: { statusCode: 404, message: `Training '${data.trainingId}' not found` } };
    }

    if (data.sendType === 'Mass') {
      this.toast?.showToast({ type: 'success', message: 'Capacitación enviada masivamente a 247 conductores' });
      return { success: true, data: { sent: 247, failed: [] } };
    }

    if (data.sendType === 'Group') {
      this.toast?.showToast({ type: 'success', message: 'Capacitación enviada a 42 conductores del grupo' });
      return { success: true, data: { sent: 42, failed: [] } };
    }

    const emails = data.recipientEmails ?? [];
    const failed = emails.filter((e) => !isValidEmail(e));
    const sent = emails.length - failed.length;
    if (failed.length > 0) {
      this.toast?.showToast({ type: 'warning', message: `Enviado a ${sent} correo${sent !== 1 ? 's' : ''}. Sin entrega: ${failed.join(', ')}` });
    } else {
      this.toast?.showToast({ type: 'success', message: `Capacitación enviada a ${sent} correo${sent !== 1 ? 's' : ''} correctamente` });
    }
    return { success: true, data: { sent, failed } };
  }

  async exportTrainings(filters: ITrainingFiltersDTO, _format: string): Promise<IResultApi<Blob>> {
    await delay(300);
    let filtered = trainingStore.filter((t) => {
      if (!filters.search) return true;
      const q = filters.search.toLowerCase();
      return t.title.toLowerCase().includes(q);
    });

    const rows = filtered.map((t) => ({
      trainingId: t.trainingId,
      title: t.title,
      trainingType: t.trainingType,
      hasQuiz: String(t.hasQuiz),
      createdBy: t.createdBy,
      createdAt: t.createdAt,
    }));

    return { success: true, data: generateCsv(rows) };
  }

  async getTrainingProgress(trainingId: string): Promise<IResultApi<ITrainingProgressDTO[]>> {
    await delay(300);
    const progress = MOCK_PROGRESS.filter((p) => p.trainingId === trainingId);
    return { success: true, data: progress };
  }

  async exportTrainingProgress(trainingId: string, format: string): Promise<IResultApi<Blob>> {
    await delay(300);
    const progress = MOCK_PROGRESS.filter((p) => p.trainingId === trainingId);
    const rows = progress.map((p) => ({
      'ID Progreso': p.progressId,
      'ID Capacitación': p.trainingId,
      'Driver': p.driverName,
      'ID Driver': p.driverId,
      'Total Respuestas': p.answersCount,
      'Respuestas Correctas': p.correctAnswers,
      'Calificación': `${Math.round((p.correctAnswers / p.answersCount) * 100)}%`,
      'Fecha de Respuesta': new Date(p.responseDate).toLocaleDateString('es-MX'),
    }));
    const blob = format === 'xlsx' ? generateXlsx(rows) : generateCsv(rows as unknown as Record<string, unknown>[]);
    return { success: true, data: blob };
  }
}
