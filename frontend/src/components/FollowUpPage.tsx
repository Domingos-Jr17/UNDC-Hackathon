import { useEffect, useMemo, useState } from 'react'
import { BellRing, MessageSquareShare, Send, ShieldAlert } from 'lucide-react'
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
import { apiService, FollowUpChannel, FollowUpCheckin } from '@/services/api'
import { invalidateApiCache, useApplications, useCheckins } from '@/hooks/useApi'

const channels: FollowUpChannel[] = ['SMS', 'USSD', 'APP', 'MANUAL']

export default function FollowUpPage() {
  const [status, setStatus] = useState('')
  const [channel, setChannel] = useState('')
  const [jobApplicationId, setJobApplicationId] = useState<number | null>(null)
  const [periodLabel, setPeriodLabel] = useState('')
  const [scheduleChannel, setScheduleChannel] = useState<FollowUpChannel>('SMS')
  const [prompt, setPrompt] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [selectedCheckin, setSelectedCheckin] = useState<FollowUpCheckin | null>(null)
  const [responseText, setResponseText] = useState('')
  const [manualSmsPhone, setManualSmsPhone] = useState('')
  const [manualSmsMessage, setManualSmsMessage] = useState('')
  const [submitting, setSubmitting] = useState<string | null>(null)

  const applicationsState = useApplications({ status: 'PLACED' })
  const checkinsState = useCheckins({
    status: status || undefined,
    channel: channel || undefined,
    jobApplicationId: jobApplicationId ?? undefined
  })

  const applications = applicationsState.data ?? []
  const checkins = checkinsState.data ?? []

  useEffect(() => {
    void applicationsState.refetch()
    // Force an operational refresh on mount so PLACED applications are not hidden by a fresh empty cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void checkinsState.refetch()
    // Force a refresh when queue filters change so newly created check-ins are reflected immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, channel, jobApplicationId])

  useEffect(() => {
    if (!applications.length) {
      setJobApplicationId(null)
      return
    }

    setJobApplicationId(current => {
      if (current && applications.some(application => application.id === current)) {
        return current
      }

      return applications.length === 1 ? applications[0].id : current
    })
  }, [applications])

  useEffect(() => {
    if (!checkins.length) {
      setSelectedCheckin(null)
      return
    }

    setSelectedCheckin(current => {
      if (current) {
        return checkins.find(item => item.id === current.id) ?? null
      }

      return checkins.length === 1 ? checkins[0] : null
    })
  }, [checkins])

  const metrics = useMemo(() => ({
    total: checkins.length,
    pending: checkins.filter(item => item.status === 'PENDING').length,
    responded: checkins.filter(item => item.status === 'RESPONDED').length,
    critical: checkins.filter(item => item.risk_severity === 'CRITICAL' || item.risk_severity === 'HIGH').length
  }), [checkins])

  const handleSchedule = async (): Promise<void> => {
    if (!jobApplicationId || !periodLabel.trim()) {
      toast.error('Aplicação e período são obrigatórios')
      return
    }

    setSubmitting('schedule')
    try {
      await apiService.scheduleCheckin({
        jobApplicationId,
        periodLabel,
        channel: scheduleChannel,
        prompt: prompt.trim() || undefined,
        dueAt: dueAt || undefined
      })
      invalidateApiCache(cacheKey =>
        cacheKey.startsWith('applications:') ||
        cacheKey.startsWith('checkins:') ||
        cacheKey.startsWith('alerts:') ||
        cacheKey === 'dashboard-stats'
      )
      await checkinsState.refetch()
      toast.success('Check-in agendado com sucesso')
      setPeriodLabel('')
      setPrompt('')
      setDueAt('')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSubmitting(null)
    }
  }

  const handleRespond = async (): Promise<void> => {
    if (!selectedCheckin) {
      toast.error('Seleccione um check-in')
      return
    }

    setSubmitting('respond')
    try {
      await apiService.respondCheckin(selectedCheckin.id, {
        response: responseText.trim() || undefined,
        responseCode: responseText.trim() ? responseText.trim().toUpperCase() : undefined
      })
      invalidateApiCache(cacheKey =>
        cacheKey.startsWith('checkins:') ||
        cacheKey.startsWith('alerts:')
      )
      await checkinsState.refetch()
      toast.success('Resposta registada')
      setResponseText('')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSubmitting(null)
    }
  }

  const handleSendSms = async (): Promise<void> => {
    if (!manualSmsPhone.trim() || !manualSmsMessage.trim()) {
      toast.error('Telefone e mensagem são obrigatórios')
      return
    }

    setSubmitting('sms')
    try {
      await apiService.sendSms(manualSmsPhone.trim(), manualSmsMessage.trim())
      toast.success('SMS enviado')
      setManualSmsMessage('')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSubmitting(null)
    }
  }

  const columns = [
    {
      key: 'anonymous_code' as keyof FollowUpCheckin,
      title: 'Beneficiária',
      sortable: true
    },
    {
      key: 'period_label' as keyof FollowUpCheckin,
      title: 'Período',
      sortable: true
    },
    {
      key: 'channel' as keyof FollowUpCheckin,
      title: 'Canal',
      sortable: true
    },
    {
      key: 'status' as keyof FollowUpCheckin,
      title: 'Estado',
      sortable: true,
      render: (value: FollowUpCheckin['status']) => <StatusBadge status={value === 'RESPONDED' ? 'success' : value === 'MISSED' ? 'inactive' : 'warning'}>{value}</StatusBadge>
    },
    {
      key: 'risk_severity' as keyof FollowUpCheckin,
      title: 'Risco',
      sortable: true,
      render: (value: FollowUpCheckin['risk_severity']) => <StatusBadge status={value === 'CRITICAL' || value === 'HIGH' ? 'warning' : 'info'}>{value}</StatusBadge>
    }
  ]

  return (
    <Layout title="Acompanhamento" subtitle="Agende check-ins, responda casos operacionais e use SMS transacional quando precisar de intervenção directa.">
      <LoadingOverlay show={checkinsState.loading || applicationsState.loading} message="A carregar acompanhamento..." />

      {checkinsState.error ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6 text-rose-700">{checkinsState.error}</CardContent>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Check-ins" value={metrics.total} description="Registos carregados" icon={BellRing} tone="primary" />
        <MetricCard title="Pendentes" value={metrics.pending} description="Exigem resposta ou execução" icon={MessageSquareShare} tone="warning" />
        <MetricCard title="Respondidos" value={metrics.responded} description="Interações concluídas" icon={Send} tone="success" />
        <MetricCard title="Risco alto" value={metrics.critical} description="Check-ins com severidade elevada" icon={ShieldAlert} tone="neutral" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">Agendar check-in</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <select
              className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={jobApplicationId ?? ''}
              onChange={(event) => setJobApplicationId(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Seleccionar candidatura colocada</option>
              {applications.map(application => (
                <option key={application.id} value={application.id}>
                  #{application.id} · {application.anonymous_code} · {application.job?.title ?? application.job_id}
                </option>
              ))}
            </select>
            <Input placeholder="Período (ex: 30 dias)" value={periodLabel} onChange={(event) => setPeriodLabel(event.target.value)} />
            <select
              className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={scheduleChannel}
              onChange={(event) => setScheduleChannel(event.target.value as FollowUpChannel)}
            >
              {channels.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <Input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
            <Textarea placeholder="Prompt / mensagem do check-in" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
            <Button onClick={() => void handleSchedule()} disabled={submitting === 'schedule'}>
              {submitting === 'schedule' ? 'A agendar...' : 'Agendar check-in'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">Resposta manual e SMS</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <select
              className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={selectedCheckin?.id ?? ''}
              onChange={(event) => setSelectedCheckin(checkins.find(item => item.id === event.target.value) ?? null)}
            >
              <option value="">Seleccionar check-in</option>
              {checkins.map(checkin => (
                <option key={checkin.id} value={checkin.id}>
                  {checkin.anonymous_code} · {checkin.period_label} · {checkin.status}
                </option>
              ))}
            </select>
            <Textarea placeholder="Resposta recebida / nota operacional" value={responseText} onChange={(event) => setResponseText(event.target.value)} />
            <Button onClick={() => void handleRespond()} disabled={!selectedCheckin || submitting === 'respond'}>
              {submitting === 'respond' ? 'A guardar...' : 'Registar resposta'}
            </Button>
            <div className="border-t pt-4">
              <p className="mb-3 text-sm font-medium text-slate-950">SMS transacional manual</p>
              <div className="grid gap-3">
                <Input placeholder="Telefone" value={manualSmsPhone} onChange={(event) => setManualSmsPhone(event.target.value)} />
                <Textarea placeholder="Mensagem" value={manualSmsMessage} onChange={(event) => setManualSmsMessage(event.target.value)} />
                <Button variant="outline" onClick={() => void handleSendSms()} disabled={submitting === 'sms'}>
                  {submitting === 'sms' ? 'A enviar...' : 'Enviar SMS'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-950">Fila de check-ins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <select
              className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Todos os estados</option>
              <option value="PENDING">PENDING</option>
              <option value="RESPONDED">RESPONDED</option>
              <option value="MISSED">MISSED</option>
            </select>
            <select
              className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
            >
              <option value="">Todos os canais</option>
              {channels.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <Button variant="outline" onClick={() => void checkinsState.refetch()}>Actualizar fila</Button>
          </div>

          {!checkins.length ? (
            <EmptyState
              icon={BellRing}
              title="Sem check-ins"
              description="Agende o primeiro follow-up para começar o acompanhamento pós-colocação."
            />
          ) : (
            <DataTable
              data={checkins}
              columns={columns}
              searchable={false}
              onRowClick={setSelectedCheckin}
              actions={[
                {
                  label: 'Seleccionar',
                  onClick: setSelectedCheckin
                }
              ]}
            />
          )}
        </CardContent>
      </Card>
    </Layout>
  )
}
