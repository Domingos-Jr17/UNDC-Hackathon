import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ShieldAlert, UserRoundCheck } from 'lucide-react'
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
import { apiService, Alert, AlertStatus } from '@/services/api'
import { invalidateApiCache, useAlerts } from '@/hooks/useApi'
import { useAuthContext } from '@/contexts/AuthContext'

const alertStatuses: AlertStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED']
const alertSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

export default function AlertsPage() {
  const { user } = useAuthContext()
  const [status, setStatus] = useState('')
  const [severity, setSeverity] = useState('')
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [nextStatus, setNextStatus] = useState<AlertStatus>('IN_PROGRESS')
  const [ownerCode, setOwnerCode] = useState(user?.anonymousCode ?? '')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const alertsState = useAlerts({
    status: status || undefined,
    severity: severity || undefined
  })

  const alerts = alertsState.data ?? []

  useEffect(() => {
    void alertsState.refetch()
    // Force an operational refresh on mount so newly created alerts are not hidden by a fresh empty cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!alerts.length) {
      setSelectedAlert(null)
      return
    }

    setSelectedAlert(current => {
      if (current) {
        return alerts.find(item => item.id === current.id) ?? null
      }

      return alerts.length === 1 ? alerts[0] : null
    })
  }, [alerts])

  useEffect(() => {
    if (!selectedAlert) {
      setOwnerCode(user?.anonymousCode ?? '')
      setResolutionNotes('')
      setNextStatus('IN_PROGRESS')
      return
    }

    setOwnerCode(selectedAlert.owner_code ?? user?.anonymousCode ?? '')
    setResolutionNotes(selectedAlert.resolution_notes ?? '')
    setNextStatus(selectedAlert.status === 'OPEN' ? 'IN_PROGRESS' : selectedAlert.status)
  }, [selectedAlert?.id, selectedAlert?.owner_code, selectedAlert?.resolution_notes, selectedAlert?.status, user?.anonymousCode])

  const metrics = useMemo(() => ({
    total: alerts.length,
    open: alerts.filter(item => item.status === 'OPEN').length,
    inProgress: alerts.filter(item => item.status === 'IN_PROGRESS').length,
    critical: alerts.filter(item => item.severity === 'CRITICAL').length
  }), [alerts])

  const handleUpdate = async (): Promise<void> => {
    if (!selectedAlert) {
      toast.error('Seleccione um alerta')
      return
    }

    setSubmitting(true)
    try {
      await apiService.updateAlert(selectedAlert.id, {
        status: nextStatus,
        ownerCode: ownerCode.trim() || undefined,
        resolutionNotes: resolutionNotes.trim() || undefined
      })
      invalidateApiCache(cacheKey => cacheKey.startsWith('alerts:') || cacheKey === 'dashboard-stats')
      await alertsState.refetch()
      toast.success('Alerta actualizado')
      setResolutionNotes('')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      key: 'anonymous_code' as keyof Alert,
      title: 'Beneficiária',
      sortable: true
    },
    {
      key: 'type' as keyof Alert,
      title: 'Tipo',
      sortable: true
    },
    {
      key: 'severity' as keyof Alert,
      title: 'Severidade',
      sortable: true,
      render: (value: Alert['severity']) => <StatusBadge status={value === 'CRITICAL' || value === 'HIGH' ? 'warning' : 'info'}>{value}</StatusBadge>
    },
    {
      key: 'status' as keyof Alert,
      title: 'Estado',
      sortable: true,
      render: (value: Alert['status']) => <StatusBadge status={value === 'RESOLVED' ? 'success' : value === 'DISMISSED' ? 'inactive' : 'warning'}>{value}</StatusBadge>
    }
  ]

  return (
    <Layout title="Alertas" subtitle="Centralize riscos operacionais, atribua owner e feche casos com notas claras de resolução.">
      <LoadingOverlay show={alertsState.loading} message="A carregar alertas..." />

      {alertsState.error ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6 text-rose-700">{alertsState.error}</CardContent>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Alertas" value={metrics.total} description="Fila carregada com filtros actuais" icon={AlertTriangle} tone="primary" />
        <MetricCard title="Open" value={metrics.open} description="Ainda sem owner ou resolução" icon={ShieldAlert} tone="warning" />
        <MetricCard title="In progress" value={metrics.inProgress} description="Casos em tratamento" icon={UserRoundCheck} tone="neutral" />
        <MetricCard title="Críticos" value={metrics.critical} description="Prioridade máxima" icon={ShieldAlert} tone="success" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">Fila operacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <select
                className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">Todos os estados</option>
                {alertStatuses.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <select
                className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                value={severity}
                onChange={(event) => setSeverity(event.target.value)}
              >
                <option value="">Todas as severidades</option>
                {alertSeverities.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <Button variant="outline" onClick={() => void alertsState.refetch()}>Actualizar</Button>
            </div>

            {!alerts.length ? (
              <EmptyState
                icon={AlertTriangle}
                title="Sem alertas"
                description="A fila ficará activa quando check-ins e candidaturas começarem a produzir sinais de risco."
              />
            ) : (
              <DataTable
                data={alerts}
                columns={columns}
                searchable={false}
                onRowClick={setSelectedAlert}
                actions={[
                  {
                    label: 'Seleccionar',
                    onClick: setSelectedAlert
                  }
                ]}
              />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">Tomar posse e resolver</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <select
              className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={selectedAlert?.id ?? ''}
              onChange={(event) => setSelectedAlert(alerts.find(item => item.id === event.target.value) ?? null)}
            >
              <option value="">Seleccionar alerta</option>
              {alerts.map(alert => (
                <option key={alert.id} value={alert.id}>
                  {alert.anonymous_code} · {alert.type} · {alert.severity}
                </option>
              ))}
            </select>
            <select
              className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value as AlertStatus)}
            >
              {alertStatuses.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <Input placeholder="Owner code" value={ownerCode} onChange={(event) => setOwnerCode(event.target.value.toUpperCase())} />
            <Textarea placeholder="Notas de resolução" value={resolutionNotes} onChange={(event) => setResolutionNotes(event.target.value)} />
            <Button onClick={() => void handleUpdate()} disabled={!selectedAlert || submitting}>
              {submitting ? 'A actualizar...' : 'Guardar decisão'}
            </Button>
            {selectedAlert ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-950">{selectedAlert.type}</p>
                <p className="mt-1">Fonte: {selectedAlert.source}</p>
                <p>Check-in: {selectedAlert.checkin?.period_label ?? 'n/a'}</p>
                <p>Candidatura: {selectedAlert.job_application?.id ?? 'n/a'}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </Layout>
  )
}
