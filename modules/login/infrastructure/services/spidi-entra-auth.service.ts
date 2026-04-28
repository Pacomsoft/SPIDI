import { type ITokenDto } from "@/modules/shared/domain/contracts/token.dto";
import {
  type ISpidiAuthService,
  type ISpidiAuthResultDTO,
  type IRoleDto,
} from "../../domain/contracts/spidi-auth-service.interface";
import { v7 as uuidv7 } from "uuid";
import { FetchError } from "@/modules/shared/domain/entities/fetch-error.class";
import { ProblemObject } from "@/modules/shared/domain/contracts/problem-object.type";
import { API_ENDPOINTS } from "@/modules/shared/domain/contracts/api-endpoints.constants";
const DEFAULT_EXPIRATION_MS = 60 * 60 * 1000; // 1 hora

interface IEntraAccessResponse {
  accessToken: string;
  uuid: string;
  refreshToken: string;
}

export class SpidiEntraAuthService implements ISpidiAuthService {
  constructor(private readonly baseURL: string = "") {}

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

  private buildUrl(url: string): string {
    const baseURL = this.baseURL.endsWith("/")
      ? this.baseURL.substring(0, this.baseURL.length - 1)
      : this.baseURL;
    const urlSplit = url.split("?");
    const urlOnly = urlSplit[0].startsWith("/")
      ? urlSplit[0]
      : `/${urlSplit[0]}`;
    let paramsString = "";
    if (urlSplit.length > 1) {
      paramsString = urlSplit[1];
    }
    return `${baseURL}${urlOnly}${paramsString ? `?${paramsString}` : ""}`;
  }

  async authenticateWithEntraToken(
    msAccessToken: string,
  ): Promise<ISpidiAuthResultDTO> {
    const spidiToken = await this.exchangeEntraToken(msAccessToken);
    const roles = await this.getUserRoles(spidiToken.accessToken);
    return { spidiToken, roles };
  }

  private async exchangeEntraToken(msAccessToken: string): Promise<ITokenDto> {
    const formData = new FormData();
    formData.append("msAccessToken", msAccessToken);
    const url = this.buildUrl(API_ENDPOINTS.ENTRA_ACCESS_URL);
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        "Idempotency-Key": uuidv7(),
        },
      },
    );

    if (!response.ok) {
      this.handleErrorResponse(await this.parseBody(response), response.status);
    }

    const data: IEntraAccessResponse = await response.json();
    return {
      accessToken: data.accessToken,
      uuid: data.uuid,
      refreshToken: data.refreshToken,
      expirationToken: new Date(Date.now() + DEFAULT_EXPIRATION_MS),
    };
  }

  private async getUserRoles(spidiAccessToken: string): Promise<IRoleDto[]> {
    const url = this.buildUrl(API_ENDPOINTS.ME_URL);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${spidiAccessToken}`,
        "Idempotency-Key": uuidv7(),
      },
    });

    if (!response.ok) {
      this.handleErrorResponse(await this.parseBody(response), response.status);
    }

    return [(await response.json()) as IRoleDto];
  }
}
