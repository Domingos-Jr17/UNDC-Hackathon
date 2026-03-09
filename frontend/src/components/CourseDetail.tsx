import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import Layout from './layout/Layout'
import { ArrowLeft, Clock, BookOpen, User, Award } from 'lucide-react'
import { useCourses } from '@/hooks/useApi'

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, loading, error } = useCourses()
  const course = useMemo(() => (data ?? []).find(item => item.id === id) ?? null, [data, id])

  const skills = useMemo(() => {
    return (course?.skills ?? '')
      .split(',')
      .map(skill => skill.trim())
      .filter(Boolean)
  }, [course?.skills])

  if (loading) {
    return (
      <Layout title="Detalhes do Curso" subtitle="Informacoes completas do curso">
        <LoadingOverlay show={loading} message="Carregando detalhes do curso..." />
      </Layout>
    )
  }

  if (error || !course) {
    return (
      <Layout title="Detalhes do Curso" subtitle="Informacoes completas do curso">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-destructive">Curso nao encontrado</h2>
            <p className="text-muted-foreground mt-2">{error ?? 'Nao foi possivel localizar o curso solicitado.'}</p>
            <Button className="mt-4" onClick={() => navigate('/courses')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Cursos
            </Button>
          </CardContent>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout title="Detalhes do Curso" subtitle={course.title}>
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Cursos
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{course.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge>{course.level}</Badge>
              <Badge variant="outline">{course.modules_count} modulos</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{course.description ?? 'Sem descricao detalhada.'}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4" /> Duracao</div>
                <p className="text-xl font-semibold">{course.duration_hours}h</p>
              </div>
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-1"><BookOpen className="h-4 w-4" /> Modulos</div>
                <p className="text-xl font-semibold">{course.modules_count}</p>
              </div>
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-1"><User className="h-4 w-4" /> Instrutor</div>
                <p className="text-xl font-semibold">{course.instructor ?? 'Equipe WIRA'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Award className="h-4 w-4" /> Competencias</h3>
              <div className="flex flex-wrap gap-2">
                {skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma competencia cadastrada.</p>
                ) : (
                  skills.map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
