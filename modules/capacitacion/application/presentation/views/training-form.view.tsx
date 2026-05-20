'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import { ArrowLeft, Upload, X, FileText, Plus, Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';import { RoleGuard } from '@/modules/adm/application/presentation/components/role-guard';
import { createCheckModuleAccessUseCase } from '@/modules/adm/infrastructure/dependency-injection';
import type { ICreateTrainingUseCase } from '../../../domain/contracts/create-training-use-case.interface';
import type { TrainingType, IQuestionDTO } from '../../../domain/contracts/training.dto';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Icon } from '@/components/ui/icon';
import { RichTextEditor } from '../components/rich-text-editor';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const checkModuleAccessUseCase = createCheckModuleAccessUseCase();

interface ITrainingFormViewProps {
  createTrainingUseCase: ICreateTrainingUseCase;
}

interface ILocalQuestion {
  id: string;
  questionText: string;
  answers: [string, string, string, string, string];
  correctOption: number;
}

interface IFormState {
  title: string;
  trainingType: TrainingType | '';
  content: string;
  pdfFile: File | null;
  hasQuiz: boolean;
  questions: ILocalQuestion[];
  minimumScore: number;
  isOnboarding: boolean;
}

const buildEmptyQuestion = (): ILocalQuestion => ({
  id: crypto.randomUUID(),
  questionText: '',
  answers: ['', '', '', '', ''],
  correctOption: 0,
});

export function TrainingFormView({ createTrainingUseCase }: ITrainingFormViewProps) {
  const { navigateTo, navigateBack } = useNavigationLoading();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<IFormState>({
    title: '',
    trainingType: '',
    content: '',
    pdfFile: null,
    hasQuiz: false,
    questions: [],
    minimumScore: 1,
    isOnboarding: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  // Auto-init 1 pregunta al activar cuestionario
  useEffect(() => {
    if (form.hasQuiz && form.questions.length === 0) {
      setForm(prev => ({ ...prev, questions: [buildEmptyQuestion()] }));
    }
  }, [form.hasQuiz, form.questions.length]);

  // Deshabilitar cuestionario si tipo cambia a CompanyPolicy
  useEffect(() => {
    if (form.trainingType === 'CompanyPolicy' && form.hasQuiz) {
      setForm(prev => ({ ...prev, hasQuiz: false, questions: [] }));
    }
  }, [form.trainingType, form.hasQuiz]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setForm(prev => ({ ...prev, pdfFile: file }));
  };

  const handleRemoveFile = () => {
    setForm(prev => ({ ...prev, pdfFile: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddQuestion = () => {
    if (form.questions.length >= 5) return;
    setForm(prev => ({ ...prev, questions: [...prev.questions, buildEmptyQuestion()] }));
  };

  const handleRemoveQuestion = (id: string) => {
    if (form.questions.length <= 1) return;
    setForm(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== id) }));
  };

  const handleQuestionChange = useCallback((id: string, field: 'questionText' | 'correctOption', value: string | number) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, [field]: value } : q),
    }));
  }, []);

  const handleAnswerChange = useCallback((questionId: string, answerIndex: number, value: string) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id !== questionId) return q;
        const answers = [...q.answers] as [string, string, string, string, string];
        answers[answerIndex] = value;
        return { ...q, answers };
      }),
    }));
  }, []);

  const isQuizEnabled = form.trainingType === 'Mandatory' || form.trainingType === 'Optional';

  const canAddQuestion = useMemo(() => {
    if (form.questions.length >= 5) return false;
    const last = form.questions[form.questions.length - 1];
    if (!last) return false;
    return last.questionText.trim().length > 0 && last.answers.every(a => a.trim().length > 0);
  }, [form.questions]);

  const isQuizValid = useMemo(() => {
    if (!form.hasQuiz) return true;
    if (form.questions.length === 0) return false;
    const allValid = form.questions.every(
      q => q.questionText.trim().length > 0 && q.answers.every(a => a.trim().length > 0)
    );
    return allValid && form.minimumScore > 0 && form.minimumScore <= form.questions.length;
  }, [form.hasQuiz, form.questions, form.minimumScore]);

  const isContentEmpty = (html: string) => {
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text.length === 0;
  };

  const canSave = useMemo(() => (
    form.title.trim().length > 0 &&
    form.trainingType !== '' &&
    !isContentEmpty(form.content) &&
    isQuizValid
  ), [form.title, form.trainingType, form.content, isQuizValid]);

  const handleSave = async () => {
    if (!canSave || !form.trainingType) return;
    setIsSaving(true);

    const questions: IQuestionDTO[] | undefined = form.hasQuiz && form.questions.length > 0
      ? form.questions.map((q, qi) => ({
          questionIndex: qi,
          questionText: q.questionText,
          options: q.answers.map((text, oi) => ({ optionIndex: oi, text })),
          correctOption: q.correctOption,
        }))
      : undefined;

    await createTrainingUseCase.execute({
      title: form.title,
      trainingType: form.trainingType as TrainingType,
      content: form.content,
      hasQuiz: form.hasQuiz,
      questions,
      minimumScore: form.hasQuiz ? form.minimumScore : undefined,
      isOnboarding: form.isOnboarding,
    });

    setIsSaving(false);
    setTimeout(() => navigateBack('/adm/capacitacion'), 1500);
  };

  return (
    <RoleGuard moduleKey="CAPACITACION" checkModuleAccessUseCase={checkModuleAccessUseCase}>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigateBack('/adm/capacitacion')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Crear capacitación</h1>
            <p className="text-muted-foreground">Crea un nuevo programa de formación para conductores</p>
          </div>
        </div>

        {/* Sección Contenido */}
        <Card>
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center gap-2">
              <Icon name="menu_book" size={20} className="text-muted-foreground" />
              <CardTitle>Contenido de la capacitación</CardTitle>
            </div>
            <CardDescription>Define la información general y el material de formación</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Fila 1: Título + Tipo + Onboarding + ¿Activar cuestionario? */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-4 items-end">
              {/* Título */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">
                  Título <span className="text-destructive">*</span>
                </p>
                <Input
                  id="title"
                  placeholder="Ej: Seguridad vial básica"
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Tipo */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">
                  Tipo <span className="text-destructive">*</span>
                </p>
                <Select value={form.trainingType} onValueChange={v => setForm(prev => ({ ...prev, trainingType: v as TrainingType }))}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mandatory">Obligatorio</SelectItem>
                    <SelectItem value="Optional">Opcional</SelectItem>
                    <SelectItem value="CompanyPolicy">Política de empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Onboarding */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Onboarding</p>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                          <Icon name="info" size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        Las capacitaciones de tipo onboarding son enviadas en automático a todos los drivers activos de manera masiva y se muestran de manera predeterminada a los drivers nuevos.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className={`flex items-center gap-2 h-9 px-3 border rounded-md bg-background`}>
                  <input
                    id="is-onboarding"
                    type="checkbox"
                    checked={form.isOnboarding}
                    onChange={() => setForm(prev => ({ ...prev, isOnboarding: !prev.isOnboarding }))}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="is-onboarding" className="text-sm whitespace-nowrap cursor-pointer">
                    Activar
                  </label>
                </div>
              </div>

              {/* Activar cuestionario */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">
                  Cuestionario
                </p>
                <div className={`flex items-center gap-2 h-9 px-3 border rounded-md bg-background ${!isQuizEnabled ? 'opacity-50' : ''}`}>
                  <input
                    id="activate-quiz"
                    type="checkbox"
                    checked={form.hasQuiz}
                    disabled={!isQuizEnabled}
                    onChange={() => setForm(prev => ({ ...prev, hasQuiz: !prev.hasQuiz, questions: prev.hasQuiz ? [] : prev.questions }))}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:cursor-not-allowed"
                  />
                  <label
                    htmlFor="activate-quiz"
                    className={`text-sm whitespace-nowrap ${!isQuizEnabled ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}`}
                  >
                    ¿Activar?
                  </label>
                </div>
                {form.trainingType === 'CompanyPolicy' && (
                  <p className="text-xs text-muted-foreground">Solo Obligatorio u Opcional</p>
                )}
              </div>
            </div>

            {/* Contenido WYSIWYG */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">
                Contenido <span className="text-destructive">*</span>
              </p>
              <RichTextEditor
                value={form.content}
                onChange={value => setForm(prev => ({ ...prev, content: value }))}
                placeholder="Escribe el contenido de la capacitación..."
                minHeight={220}
              />
            </div>

            {/* PDF */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">
                Documento PDF <span className="text-muted-foreground font-normal normal-case tracking-normal">(opcional)</span>
              </p>
              {!form.pdfFile ? (
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />Cargar PDF
                  </Button>
                  <span className="text-sm text-muted-foreground">Solo archivos PDF</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/50">
                  <FileText className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{form.pdfFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(form.pdfFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sección Cuestionario */}
        {form.hasQuiz && (
          <Card>
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="quiz" size={20} className="text-muted-foreground" />
                  <div>
                    <CardTitle>Cuestionario de evaluación</CardTitle>
                    <CardDescription>Agrega preguntas para certificar el conocimiento (máximo 5)</CardDescription>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{form.questions.length} / 5 preguntas</span>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">

              {/* Puntaje mínimo — al inicio, antes de las preguntas */}
              <div className="flex items-end gap-4 p-4 border rounded-lg bg-muted/20">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">
                    Puntaje mínimo requerido <span className="text-destructive">*</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      id="min-score"
                      type="number"
                      min="1"
                      max={form.questions.length}
                      value={form.minimumScore}
                      onChange={e => setForm(prev => ({
                        ...prev,
                        minimumScore: Math.max(1, Math.min(prev.questions.length || 1, Number(e.target.value) || 1)),
                      }))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">de {form.questions.length} pregunta{form.questions.length !== 1 ? 's' : ''}</span>
                  </div>
                  {form.minimumScore > form.questions.length && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      El puntaje no puede ser mayor a la cantidad de preguntas
                    </p>
                  )}
                </div>
              </div>

              {/* Preguntas */}
              {form.questions.map((question, qi) => (
                <div key={question.id} className="p-4 border rounded-lg space-y-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Pregunta {qi + 1}</p>
                    {form.questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveQuestion(question.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Pregunta</p>
                    <Input
                      id={`q-${question.id}`}
                      placeholder="Escribe la pregunta..."
                      value={question.questionText}
                      onChange={e => handleQuestionChange(question.id, 'questionText', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Respuestas posibles</p>
                    {question.answers.map((answer, ai) => (
                      <div key={ai} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctOption === ai}
                          onChange={() => handleQuestionChange(question.id, 'correctOption', ai)}
                          className="h-4 w-4 text-primary"
                          title={`Respuesta correcta ${ai + 1}`}
                        />
                        <span className="text-sm text-muted-foreground w-6">{ai + 1}.</span>
                        <Input
                          placeholder={`Respuesta ${ai + 1}`}
                          value={answer}
                          onChange={e => handleAnswerChange(question.id, ai, e.target.value)}
                        />
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">Selecciona el radio de la respuesta correcta</p>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={handleAddQuestion} disabled={!canAddQuestion} className="w-full">
                <Plus className="h-4 w-4 mr-2" />Agregar pregunta
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Botones */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => navigateBack('/adm/capacitacion')} disabled={isSaving}>
            ← Cancelar
          </Button>
          <Button onClick={() => { void handleSave(); }} disabled={!canSave || isSaving}>
            {isSaving
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</>
              : <><CheckCircle2 className="h-4 w-4 mr-2" />Guardar capacitación</>}
          </Button>
        </div>
      </div>
    </RoleGuard>
  );
}
