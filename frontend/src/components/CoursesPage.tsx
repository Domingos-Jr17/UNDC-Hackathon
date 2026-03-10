import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import MetricCard from '@/components/ui/MetricCard'
import { EmptyCourses } from '@/components/ui/EmptyState'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import Layout from './layout/Layout'
import { BookOpen, Clock, Eye, Filter, Layers3, Plus, Sparkles } from 'lucide-react'
import { useCourses } from '@/hooks/useApi'
import { Course } from '@/services/api'

const normalizeSkills = (course: Course): string[] =>
  (course.skills ?? '')
    .split(',')
    .map(skill => skill.trim())
    .filter(Boolean)

export default function CoursesPage() {
  const navigate = useNavigate()
  const { data, loading, error } = useCourses()
  const courses = data ?? []
  const [selectedLevel, setSelectedLevel] = useState<string>('all')

  const summary = useMemo(() => {
    const totalHours = courses.reduce((acc, course) => acc + course.duration_hours, 0)
    const activeCourses = courses.filter(course => course.is_active !== false).length
    const avgModules = courses.length > 0
      ? Math.round(courses.reduce((acc, course) => acc + course.modules_count, 0) / courses.length)
      : 0

    const topSkill = courses
      .flatMap(course => normalizeSkills(course))
      .reduce<Record<string, number>>((acc, skill) => {
        acc[skill] = (acc[skill] ?? 0) + 1
        return acc
      }, {})

    const leadingSkill = Object.entries(topSkill).sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'Sem competência dominante'

    return {
      totalCourses: courses.length,
      activeCourses,
      totalHours,
      avgModules,
      leadingSkill
    }
  }, [courses])

  const levels = useMemo(
    () => Array.from(new Set(courses.map(course => course.level))).sort(),
    [courses]
  )

  const filteredCourses = useMemo(() => {
    if (selectedLevel === 'all') {
      return courses
    }
    return courses.filter(course => course.level === selectedLevel)
  }, [courses, selectedLevel])

  const featuredCourse = filteredCourses[0] ?? null

  if (loading) {
    return (
      <Layout title="Gestão de cursos" subtitle="Catálogo oficial, estrutura formativa e prioridades editoriais.">
        <LoadingOverlay show={loading} message="A carregar cursos..." />
      </Layout>
    )
  }

  return (
    <Layout title="Gestão de cursos" subtitle="Organize o catálogo, avalie a cobertura formativa e abra rapidamente cada curso para revisão.">
      {error ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6 text-rose-700">{error}</CardContent>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Cursos" value={summary.totalCourses} description="Itens publicados no catálogo" icon={BookOpen} tone="primary" />
        <MetricCard title="Ativos" value={summary.activeCourses} description="Disponíveis para aprendizagem" icon={Sparkles} tone="success" />
        <MetricCard title="Carga horária" value={`${summary.totalHours}h`} description="Volume total ofertado" icon={Clock} tone="neutral" />
        <MetricCard title="Média de módulos" value={summary.avgModules} description="Profundidade média por curso" icon={Layers3} tone="warning" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-950">Leitura editorial</p>
              <p className="text-sm text-muted-foreground">
                Competência mais recorrente: <span className="font-medium text-slate-900">{summary.leadingSkill}</span>.
                {' '}Use os filtros para rever a distribuição por nível.
              </p>
            </div>
            <Button onClick={() => navigate('/courses/create')}>
              <Plus className="mr-2 h-4 w-4" />
              Criar curso
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-slate-950">
              <Filter className="h-5 w-5 text-primary" />
              Filtro por nível
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant={selectedLevel === 'all' ? 'default' : 'outline'} onClick={() => setSelectedLevel('all')}>
              Todos
            </Button>
            {levels.map(level => (
              <Button
                key={level}
                variant={selectedLevel === level ? 'default' : 'outline'}
                onClick={() => setSelectedLevel(level)}
              >
                {level}
              </Button>
            ))}
          </CardContent>
        </Card>
      </section>

      {featuredCourse ? (
        <Card className="rounded-[32px] border-white/70 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl shadow-slate-900/10">
          <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <Badge className="w-fit border-0 bg-white/10 text-white">{featuredCourse.level}</Badge>
              <div>
                <h2 className="text-2xl font-semibold">{featuredCourse.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {featuredCourse.description ?? 'Curso sem descrição detalhada. Abra o detalhe para complementar objetivos, competências e enquadramento.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-white/10 text-white">{featuredCourse.modules_count} módulos</Badge>
                <Badge variant="secondary" className="bg-white/10 text-white">{featuredCourse.duration_hours} horas</Badge>
                <Badge variant="secondary" className="bg-white/10 text-white">
                  {featuredCourse.instructor ?? 'Equipa WIRA'}
                </Badge>
              </div>
            </div>
            <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => navigate(`/courses/${featuredCourse.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              Abrir detalhe
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {filteredCourses.length === 0 ? (
        <EmptyCourses onAdd={() => navigate('/courses/create')} />
      ) : (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map(course => {
            const skills = normalizeSkills(course).slice(0, 4)
            const isActive = course.is_active !== false

            return (
              <Card key={course.id} className="rounded-[32px] border-white/70 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl text-slate-950">{course.title}</CardTitle>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {course.description ?? 'Sem descrição detalhada registada.'}
                      </p>
                    </div>
                    <Badge variant={isActive ? 'default' : 'outline'}>
                      {isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{course.level}</Badge>
                    <Badge variant="outline">{course.modules_count} módulos</Badge>
                    <Badge variant="outline">{course.duration_hours}h</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 rounded-3xl bg-slate-50 p-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Instrutor(a)</p>
                      <p className="mt-1 font-medium text-slate-950">{course.instructor ?? 'Equipa WIRA'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cobertura</p>
                      <p className="mt-1 font-medium text-slate-950">{skills.length > 0 ? `${skills.length} competências chave` : 'Sem competências'}</p>
                    </div>
                  </div>

                  <div className="flex min-h-12 flex-wrap gap-2">
                    {skills.length > 0 ? (
                      skills.map(skill => (
                        <Badge key={`${course.id}-${skill}`} variant="secondary" className="rounded-full">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Adicione competências para melhorar a leitura do catálogo.</p>
                    )}
                  </div>

                  <Button variant="outline" className="w-full" onClick={() => navigate(`/courses/${course.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalhe do curso
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </section>
      )}
    </Layout>
  )
}
