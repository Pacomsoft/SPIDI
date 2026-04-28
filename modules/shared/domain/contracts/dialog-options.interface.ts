export interface IDialogOptions {
  /** Encabezado del modal. Default: 'Advertencia' */
  title?: string;
  /** Contenido del modal. Default: '¿Deseas continuar?' */
  text?: string;
  /** Texto del botón que resuelve true. Default: 'Sí' */
  okText?: string;
  /** Texto del botón que resuelve false. Default: 'No' */
  cancelText?: string;
  /** Muestra el botón de cancelar. Default: true */
  showCancel?: boolean;
}
