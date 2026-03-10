import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import Layout from './layout/Layout'
import { ArrowLeft, BookOpen, Clock, Layers3, Sparkles, User } from 'lucide-react'
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
      <Layout title="Detalhe do curso" subtitle="Estrutura, enquadramento e competências associadas.">
        <LoadingOverlay show={loading} message="A carregar detalhe do curso..." />
      </Layout>
    )
  }

  if (error || !course) {
    return (
      <Layout title="Detalhe do curso" subtitle="Estrutura, enquadramento e competências associadas.">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-destructive">Curso não encontrado</h2>
            <p className="mt-2 text-muted-foreground">{error ?? 'Não foi possível localizar o curso solicitado.'}</p>
            <Button className="mt-4" onClick={() => navigate('/courses')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para cursos
            </Button>
          </CardContent>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout title="Detalhe do curso" subtitle={course.title}>
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para cursos
        </Button>

        <Card className="rounded-[32px] border-white/70 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl shadow-slate-900/10">
          <CardContent className="flex flex-col gap-6 p-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="border-0 bg-white/10 text-white">{course.level}</Badge>
                <Badge variant="secondary" className="bg-white/10 text-white">{course.modules_count} módulos</Badge>
                <Badge variant="secondary" className="bg-white/10 text-white">
                  {course.is_active === false ? 'Inativo' : 'Ativo'}
                </Badge>
              </div>
              <div>
                <h2 className="text-3xl font-semibold">{course.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {course.description ?? 'Sem descrição detalhada. Este curso já está registado, mas ainda precisa de enquadramento editorial para facilitar acompanhamento e comunicação.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="bg-white text-slate-950 hover:bg-slate-100" onClick={() => navigate('/courses/create')}>
                <Sparkles className="mr-2 h-4 w-4" />
                Novo curso
              </Button>
              <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => navigate('/reports')}>
                Ver relatórios
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard icon={Clock} label="Duração" value={`${course.duration_hours} horas`} />
          <InfoCard icon={Layers3} label="Módulos" value={`${course.modules_count} módulos`} />
          <InfoCard icon={User} label="Instrutor(a)" value={course.instructor ?? 'Equipa WIRA'} />
          <InfoCard icon={BookOpen} label="Competências" value={skills.length > 0 ? `${skills.length} registadas` : 'Por completar'} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.78fr]">
          <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-950">Competências associadas</CardTitle>
            </CardHeader>
            <CardContent>
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma competência registada. Vale a pena complementar para melhorar catálogo, pesquisa e relatórios.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="rounded-full">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-950">Leitura rápida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-950">Enquadramento</p>
                <p className="mt-1 leading-6">
                  Curso de nível {course.level.toLowerCase()} com {course.duration_hours} horas distribuídas em {course.modules_count} módulos.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-950">Uso recomendado</p>
                <p className="mt-1 leading-6">
                  Bom para revisão de catálogo, alinhamento pedagógico e prestação de contas sobre a oferta existente.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Clock
  label: string
  value: string
}) {
  return (
    <Card className="rounded-[28px] border-white/70 bg-white shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-base font-semibold text-slate-950">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
