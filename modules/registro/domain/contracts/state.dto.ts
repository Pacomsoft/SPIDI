export interface ICityDTO {
  id: number;
  city: string;
}

export interface IStateDTO {
  id: number;
  state: string;
  cities: ICityDTO[];
}
