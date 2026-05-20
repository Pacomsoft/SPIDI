import { v7 as uuidv7 } from "uuid";
import {
  type IHttpClient,
  type IHttpConfig,
  type IHttpResponse,
} from "../../domain/contracts/http-client.interface";
import { type IConfiguracionRepository } from "../../domain/contracts/configuracion-repository.interface";
import { type IIdempotencyRepository } from "../../domain/contracts/idempotency-repository.interface";
import { type ITokenRepository } from "../../domain/contracts/token-repository.interface";
import { type ITokenDto } from "../../domain/contracts/token.dto";
import { type IToastContext } from "../../domain/contracts/toast.interface";
import { FetchError } from "../../domain/entities/fetch-error.class";
import { type ProblemObject } from "../../domain/contracts/problem-object.type";
import packageInfo from "@/package.json";
import { API_ENDPOINTS } from "@/modules/shared/domain/contracts/api-endpoints.constants";

const SPIDI_ID_KEY = "spidiId";
const SESSION_EXPIRED_MSG = "La sesión ha expirado";

export interface IFetchHttpClientDeps {
  configuracionRepository?: IConfiguracionRepository;
  idempotencyRepository?: IIdempotencyRepository;
  tokenRepository?: ITokenRepository;
  toastContext?: IToastContext;
}

export class FetchHttpClient implements IHttpClient {
  private readonly configuracionRepository?: IConfiguracionRepository;
  private readonly idempotencyRepository?: IIdempotencyRepository;
  private readonly tokenRepository?: ITokenRepository;
  private readonly toastContext?: IToastContext;

  constructor(
    private readonly baseURL: string = "",
    deps?: IFetchHttpClientDeps,
  ) {
    this.configuracionRepository = deps?.configuracionRepository;
    this.idempotencyRepository = deps?.idempotencyRepository;
    this.tokenRepository = deps?.tokenRepository;
    this.toastContext = deps?.toastContext;
  }

  private isProblemObject(body: unknown): body is ProblemObject {
    return (
      typeof body === "object" &&
      body !== null &&
      typeof (body as ProblemObject).status === "number" &&
      typeof (body as ProblemObject).title === "string" &&
      typeof (body as ProblemObject).type === "string"
    );
  }

  private async parseBody(response: Response): Promise<unknown> {
    try {
      if (
        response.headers.has("content-type") &&
        (response.headers.get("content-type")?.includes("application/json") ||
          response.headers
            .get("content-type")
            ?.includes("application/problem+json"))
      ) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch {
      return undefined;
    }
  }

  private handleErrorResponse(body: unknown, status: number): never {
    if (Array.isArray(body) && body.every((e) => typeof e === "string")) {
      throw FetchError.fromErrors(body as string[], status);
    }
    if (this.isProblemObject(body)) {
      throw FetchError.fromProblemObject(body);
    }
    if (typeof body === "string") {
      throw FetchError.fromErrors(body, status);
    }
    throw FetchError.fromStatus(status);
  }

  private async resolveIdempotencyKey(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'): Promise<string> {
    // GET requests son idempotentes por naturaleza — siempre generamos una UUID fresca
    // para evitar colisiones con llaves ya registradas en el backend.
    // Solo POST/PUT/DELETE usan el repositorio para rastrear reintentos.
    if (method === 'GET' || !this.idempotencyRepository) {
      return uuidv7();
    }
    return this.idempotencyRepository.addRequest(url);
  }

  /** La llave de idempotencia se debe actualizar independientemente de el estatus de la respuesta */
  private async updateFromETag(url: string, response: Response): Promise<void> {
    const etag = response.headers.get("etag");
    if (etag && this.idempotencyRepository) {
      await this.idempotencyRepository.updateRequest(url, etag);
    }
  }

  private async resolveAppId(): Promise<string> {
    if (!this.configuracionRepository) return "";
    const existing = await this.configuracionRepository.get(SPIDI_ID_KEY);
    if (existing) return existing;
    // Si no existe aún, crearlo en el momento para que el hash del backend sea consistente
    const { v7: uuidv7id } = await import("uuid");
    const newId = uuidv7id();
    await this.configuracionRepository.set(SPIDI_ID_KEY, newId);
    return newId;
  }

  private async resolveAuthorizationHeader(): Promise<Record<string, string>> {
    if (!this.tokenRepository) return {};

    const token = await this.tokenRepository.getToken();
    if (!token.accessToken) return {};

    const now = new Date();
    if (token.expirationToken > now) {
      return { Authorization: `Bearer ${token.accessToken}` };
    }

    return this.refreshToken(token);
  }

  private resolveContentTypeHeader(data: unknown): Record<string, string> {
    if (!(data instanceof FormData)) {
      return { "Content-Type": "application/json" };
    }
    return {};
  }

  private async refreshToken(
    token: ITokenDto,
  ): Promise<Record<string, string>> {
    try {
      const formData = new FormData();
      formData.append("accessToken", token.accessToken);
      formData.append("uuid", token.uuid);
      formData.append("refreshToken", token.refreshToken);
      formData.append("expirationToken", token.expirationToken.toISOString());

      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.REFRESH_URL}`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newToken: ITokenDto = await response.json();
        if (newToken?.accessToken) {
          await this.tokenRepository!.addToken(newToken);
          return { Authorization: `Bearer ${newToken.accessToken}` };
        }
      }
    } catch {
      // fall through to session expiry handling
    }

    await this.tokenRepository!.clearToken();
    this.toastContext?.showToast({
      message: SESSION_EXPIRED_MSG,
      type: "danger",
    });
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return {};
  }

  private buildUrl(url: string, config?: IHttpConfig): string {
    const baseURL = this.baseURL.endsWith("/") ? this.baseURL.substring(0, this.baseURL.length - 1) : this.baseURL;
    const urlSplit = url.split("?");
    const urlOnly = urlSplit[0].startsWith("/") ? urlSplit[0] : `/${urlSplit[0]}`;
    let paramsString = '';
    if(urlSplit.length > 1) {
      paramsString = urlSplit[1];
    }
    if(config?.queryParams && Object.keys(config.queryParams).length > 0) {
      const currentParams = new URLSearchParams(paramsString);
      for(const [key, value] of Object.entries(config.queryParams)) {
        if(!currentParams.has(key)) {
          currentParams.set(key, value);
        }
      }
      paramsString = currentParams.toString();
    }
    return `${baseURL}${urlOnly}${paramsString ? `?${paramsString}` : ''}`;
  }

  async get<T>(url: string, config?: IHttpConfig): Promise<IHttpResponse<T>> {
    const urlWithParams = this.buildUrl(url, config);
    const [appId, authHeader, idempotencyKey] = await Promise.all([
      this.resolveAppId(),
      this.resolveAuthorizationHeader(),
      this.resolveIdempotencyKey(urlWithParams, 'GET'),
    ]);
    const response = await fetch(urlWithParams, {
      method: "GET",
      headers: {
        "Idempotency-Key": idempotencyKey,
        "X-APP-ID": appId,
        "X-APP-VERSION": packageInfo.version,
        "X-APP-PLATFORM": "web",
        ...authHeader,
        ...config?.headers,
      },
    });
    await this.updateFromETag(urlWithParams, response);
    if (!response.ok) {
      this.handleErrorResponse(await this.parseBody(response), response.status);
    }
    return { data: (await response.json()) as T, status: response.status };
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: IHttpConfig,
  ): Promise<IHttpResponse<T>> {
    const urlWithParams = this.buildUrl(url, config);
    const [appId, authHeader, idempotencyKey] = await Promise.all([
      this.resolveAppId(),
      this.resolveAuthorizationHeader(),
      this.resolveIdempotencyKey(urlWithParams, 'POST'),
    ]);
    const contentTypeHeader = this.resolveContentTypeHeader(data);
    const response = await fetch(`${urlWithParams}`, {
      method: "POST",
      headers: {
        ...contentTypeHeader,
        "Idempotency-Key": idempotencyKey,
        "X-APP-ID": appId,
        "X-APP-VERSION": packageInfo.version,
        "X-APP-PLATFORM": "web",
        ...authHeader,
        ...config?.headers,
      },
      body:
        data !== undefined
          ? data instanceof FormData
            ? (data as FormData)
            : JSON.stringify(data)
          : undefined,
    });
    await this.updateFromETag(urlWithParams, response);
    if (!response.ok) {
      this.handleErrorResponse(await this.parseBody(response), response.status);
    }
    return { data: (await response.json()) as T, status: response.status };
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: IHttpConfig,
  ): Promise<IHttpResponse<T>> {
    const urlWithParams = this.buildUrl(url, config);
    const [appId, authHeader, idempotencyKey] = await Promise.all([
      this.resolveAppId(),
      this.resolveAuthorizationHeader(),
      this.resolveIdempotencyKey(urlWithParams, 'PUT'),
    ]);
    const contentTypeHeader = this.resolveContentTypeHeader(data);
    const response = await fetch(`${urlWithParams}`, {
      method: "PUT",
      headers: {
        ...contentTypeHeader,
        "Idempotency-Key": idempotencyKey,
        "X-APP-ID": appId,
        "X-APP-VERSION": packageInfo.version,
        "X-APP-PLATFORM": "web",
        ...authHeader,
        ...config?.headers,
      },
      body:
        data !== undefined
          ? data instanceof FormData
            ? (data as FormData)
            : JSON.stringify(data)
          : undefined,
    });
    await this.updateFromETag(urlWithParams, response);
    if (!response.ok) {
      this.handleErrorResponse(await this.parseBody(response), response.status);
    }
    return { data: (await response.json()) as T, status: response.status };
  }

  async delete<T>(
    url: string,
    config?: IHttpConfig,
  ): Promise<IHttpResponse<T>> {
    const urlWithParams = this.buildUrl(url, config);
    const [appId, authHeader, idempotencyKey] = await Promise.all([
      this.resolveAppId(),
      this.resolveAuthorizationHeader(),
      this.resolveIdempotencyKey(urlWithParams, 'DELETE'),
    ]);
    const response = await fetch(`${urlWithParams}`, {
      method: "DELETE",
      headers: {
        "Idempotency-Key": idempotencyKey,
        "X-APP-ID": appId,
        "X-APP-VERSION": packageInfo.version,
        "X-APP-PLATFORM": "web",
        ...authHeader,
        ...config?.headers,
      },
    });
    await this.updateFromETag(urlWithParams, response);
    if (!response.ok) {
      this.handleErrorResponse(await this.parseBody(response), response.status);
    }
    return { data: (await response.json()) as T, status: response.status };
  }
}
