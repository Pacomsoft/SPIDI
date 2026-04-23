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
import { version } from "@/package.json";

const SPIDI_ID_KEY = "spidiId";
const REFRESH_URL = "/api/v1/authorization/token/refresh";
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
      if(response.headers.has("content-type") && (response.headers.get("content-type")?.includes("application/json")
        || response.headers.get("content-type")?.includes("application/problem+json"))) {
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

  private async resolveIdempotencyKey(url: string): Promise<string> {
    if (this.idempotencyRepository) {
      return this.idempotencyRepository.addRequest(url);
    }
    return uuidv7();
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
    return (await this.configuracionRepository.get(SPIDI_ID_KEY)) ?? "";
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

      const response = await fetch(`${this.baseURL}${REFRESH_URL}`, {
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

  async get<T>(url: string, config?: IHttpConfig): Promise<IHttpResponse<T>> {
    const [appId, authHeader] = await Promise.all([
      this.resolveAppId(),
      this.resolveAuthorizationHeader(),
    ]);
    const response = await fetch(`${this.baseURL}${url}`, {
      method: "GET",
      headers: {
        "Idempotency-Key": await this.resolveIdempotencyKey(url),
        "X-APP-ID": appId,
        "X-APP-VERSION": version,
        "X-APP-PLATFORM": "web",
        ...authHeader,
        ...config?.headers,
      },
    });
    await this.updateFromETag(url, response);
    if (!response.ok) {
      this.handleErrorResponse(await this.parseBody(response), response.status);
    }
    return { data: await response.json() as T, status: response.status };
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: IHttpConfig,
  ): Promise<IHttpResponse<T>> {
    const [appId, authHeader] = await Promise.all([
      this.resolveAppId(),
      this.resolveAuthorizationHeader(),
    ]);
    const contentTypeHeader = this.resolveContentTypeHeader(data);
    const response = await fetch(`${this.baseURL}${url}`, {
      method: "POST",
      headers: {
        ...contentTypeHeader,
        "Idempotency-Key": await this.resolveIdempotencyKey(url),
        "X-APP-ID": appId,
        "X-APP-VERSION": version,
        "X-APP-PLATFORM": "web",
        ...authHeader,
        ...config?.headers,
      },
      body:
        data !== undefined
          ? data instanceof FormData
            ? data as FormData
            : JSON.stringify(data)
          : undefined,
    });
    await this.updateFromETag(url, response);
    if (!response.ok) {
      this.handleErrorResponse(await this.parseBody(response), response.status);
    }
    return { data: await response.json() as T, status: response.status };
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: IHttpConfig,
  ): Promise<IHttpResponse<T>> {
    const [appId, authHeader] = await Promise.all([
      this.resolveAppId(),
      this.resolveAuthorizationHeader(),
    ]);
    const contentTypeHeader = this.resolveContentTypeHeader(data);
    const response = await fetch(`${this.baseURL}${url}`, {
      method: "PUT",
      headers: {
        ...contentTypeHeader,
        "Idempotency-Key": await this.resolveIdempotencyKey(url),
        "X-APP-ID": appId,
        "X-APP-VERSION": version,
        "X-APP-PLATFORM": "web",
        ...authHeader,
        ...config?.headers,
      },
      body:
        data !== undefined
          ? data instanceof FormData
            ? data as FormData
            : JSON.stringify(data)
          : undefined,
    });
    await this.updateFromETag(url, response);
    if (!response.ok) {
      this.handleErrorResponse(await this.parseBody(response), response.status);
    }
    return { data: await response.json() as T, status: response.status };
  }

  async delete<T>(
    url: string,
    config?: IHttpConfig,
  ): Promise<IHttpResponse<T>> {
    const [appId, authHeader] = await Promise.all([
      this.resolveAppId(),
      this.resolveAuthorizationHeader(),
    ]);
    const response = await fetch(`${this.baseURL}${url}`, {
      method: "DELETE",
      headers: {
        "Idempotency-Key": await this.resolveIdempotencyKey(url),
        "X-APP-ID": appId,
        "X-APP-VERSION": version,
        "X-APP-PLATFORM": "web",
        ...authHeader,
        ...config?.headers,
      },
    });
    await this.updateFromETag(url, response);
    if (!response.ok) {
      this.handleErrorResponse(await this.parseBody(response), response.status);
    }
    return { data: await response.json() as T, status: response.status };
  }
}
