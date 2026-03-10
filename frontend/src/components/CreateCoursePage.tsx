import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import Layout from './layout/Layout'
import { apiService, ApiError } from '@/services/api'

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
      toast.error('Informe o titulo do curso.')
      return
    }
    if (!form.level.trim()) {
      toast.error('Informe o nivel do curso.')
      return
    }
    if (!Number.isInteger(durationHours) || durationHours < 1) {
      toast.error('Duracao deve ser um numero inteiro maior que zero.')
      return
    }
    if (!Number.isInteger(modulesCount) || modulesCount < 1) {
      toast.error('Quantidade de módulos deve ser um número inteiro maior que zero.')
      return
    }

    setSaving(true)
    const toastId = toast.loading('Criando curso...')

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
    <Layout title="Criar Curso" subtitle="Cadastro real de curso no backend">
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Cursos
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Novo Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={event => void handleSubmit(event)}>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Titulo</Label>
                <Input
                  id="title"
                  placeholder="Costura Avancada"
                  value={form.title}
                  onChange={event => setField('title', event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Nivel</Label>
                <Input
                  id="level"
                  placeholder="Intermediario"
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
                <Label htmlFor="duration">Duracao (horas)</Label>
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
                <Label htmlFor="modules">Modulos</Label>
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
                <Label htmlFor="skills">Competencias (separadas por virgula)</Label>
                <Input
                  id="skills"
                  placeholder="Costura reta, Acabamento, Controle de qualidade"
                  value={form.skills}
                  onChange={event => setField('skills', event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descricao</Label>
                <Textarea
                  id="description"
                  rows={5}
                  placeholder="Resumo do curso e objetivos."
                  value={form.description}
                  onChange={event => setField('description', event.target.value)}
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate('/courses')}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Salvando...' : 'Criar Curso'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

