import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BriefcaseBusiness, MapPin, Plus, Sparkles, Workflow } from 'lucide-react'
import { toast } from 'sonner'
import Layout from './layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import MetricCard from '@/components/ui/MetricCard'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { Job, JobMutationInput } from '@/services/api'
import { apiService } from '@/services/api'
import { useEmployers, useJobsAdmin, invalidateApiCache } from '@/hooks/useApi'

const jobStatuses = ['DRAFT', 'VALIDATED', 'OPEN', 'CLOSED', 'REJECTED'] as const

const initialForm: JobMutationInput = {
  title: '',
  description: '',
  location: '',
  requiredSkills: '',
  contractType: '',
  schedule: '',
  salaryRange: '',
  availability: '',
  workType: '',
  status: 'DRAFT',
  validationNotes: '',
  employerId: ''
}

export default function JobsManagementPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [employerId, setEmployerId] = useState('')
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [form, setForm] = useState<JobMutationInput>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [matchingJobId, setMatchingJobId] = useState<string | null>(null)

  const employersState = useEmployers({ active: true })
  const jobsState = useJobsAdmin({
    status: status || undefined,
    employerId: employerId || undefined
  })

  const jobs = jobsState.data ?? []
  const employers = employersState.data ?? []

  const metrics = useMemo(() => ({
    total: jobs.length,
    open: jobs.filter(item => item.status === 'OPEN').length,
    validated: jobs.filter(item => item.status === 'VALIDATED').length,
    draft: jobs.filter(item => item.status === 'DRAFT').length
  }), [jobs])

  const resetForm = (): void => {
    setEditingJob(null)
    setForm(initialForm)
  }

  const startEdit = (job: Job): void => {
    setEditingJob(job)
    setForm({
      title: job.title,
      description: job.description,
      location: job.location,
      requiredSkills: job.required_skills,
      contractType: job.contract_type,
      schedule: job.schedule ?? '',
      salaryRange: job.salary_range ?? '',
      availability: job.availability ?? '',
      workType: job.work_type ?? '',
      status: job.status,
      validationNotes: job.validation_notes ?? '',
      employerId: job.employer_id ?? ''
    })
  }

  const handleSubmit = async (): Promise<void> => {
    if (!form.title?.trim() || !form.description?.trim() || !form.location?.trim()) {
      toast.error('Título, descrição e localização são obrigatórios')
      return
    }

    setSubmitting(true)
    try {
      if (editingJob) {
        await apiService.updateJob(editingJob.id, form)
        toast.success('Vaga actualizada com sucesso')
      } else {
        await apiService.createJob(form)
        toast.success('Vaga criada com sucesso')
      }
      invalidateApiCache(cacheKey => cacheKey.startsWith('jobs-admin:') || cacheKey.startsWith('matches:') || cacheKey === 'dashboard-stats')
      resetForm()
      await jobsState.refetch()
    } catch (submitError) {
      toast.error((submitError as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenerateMatching = async (job: Job): Promise<void> => {
    setMatchingJobId(job.id)
    try {
      const matches = await apiService.generateJobMatches(job.id)
      invalidateApiCache(cacheKey => cacheKey.startsWith('matches:'))
      toast.success(`${matches.length} matches gerados para ${job.title}`)
      navigate(`/jobs/${job.id}/matches`)
    } catch (matchingError) {
      toast.error((matchingError as Error).message)
    } finally {
      setMatchingJobId(null)
    }
  }

  const columns = [
    {
      key: 'title' as keyof Job,
      title: 'Vaga',
      sortable: true
    },
    {
      key: 'employer' as keyof Job,
      title: 'Empregador',
      render: (value: Job['employer']) => value?.name ?? 'Sem empregador'
    },
    {
      key: 'location' as keyof Job,
      title: 'Local',
      sortable: true
    },
    {
      key: 'status' as keyof Job,
      title: 'Status',
      sortable: true,
      render: (value: Job['status']) => <StatusBadge status={value === 'OPEN' || value === 'VALIDATED' ? 'success' : value === 'DRAFT' ? 'warning' : 'inactive'}>{value}</StatusBadge>
    }
  ]

  return (
    <Layout title="Vagas" subtitle="Gerencie vagas, ligue-as a empregadores validados e dispare geração de matching quando estiverem prontas.">
      <LoadingOverlay show={jobsState.loading || employersState.loading} message="A carregar vagas..." />

      {jobsState.error ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6 text-rose-700">{jobsState.error}</CardContent>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total" value={metrics.total} description="Vagas carregadas com filtros actuais" icon={BriefcaseBusiness} tone="primary" />
        <MetricCard title="Open" value={metrics.open} description="Disponíveis para candidatura" icon={Workflow} tone="success" />
        <MetricCard title="Validated" value={metrics.validated} description="Prontas para abrir" icon={Sparkles} tone="neutral" />
        <MetricCard title="Draft" value={metrics.draft} description="Ainda em preparação" icon={MapPin} tone="warning" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">{editingJob ? 'Editar vaga' : 'Nova vaga'}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Título" value={form.title} onChange={(event) => setForm(prev => ({ ...prev, title: event.target.value }))} />
              <Input placeholder="Localização" value={form.location} onChange={(event) => setForm(prev => ({ ...prev, location: event.target.value }))} />
              <Input placeholder="Skills requeridas (csv)" value={form.requiredSkills} onChange={(event) => setForm(prev => ({ ...prev, requiredSkills: event.target.value }))} />
              <Input placeholder="Tipo de contrato" value={form.contractType} onChange={(event) => setForm(prev => ({ ...prev, contractType: event.target.value }))} />
              <Input placeholder="Horário / disponibilidade" value={form.schedule ?? ''} onChange={(event) => setForm(prev => ({ ...prev, schedule: event.target.value }))} />
              <Input placeholder="Faixa salarial" value={form.salaryRange ?? ''} onChange={(event) => setForm(prev => ({ ...prev, salaryRange: event.target.value }))} />
              <Input placeholder="Disponibilidade da candidata" value={form.availability ?? ''} onChange={(event) => setForm(prev => ({ ...prev, availability: event.target.value }))} />
              <Input placeholder="Tipo de trabalho" value={form.workType ?? ''} onChange={(event) => setForm(prev => ({ ...prev, workType: event.target.value }))} />
              <select
                className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                value={form.status ?? 'DRAFT'}
                onChange={(event) => setForm(prev => ({ ...prev, status: event.target.value as Job['status'] }))}
              >
                {jobStatuses.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <select
                className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                value={form.employerId ?? ''}
                onChange={(event) => setForm(prev => ({ ...prev, employerId: event.target.value }))}
              >
                <option value="">Sem empregador</option>
                {employers.map(employer => (
                  <option key={employer.id} value={employer.id}>{employer.name}</option>
                ))}
              </select>
            </div>
            <Textarea placeholder="Descrição da vaga" value={form.description} onChange={(event) => setForm(prev => ({ ...prev, description: event.target.value }))} />
            <Textarea placeholder="Notas de validação" value={form.validationNotes ?? ''} onChange={(event) => setForm(prev => ({ ...prev, validationNotes: event.target.value }))} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void handleSubmit()} disabled={submitting}>
                <Plus className="mr-2 h-4 w-4" />
                {submitting ? 'A guardar...' : editingJob ? 'Guardar alterações' : 'Criar vaga'}
              </Button>
              {editingJob ? <Button variant="outline" onClick={resetForm}>Cancelar edição</Button> : null}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <select
              className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Todos os status</option>
              {jobStatuses.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select
              className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={employerId}
              onChange={(event) => setEmployerId(event.target.value)}
            >
              <option value="">Todos os empregadores</option>
              {employers.map(employer => (
                <option key={employer.id} value={employer.id}>{employer.name}</option>
              ))}
            </select>
            <Button variant="outline" onClick={() => void jobsState.refetch()}>
              Recarregar
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-950">Operação de vagas</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <EmptyState
              icon={BriefcaseBusiness}
              title="Sem vagas"
              description="Crie a primeira vaga para começar a geração de shortlist."
            />
          ) : (
            <DataTable
              data={jobs}
              columns={columns}
              searchable={false}
              onRowClick={startEdit}
              actions={[
                {
                  label: 'Editar',
                  onClick: startEdit
                },
                {
                  label: 'Gerar matching',
                  onClick: (row) => void handleGenerateMatching(row),
                  icon: Sparkles
                },
                {
                  label: 'Abrir matches',
                  onClick: (row) => navigate(`/jobs/${row.id}/matches`)
                }
              ]}
            />
          )}
          {matchingJobId ? (
            <p className="mt-4 text-sm text-muted-foreground">A gerar shortlist para {matchingJobId}...</p>
          ) : null}
        </CardContent>
      </Card>
    </Layout>
  )
}
