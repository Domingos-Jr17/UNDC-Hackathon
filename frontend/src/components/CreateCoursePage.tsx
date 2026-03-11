import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, BookOpen, Save, Sparkles } from 'lucide-react'
import Layout from './layout/Layout'
import { apiService, ApiError } from '@/services/api'
import { invalidateApiCache } from '@/hooks/useApi'

interface CreateCourseFormState {
  title: string
  description: string
  instructor: string
  durationHours: string
  modulesCount: string
  level: string
  skills: string
}

const initialState: CreateCourseFormState = {
  title: '',
  description: '',
  instructor: '',
  durationHours: '',
  modulesCount: '',
  level: '',
  skills: ''
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

export default function CreateCoursePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<CreateCourseFormState>(initialState)
  const [saving, setSaving] = useState(false)

  const setField = (field: keyof CreateCourseFormState, value: string): void => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    const durationHours = Number(form.durationHours)
    const modulesCount = Number(form.modulesCount)

    if (!form.title.trim()) {
      toast.error('Informe o título do curso.')
      return
    }
    if (!form.level.trim()) {
      toast.error('Informe o nível do curso.')
      return
    }
    if (!Number.isInteger(durationHours) || durationHours < 1) {
      toast.error('A duração deve ser um número inteiro maior que zero.')
      return
    }
    if (!Number.isInteger(modulesCount) || modulesCount < 1) {
      toast.error('A quantidade de módulos deve ser um número inteiro maior que zero.')
      return
    }

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
        skills: form.skills.trim() || undefined
      })

      invalidateApiCache('courses')
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
    <Layout title="Criar curso" subtitle="Registe um novo percurso formativo com estrutura suficiente para equipa, beneficiárias e relatórios.">
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para cursos
        </Button>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
          <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-950">Dados principais</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={event => void handleSubmit(event)}>
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
                    onChange={event => setField('modulesCount', event.target.value)}
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
                    rows={6}
                    placeholder="Explique o objetivo do curso, o que será aprendido e para quem este conteúdo faz mais sentido."
                    value={form.description}
                    onChange={event => setField('description', event.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 md:col-span-2">
                  <Button type="button" variant="outline" onClick={() => navigate('/courses')}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'A guardar...' : 'Criar curso'}
                  </Button>
                </div>
              </form>
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
                  Dê um título específico. Ele deve ajudar a equipa a perceber rapidamente o foco do curso.
                </div>
                <div className="rounded-2xl bg-white p-4">
                  Liste competências separadas por vírgula. Isso melhora a leitura do catálogo e o detalhe do curso.
                </div>
                <div className="rounded-2xl bg-white p-4">
                  Use a descrição para dizer objetivo, público-alvo e resultado esperado.
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-950">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Qualidade mínima
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Um bom curso precisa de:</p>
                <ul className="space-y-2 text-slate-700">
                  <li>um nível coerente com a dificuldade real</li>
                  <li>carga horária proporcional ao número de módulos</li>
                  <li>descrição suficiente para orientar quem vai acompanhar o progresso</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  )
}
