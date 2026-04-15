import { type IHttpClient } from "@/modules/shared/domain/contracts/http-client.interface";
import { type IConfiguracionRepository } from "@/modules/shared/domain/contracts/configuracion-repository.interface";
import { type IRegisterRepository } from "../../domain/contracts/register-repository.interface";
import { type IStateDTO } from "../../domain/contracts/state.dto";
import { type IVerificationResult } from "../../domain/contracts/verification-result.dto";
import { StatesFetchError } from "../../domain/errors/states-fetch.error";
import { ICheckDuplicateResult } from "../../domain/contracts/check-duplicate-result.dto";
import { type IRegistroDTO } from "../../domain/contracts/registro.dto";
import { type IRegisterApplicantDto } from "../../domain/contracts/register-applicant.dto";

interface IApiState {
  id: number;
  state: string;
  cities: { id: number; city: string }[];
}

export class ApiRegisterRepository implements IRegisterRepository {
  constructor(
    private readonly httpClient: IHttpClient,
    private readonly configuracionRepository?: IConfiguracionRepository,
  ) {}

  private async appendDeviceId(formData: FormData): Promise<void> {
    if (!this.configuracionRepository) return;
    const spidiId = await this.configuracionRepository.get("spidiId");
    if (spidiId) formData.append("deviceId", spidiId);
  }

  async getStates(): Promise<IStateDTO[]> {
    try {
      const response = await this.httpClient.get<IApiState[]>(
        "api/v1/register/states",
      );
      return response.data.map((item) => ({
        id: item.id,
        state: item.state,
        cities: item.cities.map((c) => ({ id: c.id, city: c.city })),
      }));
    } catch {
      throw new StatesFetchError();
    }
  }

  async requestVerificationCodeSMS(
    formId: string,
    phoneNumber: string,
  ): Promise<IResultApi<IVerificationResult>> {
    try {
      const formData = new FormData();
      formData.append("formId", formId);
      formData.append("phoneNumber", phoneNumber);
      await this.appendDeviceId(formData);
      const response = await this.httpClient.post<IVerificationResult>(
        "api/v1/otp/send-sms",
        formData,
      );
      return {
        success: true,
        data: response.data,
      } as IResultApi<IVerificationResult>;
    } catch (error) {
      return {
        success: false,
        error: {
          statusCode: error instanceof Error ? (error as any).statusCode : 500,
          message: error instanceof Error ? error.message : "Unknown error",
        },
      } as IResultApi<IVerificationResult>;
    }
  }

  async validateVerificationCodeSMS(
    formId: string,
    phoneNumber: string,
    code: string,
  ): Promise<IResultApi<IVerificationResult>> {
    try {
      const formData = new FormData();
      formData.append("formId", formId);
      formData.append("phoneNumber", phoneNumber);
      formData.append("code", code);
      await this.appendDeviceId(formData);
      const response = await this.httpClient.post<IVerificationResult>(
        "api/v1/otp/validate-sms",
        formData,
      );
      return {
        success: true,
        data: response.data,
      } as IResultApi<IVerificationResult>;
    } catch (error) {
      return {
        success: false,
        error: {
          statusCode: error instanceof Error ? (error as any).statusCode : 500,
          message: error instanceof Error ? error.message : "Unknown error",
        },
      } as IResultApi<IVerificationResult>;
    }
  }

  async requestVerificationCodeEmail(
    formId: string,
    email: string,
  ): Promise<IResultApi<IVerificationResult>> {
    try {
      const formData = new FormData();
      formData.append("formId", formId);
      formData.append("email", email);
      await this.appendDeviceId(formData);
      const response = await this.httpClient.post<IVerificationResult>(
        "api/v1/otp/send-email",
        formData,
      );
      return {
        success: true,
        data: response.data,
      } as IResultApi<IVerificationResult>;
    } catch (error) {
      return {
        success: false,
        error: {
          statusCode: error instanceof Error ? (error as any).statusCode : 500,
          message: error instanceof Error ? error.message : "Unknown error",
        },
      } as IResultApi<IVerificationResult>;
    }
  }

  async validateVerificationCodeEmail(
    formId: string,
    email: string,
    code: string,
  ): Promise<IResultApi<IVerificationResult>> {
    try {
      const formData = new FormData();
      formData.append("formId", formId);
      formData.append("email", email);
      formData.append("code", code);
      await this.appendDeviceId(formData);
      const response = await this.httpClient.post<IVerificationResult>(
        "api/v1/otp/validate-email",
        formData,
      );
      return {
        success: true,
        data: response.data,
      } as IResultApi<IVerificationResult>;
    } catch (error) {
      return {
        success: false,
        error: {
          statusCode: error instanceof Error ? (error as any).statusCode : 500,
          message: error instanceof Error ? error.message : "Unknown error",
        },
      } as IResultApi<IVerificationResult>;
    }
  }

  async checkDuplicate(
    phoneNumber: string,
    email: string,
  ): Promise<IResultApi<ICheckDuplicateResult>> {
    try {
      const formData = new FormData();
      formData.append("phoneNumber", phoneNumber);
      formData.append("email", email);
      const response = await this.httpClient.post<ICheckDuplicateResult>(
        "api/v1/driver/check-duplicate",
        formData,
      );
      return {
        success: true,
        data: response.data,
      } as IResultApi<ICheckDuplicateResult>;
    } catch (error) {
      return {
        success: false,
        error: {
          statusCode: error instanceof Error ? (error as any).statusCode : 500,
          message: error instanceof Error ? error.message : "Unknown error",
        },
      } as IResultApi<ICheckDuplicateResult>;
    }
  }

  async guardarDriver(driver: IRegistroDTO): Promise<IResultApi<IRegisterApplicantDto>> {
    try {
      const formData = new FormData();
      formData.append("firstName", driver.firstName);
      formData.append("middleName", driver.middleName);
      formData.append("paternalSurname", driver.paternalSurname);
      formData.append("maternalSurname", driver.maternalSurname);
      formData.append("telefono", driver.telefono);
      formData.append("email", driver.email);
      formData.append("marca", driver.marca);
      formData.append("modelo", driver.modelo);
      formData.append("anio", driver.anio);
      formData.append("placas", driver.placas);
      formData.append("color", driver.color);
      formData.append("estado", driver.estado);
      formData.append("ciudad", driver.ciudad);
      formData.append("comoTeEnteraste", driver.comoTeEnteraste);
      formData.append("verifiedSms", String(driver.verifiedSms));
      formData.append("verifiedEmail", String(driver.verifiedEmail));
      await this.appendDeviceId(formData);
      const response = await this.httpClient.post<IRegisterApplicantDto>(
        "api/v1/driver",
        formData,
      );
      return {
        success: true,
        data: response.data,
      } as IResultApi<IRegisterApplicantDto>;
    } catch (error) {
      return {
        success: false,
        error: {
          statusCode: error instanceof Error ? (error as any).statusCode : 500,
          message: error instanceof Error ? error.message : "Unknown error",
        },
      } as IResultApi<IRegisterApplicantDto>;
    }
  }
}
