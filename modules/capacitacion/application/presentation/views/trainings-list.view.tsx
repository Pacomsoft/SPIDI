'use client';

import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, BookOpen, Loader2 } from 'lucide-react';
import { RoleGuard } from '@/modules/adm/application/presentation/components/role-guard';
import { createCheckModuleAccessUseCase } from '@/modules/adm/infrastructure/dependency-injection';
import type { IGetTrainingsUseCase } from '../../../domain/contracts/get-trainings-use-case.interface';
import type { IExportTrainingsUseCase } from '../../../domain/contracts/export-trainings-use-case.interface';
import type { ICreateTrainingUseCase } from '../../../domain/contracts/create-training-use-case.interface';
import { useTrainingsList } from '../../hooks/use-trainings-list.hook';
import { TrainingTypeBadge } from '../components/training-type-badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

const checkModuleAccessUseCase = createCheckModuleAccessUseCase();

interface ITrainingsListViewProps {
  getTrainingsUseCase: IGetTrainingsUseCase;
  exportTrainingsUseCase: IExportTrainingsUseCase;
  createTrainingUseCase: ICreateTrainingUseCase;
}

type SortKey = 'trainingId' | 'title' | 'trainingType' | 'createdAt';

export function TrainingsListView({ getTrainingsUseCase, exportTrainingsUseCase }: ITrainingsListViewProps) {
  const { navigateTo } = useNavigationLoading();
  const {
    trainings, total, isLoading, page, pageSize, sortBy, sortDirection,
    search, isExporting,
    setPage, setPageSize, setSortBy, setSortDirection,
    setSearch, handleExport, clearFilters,
  } = useTrainingsList(getTrainingsUseCase, exportTrainingsUseCase);

  const totalPages = Math.ceil(total / pageSize);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortBy('createdAt'); setSortDirection('desc'); }
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortBy !== key) return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    if (sortDirection === 'asc') return <ArrowUp className="h-4 w-4 ml-1" />;
    return <ArrowDown className="h-4 w-4 ml-1" />;
  };

  return (
    <RoleGuard moduleKey="CAPACITACION" checkModuleAccessUseCase={checkModuleAccessUseCase}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-muted/30">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Capacitaciones</h1>
                  <p className="text-sm text-muted-foreground mt-1">{total} capacitaciones en total</p>
                </div>
                <Button onClick={() => navigateTo('/adm/capacitacion/create')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Crear capacitación
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    placeholder="Buscar por título..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isExporting}>
                      {isExporting
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exportando…</>
                        : 'Exportar'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { void handleExport('csv'); }}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { void handleExport('xlsx'); }}>Excel (.xlsx)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : trainings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-4">No se encontraron capacitaciones con los filtros seleccionados</p>
                <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('trainingId')}>
                          <div className="flex items-center">ID{getSortIcon('trainingId')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('title')}>
                          <div className="flex items-center">Título{getSortIcon('title')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('trainingType')}>
                          <div className="flex items-center">Tipo{getSortIcon('trainingType')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('createdAt')}>
                          <div className="flex items-center">Fecha de creación{getSortIcon('createdAt')}</div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trainings.map(training => (
                        <TableRow
                          key={training.trainingId}
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => navigateTo(`/adm/capacitacion/${training.trainingId}`)}
                        >
                          <TableCell className="font-mono text-xs">{training.trainingId}</TableCell>
                          <TableCell className="font-medium">{training.title}</TableCell>
                          <TableCell><TrainingTypeBadge type={training.trainingType} /></TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(training.createdAt).toLocaleDateString('es-MX', {
                              year: 'numeric', month: 'long', day: 'numeric',
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Mostrar:</span>
                      <Select value={pageSize.toString()} onValueChange={v => setPageSize(Number(v))}>
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Página {page} de {totalPages} · Total: {total} capacitaciones
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
                      Siguiente<ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
