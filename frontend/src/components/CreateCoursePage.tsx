import { ChangeEvent, FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, BookOpen, FileText, PlayCircle, Save, Sparkles } from 'lucide-react'
import Layout from './layout/Layout'
import { apiService, ApiError, CreateCourseModuleInput } from '@/services/api'
import { invalidateApiCache } from '@/hooks/useApi'

interface ModuleDraft {
  title: string
  description: string
  durationMinutes: string
  videoUrl: string
  pdfUrl: string
  textContent: string
  downloadable: boolean
}

interface CreateCourseFormState {
  title: string
  description: string
  instructor: string
  durationHours: string
  modulesCount: string
  level: string
  skills: string
  modules: ModuleDraft[]
}

const createEmptyModule = (index: number): ModuleDraft => ({
  title: `Módulo ${index + 1}`,
  description: '',
  durationMinutes: '30',
  videoUrl: '',
  pdfUrl: '',
  textContent: '',
  downloadable: false
})

const initialState: CreateCourseFormState = {
  title: '',
  description: '',
  instructor: '',
  durationHours: '',
  modulesCount: '3',
  level: '',
  skills: '',
  modules: [createEmptyModule(0), createEmptyModule(1), createEmptyModule(2)]
}

const normalizeApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Não foi possível criar o curso.'
}

const syncModuleDrafts = (modules: ModuleDraft[], nextCount: number): ModuleDraft[] => {
  if (nextCount <= 0) return []
  if (modules.length === nextCount) return modules
  if (modules.length > nextCount) return modules.slice(0, nextCount)

  const appended = Array.from({ length: nextCount - modules.length }, (_, index) =>
    createEmptyModule(modules.length + index)
  )
  return [...modules, ...appended]
}

export default function CreateCoursePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<CreateCourseFormState>(initialState)
  const [saving, setSaving] = useState(false)

  const setField = (field: keyof Omit<CreateCourseFormState, 'modules'>, value: string): void => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const setModuleField = (index: number, field: keyof ModuleDraft, value: string | boolean): void => {
    setForm(prev => ({
      ...prev,
      modules: prev.modules.map((module, moduleIndex) =>
        moduleIndex === index ? { ...module, [field]: value } : module
      )
    }))
  }

  const handleModulesCountChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value
    const numericValue = Number(value)

    setForm(prev => ({
      ...prev,
      modulesCount: value,
      modules: Number.isInteger(numericValue) && numericValue > 0
        ? syncModuleDrafts(prev.modules, numericValue)
        : prev.modules
    }))
  }

  const contentSummary = useMemo(() => {
    return form.modules.reduce(
      (acc, module) => {
        if (module.videoUrl.trim()) acc.video += 1
        if (module.pdfUrl.trim()) acc.pdf += 1
        if (module.textContent.trim()) acc.text += 1
        return acc
      },
      { video: 0, pdf: 0, text: 0 }
    )
  }, [form.modules])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    const durationHours = Number(form.durationHours)
    const modulesCount = Number(form.modulesCount)

    if (!form.title.trim()) {
      toast.error('Indique o título do curso.')
      return
    }
    if (!form.level.trim()) {
      toast.error('Indique o nível do curso.')
      return
    }
    if (!Number.isInteger(durationHours) || durationHours < 1) {
      toast.error('A duração deve ser um número inteiro superior a zero.')
      return
    }
    if (!Number.isInteger(modulesCount) || modulesCount < 1) {
      toast.error('A quantidade de módulos deve ser um número inteiro superior a zero.')
      return
    }

    const modules = syncModuleDrafts(form.modules, modulesCount)
    for (const [index, module] of modules.entries()) {
      if (!module.title.trim()) {
        toast.error(`O módulo ${index + 1} precisa de um título.`)
        return
      }

      const durationMinutes = Number(module.durationMinutes)
      if (!Number.isInteger(durationMinutes) || durationMinutes < 1) {
        toast.error(`O módulo ${index + 1} precisa de uma duração válida em minutos.`)
        return
      }
    }

    const payloadModules: CreateCourseModuleInput[] = modules.map(module => {
      const videoUrl = module.videoUrl.trim()
      const pdfUrl = module.pdfUrl.trim()
      const textContent = module.textContent.trim()

      return {
        title: module.title.trim(),
        description: module.description.trim() || undefined,
        duration_minutes: Number(module.durationMinutes),
        video_url: videoUrl || undefined,
        pdf_url: pdfUrl || undefined,
        text_content: textContent || undefined,
        downloadable: module.downloadable || Boolean(videoUrl || pdfUrl)
      }
    })

    setSaving(true)
    const toastId = toast.loading('A criar curso...')

    try {
      const course = await apiService.createCourse({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        instructor: form.instructor.trim() || undefined,
        duration_hours: durationHours,
        modules_count: modulesCount,
        level: form.level.trim(),
        skills: form.skills.trim() || undefined,
        modules: payloadModules
      })

      invalidateApiCache(cacheKey =>
        cacheKey === 'courses' || cacheKey.startsWith('course-modules:')
      )
      toast.dismiss(toastId)
      toast.success('Curso criado com sucesso.')
      navigate(`/courses/${course.id}`)
    } catch (error) {
      toast.dismiss(toastId)
      toast.error(normalizeApiError(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout
      title="Criar curso"
      subtitle="Registe o curso e publique módulos com vídeo, PDF e texto como materiais opcionais."
    >
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para cursos
        </Button>

        <form className="space-y-6" onSubmit={event => void handleSubmit(event)}>
          <section className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
            <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-slate-950">Dados principais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Costura avançada para rendimento local"
                    value={form.title}
                    onChange={event => setField('title', event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Nível</Label>
                  <Input
                    id="level"
                    placeholder="Intermédio"
                    value={form.level}
                    onChange={event => setField('level', event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructor">Instrutor(a)</Label>
                  <Input
                    id="instructor"
                    placeholder="Equipa WIRA"
                    value={form.instructor}
                    onChange={event => setField('instructor', event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (horas)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    step={1}
                    placeholder="40"
                    value={form.durationHours}
                    onChange={event => setField('durationHours', event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modules">Módulos</Label>
                  <Input
                    id="modules"
                    type="number"
                    min={1}
                    step={1}
                    placeholder="8"
                    value={form.modulesCount}
                    onChange={handleModulesCountChange}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="skills">Competências-chave</Label>
                  <Input
                    id="skills"
                    placeholder="Corte, acabamento, controlo de qualidade"
                    value={form.skills}
                    onChange={event => setField('skills', event.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    rows={5}
                    placeholder="Explique o objectivo do curso, o que será aprendido e para quem este conteúdo faz mais sentido."
                    value={form.description}
                    onChange={event => setField('description', event.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-[32px] border-primary/15 bg-primary/5 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-950">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Antes de publicar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-700">
                  <div className="rounded-2xl bg-white p-4">
                    Vídeo e PDF são opcionais. Cada módulo pode ser só texto, só PDF, só vídeo ou uma combinação.
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    Use texto nos módulos para orientações, resumos académicos, instruções práticas e passos de segurança.
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    Se ainda não tiver materiais prontos, o curso pode nascer com módulos base e ser enriquecido mais tarde.
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-950">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Resumo de materiais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <p>{form.modules.length} módulos preparados para este curso.</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-medium text-slate-950">Vídeos</p>
                      <p className="mt-1 text-2xl font-semibold">{contentSummary.video}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-medium text-slate-950">PDFs</p>
                      <p className="mt-1 text-2xl font-semibold">{contentSummary.pdf}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-medium text-slate-950">Textos</p>
                      <p className="mt-1 text-2xl font-semibold">{contentSummary.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Módulos e materiais</h2>
                <p className="text-sm text-muted-foreground">
                  Preencha o essencial de cada módulo. Vídeo e PDF são opcionais; o texto pode ser o conteúdo principal.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {syncModuleDrafts(form.modules, Number(form.modulesCount) || form.modules.length).map((module, index) => (
                <Card key={`module-${index}`} className="rounded-[28px] border-white/70 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-slate-950">Módulo {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`module-title-${index}`}>Título do módulo</Label>
                        <Input
                          id={`module-title-${index}`}
                          value={module.title}
                          onChange={event => setModuleField(index, 'title', event.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`module-duration-${index}`}>Duração (minutos)</Label>
                        <Input
                          id={`module-duration-${index}`}
                          type="number"
                          min={1}
                          step={1}
                          value={module.durationMinutes}
                          onChange={event => setModuleField(index, 'durationMinutes', event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`module-description-${index}`}>Descrição breve</Label>
                      <Textarea
                        id={`module-description-${index}`}
                        rows={3}
                        placeholder="Indique qual é o foco deste módulo."
                        value={module.description}
                        onChange={event => setModuleField(index, 'description', event.target.value)}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`module-video-${index}`} className="flex items-center gap-2">
                          <PlayCircle className="h-4 w-4 text-primary" />
                          URL do vídeo
                        </Label>
                        <Input
                          id={`module-video-${index}`}
                          placeholder="https://..."
                          value={module.videoUrl}
                          onChange={event => setModuleField(index, 'videoUrl', event.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`module-pdf-${index}`} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          URL do PDF
                        </Label>
                        <Input
                          id={`module-pdf-${index}`}
                          placeholder="https://..."
                          value={module.pdfUrl}
                          onChange={event => setModuleField(index, 'pdfUrl', event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`module-text-${index}`}>Texto informativo / académico</Label>
                      <Textarea
                        id={`module-text-${index}`}
                        rows={6}
                        placeholder="Cole aqui o conteúdo textual do módulo. Este campo pode substituir o vídeo ou o PDF quando necessário."
                        value={module.textContent}
                        onChange={event => setModuleField(index, 'textContent', event.target.value)}
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={module.downloadable}
                        onChange={event => setModuleField(index, 'downloadable', event.target.checked)}
                      />
                      Disponibilizar este módulo para acesso offline quando houver ficheiro ou pacote para descarregar.
                    </label>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/courses')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'A guardar...' : 'Criar curso'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
