import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import Layout from './layout/Layout'
import { ArrowLeft, BookOpen, Clock, ExternalLink, FileText, Layers3, PlayCircle, Sparkles, Type, User } from 'lucide-react'
import { useCourseModules, useCourses } from '@/hooks/useApi'

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, loading, error } = useCourses()
  const { data: modules } = useCourseModules(id ?? '')
  const course = useMemo(() => (data ?? []).find(item => item.id === id) ?? null, [data, id])

  const skills = useMemo(() => {
    return (course?.skills ?? '')
      .split(',')
      .map(skill => skill.trim())
      .filter(Boolean)
  }, [course?.skills])

  const moduleContentSummary = useMemo(() => {
    const items = modules ?? []

    return items.reduce(
      (acc, module) => {
        if (module.videoUrl) acc.video += 1
        if (module.pdfUrl) acc.pdf += 1
        if (module.textContent) acc.text += 1
        if (
          [module.videoUrl, module.pdfUrl, module.textContent].filter(Boolean).length > 1
        ) {
          acc.mixed += 1
        }
        return acc
      },
      { video: 0, pdf: 0, text: 0, mixed: 0 }
    )
  }, [modules])

  if (loading) {
    return (
        <Layout title="Detalhe do curso" subtitle="Estrutura, enquadramento e materiais associados.">
          <LoadingOverlay show={loading} message="A carregar o detalhe do curso..." />
        </Layout>
    )
  }

  if (error || !course) {
    return (
        <Layout title="Detalhe do curso" subtitle="Estrutura, enquadramento e materiais associados.">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-destructive">Curso não encontrado</h2>
              <p className="mt-2 text-muted-foreground">{error ?? 'Não foi possível localizar o curso pedido.'}</p>
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
                  {course.is_active === false ? 'Inactivo' : 'Activo'}
                </Badge>
              </div>
              <div>
                <h2 className="text-3xl font-semibold">{course.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {course.description ?? 'Sem descrição detalhada. Este curso está registado, mas ainda precisa de enquadramento editorial para facilitar o acompanhamento e a comunicação.'}
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
                  <p className="text-sm text-muted-foreground">Nenhuma competência registada. Convém completar esta informação para melhorar o catálogo, a pesquisa e os relatórios.</p>
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
                    Curso de nível {course.level.toLowerCase()} com {course.duration_hours} horas distribuídas por {course.modules_count} módulos.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-medium text-slate-950">Modelo de conteúdo</p>
                  <p className="mt-1 leading-6">
                    Cada módulo pode combinar vídeo, PDF e texto. Nenhum destes materiais é obrigatório de forma isolada.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <QuickStat label="Módulos com vídeo" value={String(moduleContentSummary.video)} />
                  <QuickStat label="Módulos com PDF" value={String(moduleContentSummary.pdf)} />
                  <QuickStat label="Módulos com texto" value={String(moduleContentSummary.text)} />
                  <QuickStat label="Conteúdo misto" value={String(moduleContentSummary.mixed)} />
                </div>
              </CardContent>
            </Card>
          </section>

        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">Materiais por módulo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!modules || modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este curso ainda não tem módulos publicados. Pode criá-los com vídeo, PDF, texto ou qualquer combinação destes materiais.
              </p>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {modules.map(module => {
                  const hasVideo = Boolean(module.videoUrl)
                  const hasPdf = Boolean(module.pdfUrl)
                  const hasText = Boolean(module.textContent)
                  const contentCount = [hasVideo, hasPdf, hasText].filter(Boolean).length
                  const primaryFormat = hasVideo ? 'Vídeo' : hasPdf ? 'PDF' : hasText ? 'Texto' : 'Sem material'
                  const recommendedAction = hasVideo
                    ? 'Comece pelo vídeo e use o texto ou o PDF como apoio.'
                    : hasPdf
                      ? 'Use o PDF como material principal deste módulo.'
                      : hasText
                        ? 'Este módulo foi publicado como leitura guiada.'
                        : 'Este módulo ainda não tem material publicado.'

                  return (
                    <div key={module.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-primary">Módulo {module.id}</p>
                          <h3 className="text-lg font-semibold text-slate-950">{module.title}</h3>
                        </div>
                        <Badge variant="outline">{module.duration}</Badge>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {module.description ?? 'Sem descrição breve publicada.'}
                      </p>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Material principal</p>
                          <p className="mt-2 text-base font-semibold text-slate-950">{primaryFormat}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{recommendedAction}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Composição do módulo</p>
                          <p className="mt-2 text-base font-semibold text-slate-950">
                            {contentCount === 0 ? 'Sem materiais' : `${contentCount} formato${contentCount > 1 ? 's' : ''} publicado${contentCount > 1 ? 's' : ''}`}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {hasText ? 'O texto ajuda a consolidar a aprendizagem.' : 'Se necessário, complemente com texto ou PDF para ampliar o contexto.'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant={hasVideo ? 'default' : 'secondary'} className={hasVideo ? 'bg-primary text-white' : ''}>
                          <PlayCircle className="mr-1 h-3.5 w-3.5" />
                          {hasVideo ? 'Vídeo' : 'Sem vídeo'}
                        </Badge>
                        <Badge variant={hasPdf ? 'default' : 'secondary'} className={hasPdf ? 'bg-slate-900 text-white' : ''}>
                          <FileText className="mr-1 h-3.5 w-3.5" />
                          {hasPdf ? 'PDF' : 'Sem PDF'}
                        </Badge>
                        <Badge variant={hasText ? 'default' : 'secondary'} className={hasText ? 'bg-emerald-600 text-white' : ''}>
                          <Type className="mr-1 h-3.5 w-3.5" />
                          {hasText ? 'Texto' : 'Sem texto'}
                        </Badge>
                      </div>

                      {(hasVideo || hasPdf) ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {module.videoUrl ? (
                            <Button asChild size="sm" className="rounded-xl">
                              <a href={module.videoUrl} target="_blank" rel="noreferrer">
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Abrir vídeo
                                <ExternalLink className="ml-2 h-3.5 w-3.5" />
                              </a>
                            </Button>
                          ) : null}
                          {module.pdfUrl ? (
                            <Button asChild size="sm" variant="outline" className="rounded-xl">
                              <a href={module.pdfUrl} target="_blank" rel="noreferrer">
                                <FileText className="mr-2 h-4 w-4" />
                                Abrir PDF
                                <ExternalLink className="ml-2 h-3.5 w-3.5" />
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      ) : null}

                      {module.textContent ? (
                        <div className="mt-4 rounded-2xl bg-white p-4 text-sm leading-7 text-slate-700">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Conteúdo textual do módulo</p>
                          <p className="whitespace-pre-line">{module.textContent}</p>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
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
