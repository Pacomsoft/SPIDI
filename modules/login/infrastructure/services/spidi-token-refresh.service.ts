import { type ITokenDto } from "@/modules/shared/domain/contracts/token.dto";
import { type ITokenRefreshService } from "../../domain/contracts/token-refresh-service.interface";
import { API_ENDPOINTS } from "@/modules/shared/domain/contracts/api-endpoints.constants";

export class SpidiTokenRefreshService implements ITokenRefreshService {
  constructor(private readonly baseURL: string = "") {}

  async refresh(token: ITokenDto): Promise<ITokenDto | null> {
    try {
      const formData = new FormData();
      formData.append("accessToken", token.accessToken);
      formData.append("uuid", token.uuid);
      formData.append("refreshToken", token.refreshToken);
      formData.append("expirationToken", token.expirationToken.toISOString());

      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.REFRESH_URL}`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) return null;

      const newToken: ITokenDto = await response.json();
      if (newToken?.accessToken) return newToken;

      return null;
    } catch {
      return null;
    }
  }
}
