export enum EstadoVerificacionOtp {
  Pendiente                 = 1,
  Aprobado                  = 2,
  Cancelado                 = 3,
  MaximoDeIntentosAlcanzado = 4,
  Eliminado                 = 5,
  FalloAlVerificar          = 6,
  CodigoExpirado            = 7,
}
