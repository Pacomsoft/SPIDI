import { type IGraphApiService, type IGroupDTO } from '../../domain/contracts/graph-api-service.interface';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

interface IGraphGroupResponse {
  id: string;
  displayName: string;
}

interface IGraphResponse {
  value: IGraphGroupResponse[];
}

export class MicrosoftGraphApiService implements IGraphApiService {
  async getUserGroups(accessToken: string): Promise<IGroupDTO[]> {
    const response = await fetch(`${GRAPH_BASE}/me/memberOf?$select=id,displayName`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Graph API error: ${response.status}`);
    }

    const data: IGraphResponse = await response.json();
    return data.value.map((g) => ({ id: g.id, displayName: g.displayName }));
  }
}
