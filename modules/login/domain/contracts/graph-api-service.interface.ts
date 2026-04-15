export interface IGroupDTO {
  id: string;
  displayName: string;
}

export interface IGraphApiService {
  getUserGroups(accessToken: string): Promise<IGroupDTO[]>;
}
