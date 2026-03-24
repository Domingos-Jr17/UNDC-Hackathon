import { useMemo, useState } from 'react'
import { FileCheck2, RefreshCcw, Workflow } from 'lucide-react'
import { toast } from 'sonner'
import Layout from './layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import MetricCard from '@/components/ui/MetricCard'
import StatusBadge from '@/components/ui/StatusBadge'
import DataTable from '@/components/ui/DataTable'
import EmptyState from '@/components/ui/EmptyState'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { apiService, ApplicationStatus, JobApplication } from '@/services/api'
import { invalidateApiCache, useApplications } from '@/hooks/useApi'

const applicationStatuses: ApplicationStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'OFFER_MADE',
  'ACCEPTED',
  'PLACED',
  'REJECTED',
  'WITHDRAWN'
]

export default function ApplicationsPage() {
  const [status, setStatus] = useState<string>('')
  const [anonymousCode, setAnonymousCode] = useState('')
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [nextStatus, setNextStatus] = useState<ApplicationStatus>('SUBMITTED')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const applicationsState = useApplications({
    status: status || undefined,
    anonymousCode: anonymousCode.trim() || undefined
  })

  const applications = applicationsState.data ?? []

  const metrics = useMemo(() => ({
    total: applications.length,
    submitted: applications.filter(item => item.status === 'SUBMITTED').length,
    placed: applications.filter(item => item.status === 'PLACED').length,
    rejected: applications.filter(item => item.status === 'REJECTED').length
  }), [applications])

  const handleTransition = async (): Promise<void> => {
    if (!selectedApplication) {
      toast.error('Seleccione uma candidatura')
      return
    }

    setSubmitting(true)
    try {
      await apiService.transitionApplication(selectedApplication.id, {
        status: nextStatus,
        notes: notes.trim() || undefined
      })
      invalidateApiCache(cacheKey =>
        cacheKey.startsWith('applications:') ||
        cacheKey.startsWith('checkins:') ||
        cacheKey.startsWith('alerts:') ||
        cacheKey === 'dashboard-stats'
      )
      await applicationsState.refetch()
      toast.success('Estado da candidatura actualizado')
      setNotes('')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      key: 'anonymous_code' as keyof JobApplication,
      title: 'Beneficiária',
      sortable: true
    },
    {
      key: 'job' as keyof JobApplication,
      title: 'Vaga',
      render: (value: JobApplication['job']) => value?.title ?? 'Sem vaga'
    },
    {
      key: 'status' as keyof JobApplication,
      title: 'Status',
      sortable: true,
      render: (value: JobApplication['status']) => (
        <StatusBadge status={value === 'PLACED' || value === 'ACCEPTED' ? 'success' : value === 'REJECTED' || value === 'WITHDRAWN' ? 'inactive' : 'warning'}>
          {value}
        </StatusBadge>
      )
    },
    {
      key: 'score' as keyof JobApplication,
      title: 'Score',
      sortable: true,
      render: (value: number) => `${value}%`
    }
  ]

  return (
    <Layout title="Candidaturas" subtitle="Acompanhe o pipeline de colocação, faça transições controladas e identifique casos prontos para follow-up.">
      <LoadingOverlay show={applicationsState.loading} message="A carregar candidaturas..." />

      {applicationsState.error ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6 text-rose-700">{applicationsState.error}</CardContent>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total" value={metrics.total} description="Candidaturas sob gestão" icon={Workflow} tone="primary" />
        <MetricCard title="Submetidas" value={metrics.submitted} description="À espera de evolução externa" icon={FileCheck2} tone="warning" />
        <MetricCard title="Placed" value={metrics.placed} description="Prontas para acompanhamento" icon={FileCheck2} tone="success" />
        <MetricCard title="Rejeitadas" value={metrics.rejected} description="Casos encerrados" icon={RefreshCcw} tone="neutral" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <select
              className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Todos os estados</option>
              {applicationStatuses.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <Input placeholder="Código da beneficiária" value={anonymousCode} onChange={(event) => setAnonymousCode(event.target.value.toUpperCase())} />
            <Button variant="outline" onClick={() => void applicationsState.refetch()}>Actualizar</Button>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">Transição controlada</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <select
              className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={selectedApplication?.id ?? ''}
              onChange={(event) => {
                const selected = applications.find(item => item.id === Number(event.target.value)) ?? null
                setSelectedApplication(selected)
                setNextStatus(selected?.status ?? 'SUBMITTED')
              }}
            >
              <option value="">Seleccionar candidatura</option>
              {applications.map(application => (
                <option key={application.id} value={application.id}>
                  #{application.id} · {application.anonymous_code} · {application.job?.title ?? application.job_id}
                </option>
              ))}
            </select>
            <select
              className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value as ApplicationStatus)}
            >
              {applicationStatuses.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <Textarea placeholder="Notas da transição" value={notes} onChange={(event) => setNotes(event.target.value)} />
            <Button onClick={() => void handleTransition()} disabled={!selectedApplication || submitting}>
              {submitting ? 'A actualizar...' : 'Actualizar estado'}
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-950">Pipeline operacional</CardTitle>
        </CardHeader>
        <CardContent>
          {!applications.length ? (
            <EmptyState
              icon={Workflow}
              title="Sem candidaturas"
              description="As candidaturas começam a aparecer quando os matches avançam para submissão."
            />
          ) : (
            <DataTable
              data={applications}
              columns={columns}
              searchable={false}
              onRowClick={setSelectedApplication}
              actions={[
                {
                  label: 'Seleccionar',
                  onClick: setSelectedApplication
                }
              ]}
            />
          )}
        </CardContent>
      </Card>
    </Layout>
  )
}
