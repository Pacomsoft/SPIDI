import { type IHttpClient } from "@/modules/shared/domain/contracts/http-client.interface";
import { type IConfiguracionRepository } from "@/modules/shared/domain/contracts/configuracion-repository.interface";
import { type IRegisterRepository } from "../../domain/contracts/register-repository.interface";
import { type IStateDTO } from "../../domain/contracts/state.dto";
import { type IVerificationResult } from "../../domain/contracts/verification-result.dto";
import { StatesFetchError } from "../../domain/errors/states-fetch.error";
import { ICheckDuplicateResult } from "../../domain/contracts/check-duplicate-result.dto";
import { type IRegistroDTO } from "../../domain/contracts/registro.dto";
import { type IRegisterApplicantDto } from "../../domain/contracts/register-applicant.dto";
import { objectToFormData } from "@/modules/shared/domain/utils/object-to-formdata.util";
import { API_ENDPOINTS } from "@/modules/shared/domain/contracts/api-endpoints.constants";

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

  async getStates(): Promise<IStateDTO[]> {
    try {
      const response = await this.httpClient.get<IApiState[]>(
        API_ENDPOINTS.REGISTRATION_STATES,
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
      const formData = objectToFormData({ formId, phoneNumber });
      const response = await this.httpClient.post<IVerificationResult>(
        API_ENDPOINTS.REGISTRATION_REQUEST_SMS,
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
      const formData = objectToFormData({ formId, phoneNumber, code });
      const response = await this.httpClient.post<IVerificationResult>(
        API_ENDPOINTS.REGISTRATION_VALIDATE_SMS,
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
      const formData = objectToFormData({ formId, email });
      const response = await this.httpClient.post<IVerificationResult>(
        API_ENDPOINTS.REGISTRATION_REQUEST_EMAIL,
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
      const formData = objectToFormData({ formId, email, code });
      const response = await this.httpClient.post<IVerificationResult>(
        API_ENDPOINTS.REGISTRATION_VALIDATE_EMAIL,
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
      const formData = objectToFormData({ phoneNumber, email });
      const response = await this.httpClient.post<ICheckDuplicateResult>(
        API_ENDPOINTS.REGISTRATION_CHECK_DUPLICATE,
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
      const formData = objectToFormData(driver);
      const response = await this.httpClient.post<IRegisterApplicantDto>(
         API_ENDPOINTS.DRIVER,
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
