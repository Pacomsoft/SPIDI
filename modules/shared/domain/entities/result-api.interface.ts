/** Resultado general de todos los repositorios que usen IHttpClient para manejar las respuestas del API diferentes a 200 */
interface IResultApi<T> {
    /** Success true solo significa que existe data; de lo contrario existe error */
    success: boolean;
    /** Data es el resultado esperado del API */
    data?: T;
    /** Error contiene la excepcion si ocurre una llamando al API o la información de error devuelta por el API cuando no sea 200 (OK) */
    error?: {
        statusCode?: number;
        message?: string;
    };
}