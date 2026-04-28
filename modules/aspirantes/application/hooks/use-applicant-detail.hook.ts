'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { IGetApplicantByIdUseCase } from '../../domain/contracts/get-applicant-by-id-use-case.interface';
import type { IUpdateApplicantUseCase } from '../../domain/contracts/update-applicant-use-case.interface';
import type { IDeleteApplicantUseCase } from '../../domain/contracts/delete-applicant-use-case.interface';
import type { ICreateProposalUseCase } from '../../domain/contracts/create-proposal-use-case.interface';
import type { IGetApplicantCatalogsUseCase } from '../../domain/contracts/get-applicant-catalogs-use-case.interface';
import type { IApplicantDetailDTO, IApplicantDocumentDTO, IProposalDTO, ICreateProposalDTO } from '../../domain/contracts/applicant-detail.dto';
import type { ICatalogItemDTO } from '../../domain/contracts/applicant-list.dto';
import { API_ENDPOINTS } from '@/modules/shared/domain/contracts/api-endpoints.constants';

export interface IApplicantCatalogs {
  stores: ICatalogItemDTO[];
  banks: ICatalogItemDTO[];
  genders: ICatalogItemDTO[];
  fiscalRegimes: ICatalogItemDTO[];
  states: ICatalogItemDTO[];
}

export function useApplicantDetail(
  id: string,
  getApplicantByIdUseCase: IGetApplicantByIdUseCase,
  updateApplicantUseCase: IUpdateApplicantUseCase,
  deleteApplicantUseCase: IDeleteApplicantUseCase,
  createProposalUseCase: ICreateProposalUseCase,
  getCatalogsUseCase: IGetApplicantCatalogsUseCase,
) {
  const [applicant, setApplicant] = useState<IApplicantDetailDTO | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<IApplicantDetailDTO | null>(null);
  const [documents, setDocuments] = useState<Record<string, IApplicantDocumentDTO>>({});
  const [proposals, setProposals] = useState<IProposalDTO[]>([]);
  const [catalogs, setCatalogs] = useState<IApplicantCatalogs>({
    stores: [], banks: [], genders: [], fiscalRegimes: [], states: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [applicantResult, catalogsResult] = await Promise.all([
        getApplicantByIdUseCase.execute(id),
        getCatalogsUseCase.execute({
          endpoints: [
            API_ENDPOINTS.CATALOGS_STORES,
            API_ENDPOINTS.CATALOGS_BANKS,
            API_ENDPOINTS.CATALOGS_GENDERS,
            API_ENDPOINTS.CATALOGS_FISCAL_REGIMES,
            API_ENDPOINTS.CATALOGS_STATES,
          ],
        }),
      ]);
      if (applicantResult.success && applicantResult.data) {
        setApplicant(applicantResult.data);
        setInitialSnapshot(JSON.parse(JSON.stringify(applicantResult.data)) as IApplicantDetailDTO);
      }
      setCatalogs({
        stores: catalogsResult[API_ENDPOINTS.CATALOGS_STORES] ?? [],
        banks: catalogsResult[API_ENDPOINTS.CATALOGS_BANKS] ?? [],
        genders: catalogsResult[API_ENDPOINTS.CATALOGS_GENDERS] ?? [],
        fiscalRegimes: catalogsResult[API_ENDPOINTS.CATALOGS_FISCAL_REGIMES] ?? [],
        states: catalogsResult[API_ENDPOINTS.CATALOGS_STATES] ?? [],
      });
      setIsLoading(false);
    };
    void load();
  }, [id, getApplicantByIdUseCase, getCatalogsUseCase]);

  // Proposal expiry countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setProposals((prev) => {
        let changed = false;
        const updated = prev.map((p) => {
          if (p.status === 'Active' && p.expiresIn) {
            const remaining = p.expiresIn - 1000;
            changed = true;
            if (remaining <= 0) return { ...p, status: 'Expired' as const, expiresIn: 0 };
            return { ...p, expiresIn: remaining };
          }
          return p;
        });
        return changed ? updated : prev;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const hasChanges = useMemo(() => {
    if (!applicant || !initialSnapshot) return false;
    return JSON.stringify(applicant) !== JSON.stringify(initialSnapshot);
  }, [applicant, initialSnapshot]);

  const handleFieldChange = useCallback(
    (field: keyof IApplicantDetailDTO, value: unknown) => {
      setApplicant((prev) => prev ? { ...prev, [field]: value } : prev);
      if (field === 'clabe') {
        const v = value as string;
        const newErrors = { ...validationErrors };
        if (v && v.trim() !== '') {
          if (v.length !== 18) newErrors.clabe = `La CLABE debe tener 18 dígitos (actualmente: ${v.length})`;
          else if (!/^\d{18}$/.test(v)) newErrors.clabe = 'La CLABE solo debe contener números';
          else delete newErrors.clabe;
        } else delete newErrors.clabe;
        setValidationErrors(newErrors);
      }
    },
    [validationErrors],
  );

  const handleSave = useCallback(async () => {
    if (!applicant || !initialSnapshot || Object.keys(validationErrors).length > 0) return;
    setIsSaving(true);
    const result = await updateApplicantUseCase.execute({ id, data: applicant });
    if (result.success && result.data) {
      setApplicant(result.data);
      setInitialSnapshot(JSON.parse(JSON.stringify(result.data)) as IApplicantDetailDTO);
    }
    setIsSaving(false);
  }, [applicant, initialSnapshot, validationErrors, id, updateApplicantUseCase]);

  const handleCreateProposal = useCallback(
    async (data: ICreateProposalDTO) => {
      const result = await createProposalUseCase.execute(data);
      if (result.success && result.data) {
        setProposals((prev) => [result.data!, ...prev]);
        setApplicant((prev) =>
          prev ? { ...prev, applicationStatus: 'Proposal Sent' } : prev,
        );
        setInitialSnapshot((prev) =>
          prev ? { ...prev, applicationStatus: 'Proposal Sent' } : prev,
        );
      }
      return result;
    },
    [createProposalUseCase],
  );

  const handleDocumentChange = useCallback(
    (type: string, data: Partial<IApplicantDocumentDTO>) => {
      setDocuments((prev) => ({
        ...prev,
        [type]: { ...prev[type], ...data },
      }));
    },
    [],
  );

  return {
    applicant,
    documents,
    proposals,
    catalogs,
    isLoading,
    isSaving,
    hasChanges,
    validationErrors,
    handleFieldChange,
    handleSave,
    handleCreateProposal,
    handleDocumentChange,
    setDocuments,
    setProposals,
  };
}
