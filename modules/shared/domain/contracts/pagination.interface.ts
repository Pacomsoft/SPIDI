export interface IPagination{
    page: number;
    pageSize: number;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    search?: string;
}
