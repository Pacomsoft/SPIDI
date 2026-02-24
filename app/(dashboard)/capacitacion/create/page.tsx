"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { RoleGuard } from "@/components/role-guard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  BookOpen, 
  Upload, 
  X, 
  FileText, 
  Plus, 
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react"
import "react-quill-new/dist/quill.snow.css"

const moduleKey = "CAPACITACION"

// Editor WYSIWYG dinámico (sin SSR)
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

type TrainingType = "Obligatorio" | "Opcional" | "Política de empresa"

interface Question {
  id: string
  questionText: string
  answers: [string, string, string, string, string]
}

interface TrainingFormData {
  title: string
  type: TrainingType | ""
  contentHtml: string
  pdfDocument: File | null
  questionnaireEnabled: boolean
  questions: Question[]
  minimumScore: number
}

// Configuración del editor WYSIWYG
const quillModules = {
  toolbar: [
    ["bold", "italic"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
}

const quillFormats = ["bold", "italic", "list", "bullet", "link"]

export default function CreateTrainingPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<TrainingFormData>({
    title: "",
    type: "",
    contentHtml: "",
    pdfDocument: null,
    questionnaireEnabled: false,
    questions: [],
    minimumScore: 1,
  })

  const [saving, setSaving] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  // Inicializar con 1 pregunta cuando se activa el cuestionario
  useEffect(() => {
    if (formData.questionnaireEnabled && formData.questions.length === 0) {
      setFormData(prev => ({
        ...prev,
        questions: [{
          id: crypto.randomUUID(),
          questionText: "",
          answers: ["", "", "", "", ""]
        }]
      }))
    }
  }, [formData.questionnaireEnabled, formData.questions.length])

  // Desactivar cuestionario si cambia a "Política de empresa"
  useEffect(() => {
    if (formData.type === "Política de empresa" && formData.questionnaireEnabled) {
      setFormData(prev => ({ ...prev, questionnaireEnabled: false, questions: [] }))
    }
  }, [formData.type, formData.questionnaireEnabled])

  // Handlers
  const handleTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value as TrainingType }))
  }

  const handleQuestionnaireToggle = () => {
    setFormData(prev => ({ 
      ...prev, 
      questionnaireEnabled: !prev.questionnaireEnabled,
      questions: !prev.questionnaireEnabled ? [] : prev.questions
    }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo MIME
    if (file.type !== "application/pdf") {
      alert("Solo se permiten archivos PDF")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setFormData(prev => ({ ...prev, pdfDocument: file }))
  }

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, pdfDocument: null }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAddQuestion = () => {
    if (formData.questions.length >= 5) return

    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: crypto.randomUUID(),
          questionText: "",
          answers: ["", "", "", "", ""]
        }
      ]
    }))
  }

  const handleRemoveQuestion = (questionId: string) => {
    if (formData.questions.length <= 1) return

    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }))
  }

  const handleQuestionTextChange = (questionId: string, text: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId ? { ...q, questionText: text } : q
      )
    }))
  }

  const handleAnswerChange = (questionId: string, answerIndex: number, text: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          const newAnswers = [...q.answers] as [string, string, string, string, string]
          newAnswers[answerIndex] = text
          return { ...q, answers: newAnswers }
        }
        return q
      })
    }))
  }

  // Validaciones
  const isContentValid = useMemo(() => {
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = formData.contentHtml
    const textContent = tempDiv.textContent || tempDiv.innerText || ""
    return textContent.trim().length > 0
  }, [formData.contentHtml])

  const canAddQuestion = useMemo(() => {
    if (formData.questions.length === 0) return false
    if (formData.questions.length >= 5) return false

    const lastQuestion = formData.questions[formData.questions.length - 1]
    return (
      lastQuestion.questionText.trim().length > 0 &&
      lastQuestion.answers.every(a => a.trim().length > 0)
    )
  }, [formData.questions])

  const isQuestionnaireValid = useMemo(() => {
    if (!formData.questionnaireEnabled) return true

    if (formData.questions.length === 0) return false
    
    const allQuestionsValid = formData.questions.every(q =>
      q.questionText.trim().length > 0 &&
      q.answers.every(a => a.trim().length > 0)
    )

    const minScoreValid =
      formData.minimumScore > 0 &&
      formData.minimumScore <= formData.questions.length

    return allQuestionsValid && minScoreValid
  }, [formData.questionnaireEnabled, formData.questions, formData.minimumScore])

  const canSave = useMemo(() => {
    return (
      formData.title.trim().length > 0 &&
      formData.type !== "" &&
      isContentValid &&
      isQuestionnaireValid
    )
  }, [formData.title, formData.type, isContentValid, isQuestionnaireValid])

  // Guardar
  const handleSave = async () => {
    if (!canSave) return

    setSaving(true)

    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Generar ID incremental (dummy)
    const existingCount = Number(localStorage.getItem("trainingCount") || "0")
    const newId = `CAP-${String(existingCount + 1).padStart(4, "0")}`
    localStorage.setItem("trainingCount", String(existingCount + 1))

    // Log de auditoría
    const auditLog = {
      action: "TRAINING_CREATED",
      trainingId: newId,
      createdBy: "Usuario actual",
      createdAt: new Date().toISOString(),
      type: formData.type,
      questionnaireEnabled: formData.questionnaireEnabled,
      questionsCount: formData.questions.length,
    }
    console.log("📝 Training Created:", auditLog)

    setSaving(false)
    setShowSuccessToast(true)

    // Redirigir después de 1.5s
    setTimeout(() => {
      router.push("/capacitacion")
    }, 1500)
  }

  const isQuestionnaireCheckboxEnabled = 
    formData.type === "Obligatorio" || formData.type === "Opcional"

  return (
    <RoleGuard moduleKey={moduleKey}>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/capacitacion')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Crear capacitación</h1>
            <p className="text-muted-foreground">
              Crea un nuevo programa de formación para conductores
            </p>
          </div>
        </div>

        {/* Toast de éxito */}
        {showSuccessToast && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Capacitación creada correctamente
            </AlertDescription>
          </Alert>
        )}

        {/* Sección de contenido */}
        <Card>
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Contenido de la capacitación</CardTitle>
            </div>
            <CardDescription>
              Define la información general y el material de formación
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Título de la capacitación <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Ej: Seguridad vial básica"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Tipo <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.type} onValueChange={handleTypeChange}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Obligatorio">Obligatorio</SelectItem>
                  <SelectItem value="Opcional">Opcional</SelectItem>
                  <SelectItem value="Política de empresa">Política de empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Editor WYSIWYG */}
            <div className="space-y-2">
              <Label>
                Contenido <span className="text-destructive">*</span>
              </Label>
              <div className="border rounded-md overflow-hidden bg-white dark:bg-gray-900">
                <ReactQuill
                  theme="snow"
                  value={formData.contentHtml}
                  onChange={(value) => setFormData(prev => ({ ...prev, contentHtml: value }))}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Escribe el contenido de la capacitación..."
                  className="min-h-[200px]"
                />
              </div>
              {formData.contentHtml && !isContentValid && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  El contenido no puede estar vacío
                </p>
              )}
            </div>

            {/* Carga de PDF */}
            <div className="space-y-2">
              <Label htmlFor="pdf-upload">Documento PDF (opcional)</Label>
              {!formData.pdfDocument ? (
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    aria-label="Subir archivo PDF"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Cargar PDF
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Solo archivos PDF
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/50">
                  <FileText className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{formData.pdfDocument.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(formData.pdfDocument.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Checkbox activar cuestionario */}
            <div className="flex items-center space-x-2 pt-4 border-t">
              <input
                id="activate-questionnaire"
                type="checkbox"
                checked={formData.questionnaireEnabled}
                disabled={!isQuestionnaireCheckboxEnabled}
                onChange={handleQuestionnaireToggle}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Activar cuestionario de evaluación"
              />
              <Label
                htmlFor="activate-questionnaire"
                className={!isQuestionnaireCheckboxEnabled ? "text-muted-foreground" : ""}
              >
                ¿Activar cuestionario?
              </Label>
              {formData.type === "Política de empresa" && (
                <span className="text-xs text-muted-foreground">
                  (Solo disponible para capacitaciones Obligatorias u Opcionales)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sección de cuestionario */}
        {formData.questionnaireEnabled && (
          <Card>
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cuestionario de evaluación</CardTitle>
                  <CardDescription>
                    Agrega preguntas para certificar el conocimiento (máximo 5)
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formData.questions.length} / 5 preguntas
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Preguntas */}
              {formData.questions.map((question, qIndex) => (
                <div key={question.id} className="p-4 border rounded-lg space-y-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      Pregunta {qIndex + 1}
                    </Label>
                    {formData.questions.length > 1 && (
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

                  {/* Texto de pregunta */}
                  <div className="space-y-2">
                    <Label htmlFor={`question-${question.id}`}>Pregunta</Label>
                    <Input
                      id={`question-${question.id}`}
                      placeholder="Escribe la pregunta..."
                      value={question.questionText}
                      onChange={(e) => handleQuestionTextChange(question.id, e.target.value)}
                    />
                  </div>

                  {/* 5 respuestas */}
                  <div className="space-y-3">
                    <Label>Respuestas posibles</Label>
                    {question.answers.map((answer, aIndex) => (
                      <div key={aIndex} className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground w-6">
                          {aIndex + 1}.
                        </span>
                        <Input
                          placeholder={`Respuesta ${aIndex + 1}`}
                          value={answer}
                          onChange={(e) => handleAnswerChange(question.id, aIndex, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Botón agregar pregunta */}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddQuestion}
                disabled={!canAddQuestion}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar pregunta
              </Button>

              {/* Puntaje mínimo */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="minimum-score">
                  Puntaje mínimo requerido <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="minimum-score"
                    type="number"
                    min="1"
                    max={formData.questions.length}
                    value={formData.minimumScore}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      minimumScore: Math.max(1, Math.min(prev.questions.length, Number(e.target.value) || 1))
                    }))}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">
                    de {formData.questions.length} preguntas
                  </span>
                </div>
                {formData.minimumScore > formData.questions.length && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    El puntaje no puede ser mayor a la cantidad de preguntas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botón guardar */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Guardar capacitación
              </>
            )}
          </Button>
        </div>
      </div>
    </RoleGuard>
  )
}
