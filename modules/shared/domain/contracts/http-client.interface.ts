export interface IHttpConfig {
  headers?: Record<string, string>;
}

export interface IHttpResponse<T> {
  data: T;
  status: number;
}

export interface IHttpClient {
  get<T>(url: string, config?: IHttpConfig): Promise<IHttpResponse<T>>;
  post<T>(url: string, data?: unknown, config?: IHttpConfig): Promise<IHttpResponse<T>>;
  put<T>(url: string, data?: unknown, config?: IHttpConfig): Promise<IHttpResponse<T>>;
  delete<T>(url: string, config?: IHttpConfig): Promise<IHttpResponse<T>>;
}
