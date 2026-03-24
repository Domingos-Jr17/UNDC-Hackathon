import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MetricCard from '@/components/ui/MetricCard'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import Layout from './layout/Layout'
import { Activity, CalendarRange, Download, FileText, GraduationCap, Users } from 'lucide-react'
import { useDashboardStats, useRecentActivity, useUsers } from '@/hooks/useApi'
import { apiService, ApiError } from '@/services/api'

type UserReportFilters = {
  from: string
  to: string
  status: 'all' | 'Ativo' | 'Inativo'
  ngoId: string
}

type ActivityReportFilters = {
  from: string
  to: string
  action: string
}

const toDateInput = (date: Date): string => date.toISOString().slice(0, 10)

const buildPreset = (preset: '7d' | '30d' | 'month'): { from: string; to: string } => {
  const today = new Date()
  const to = toDateInput(today)

  if (preset === 'month') {
    const fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: toDateInput(fromDate), to }
  }

  const days = preset === '7d' ? 6 : 29
  const fromDate = new Date(today)
  fromDate.setDate(today.getDate() - days)
  return { from: toDateInput(fromDate), to }
}

export default function ReportsPage() {
  const statsState = useDashboardStats()
  const usersState = useUsers()
  const activityState = useRecentActivity()

  const loading = statsState.loading || usersState.loading || activityState.loading
  const error = statsState.error || usersState.error || activityState.error
  const stats = statsState.data
  const users = usersState.data?.users ?? []
  const activity = activityState.data ?? []

  const [userFilters, setUserFilters] = useState<UserReportFilters>({
    from: '',
    to: '',
    status: 'all',
    ngoId: ''
  })

  const [activityFilters, setActivityFilters] = useState<ActivityReportFilters>({
    from: '',
    to: '',
    action: ''
  })

  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const buildQuery = (params: Record<string, string>): string => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value.trim()) {
        query.set(key, value.trim())
      }
    })
    const result = query.toString()
    return result.length > 0 ? `&${result}` : ''
  }

  const normalizeError = (err: unknown): string => {
    if (err instanceof ApiError) {
      return err.message
    }
    if (err instanceof Error) {
      return err.message
    }
    return 'Não foi possível gerar o relatório.'
  }

  const applyUserPreset = (preset: '7d' | '30d' | 'month') => {
    const range = buildPreset(preset)
    setUserFilters(prev => ({ ...prev, ...range }))
  }

  const applyActivityPreset = (preset: '7d' | '30d' | 'month') => {
    const range = buildPreset(preset)
    setActivityFilters(prev => ({ ...prev, ...range }))
  }

  const summary = useMemo(() => ({
    totalUsers: stats?.totalUsers ?? users.length,
    activeUsers: stats?.activeUsers ?? users.filter(user => user.status === 'Ativo').length,
    coursesCompleted: stats?.coursesCompleted ?? 0,
    activityEvents: activity.length
  }), [activity.length, stats, users])

  const downloadUsersReport = async (format: 'xlsx' | 'pdf'): Promise<void> => {
    setDownloading(`users-${format}`)
    setDownloadError(null)
    try {
      const query = buildQuery({
        from: userFilters.from,
        to: userFilters.to,
        status: userFilters.status === 'all' ? '' : userFilters.status,
        ngoId: userFilters.ngoId
      })
      await apiService.downloadReport(
        `/api/reports/users?format=${format}${query}`,
        `wira-users-report.${format}`
      )
    } catch (err) {
      setDownloadError(normalizeError(err))
    } finally {
      setDownloading(null)
    }
  }

  const downloadActivityReport = async (format: 'xlsx' | 'pdf'): Promise<void> => {
    setDownloading(`activity-${format}`)
    setDownloadError(null)
    try {
      const query = buildQuery({
        from: activityFilters.from,
        to: activityFilters.to,
        action: activityFilters.action
      })
      await apiService.downloadReport(
        `/api/reports/activity?format=${format}${query}`,
        `wira-activity-report.${format}`
      )
    } catch (err) {
      setDownloadError(normalizeError(err))
    } finally {
      setDownloading(null)
    }
  }

  return (
    <Layout title="Relatórios" subtitle="Prepare exportações úteis para coordenação, parceiros e prestação de contas, com filtros claros e atalhos rápidos.">
      <LoadingOverlay show={loading} message="A carregar relatórios..." />

      {error ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6 text-rose-700">{error}</CardContent>
        </Card>
      ) : null}

      {downloadError ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6 text-rose-700">{downloadError}</CardContent>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Beneficiárias" value={summary.totalUsers} description="Base total disponível para reporte" icon={Users} tone="primary" />
        <MetricCard title="Ativas" value={summary.activeUsers} description="Contas com acesso e uso recente" icon={Activity} tone="success" />
        <MetricCard title="Cursos concluídos" value={summary.coursesCompleted} description="Evidência de evolução formativa" icon={GraduationCap} tone="neutral" />
        <MetricCard title="Eventos" value={summary.activityEvents} description="Registos recentes de atividade" icon={FileText} tone="warning" />
      </section>

      <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">Atalhos de período</p>
            <p className="mt-1 text-sm text-muted-foreground">Aplique um período comum antes de exportar para reduzir retrabalho.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { applyUserPreset('7d'); applyActivityPreset('7d') }}>
              Últimos 7 dias
            </Button>
            <Button variant="outline" onClick={() => { applyUserPreset('30d'); applyActivityPreset('30d') }}>
              Últimos 30 dias
            </Button>
            <Button variant="outline" onClick={() => { applyUserPreset('month'); applyActivityPreset('month') }}>
              Este mês
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-950">
              <Users className="h-5 w-5 text-primary" />
              Relatório de beneficiárias
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Exporte recortes da base com filtros de status, ONG e período para acompanhamento institucional.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => applyUserPreset('7d')}>
                <CalendarRange className="mr-2 h-4 w-4" />
                7 dias
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyUserPreset('30d')}>
                <CalendarRange className="mr-2 h-4 w-4" />
                30 dias
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyUserPreset('month')}>
                <CalendarRange className="mr-2 h-4 w-4" />
                Mês atual
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="usersFrom">De</Label>
                <Input
                  id="usersFrom"
                  type="date"
                  value={userFilters.from}
                  onChange={(event) => setUserFilters(prev => ({ ...prev, from: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usersTo">Até</Label>
                <Input
                  id="usersTo"
                  type="date"
                  value={userFilters.to}
                  onChange={(event) => setUserFilters(prev => ({ ...prev, to: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="usersStatus">Status</Label>
                <select
                  id="usersStatus"
                  className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  value={userFilters.status}
                  onChange={(event) => setUserFilters(prev => ({ ...prev, status: event.target.value as UserReportFilters['status'] }))}
                >
                  <option value="all">Todos</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="usersNgo">ONG</Label>
                <Input
                  id="usersNgo"
                  placeholder="ONG-001"
                  value={userFilters.ngoId}
                  onChange={(event) => setUserFilters(prev => ({ ...prev, ngoId: event.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="w-full" onClick={() => void downloadUsersReport('xlsx')} disabled={downloading === 'users-xlsx'}>
                <Download className="mr-2 h-4 w-4" />
                {downloading === 'users-xlsx' ? 'A gerar Excel...' : 'Baixar Excel'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => void downloadUsersReport('pdf')} disabled={downloading === 'users-pdf'}>
                <Download className="mr-2 h-4 w-4" />
                {downloading === 'users-pdf' ? 'A gerar PDF...' : 'Baixar PDF'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-950">
              <Activity className="h-5 w-5 text-primary" />
              Relatório de atividade
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Exporte o que aconteceu recentemente para apoiar reuniões, auditorias internas e partilha com a coordenação.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => applyActivityPreset('7d')}>
                <CalendarRange className="mr-2 h-4 w-4" />
                7 dias
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyActivityPreset('30d')}>
                <CalendarRange className="mr-2 h-4 w-4" />
                30 dias
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyActivityPreset('month')}>
                <CalendarRange className="mr-2 h-4 w-4" />
                Mês atual
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="activityFrom">De</Label>
                <Input
                  id="activityFrom"
                  type="date"
                  value={activityFilters.from}
                  onChange={(event) => setActivityFilters(prev => ({ ...prev, from: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activityTo">Até</Label>
                <Input
                  id="activityTo"
                  type="date"
                  value={activityFilters.to}
                  onChange={(event) => setActivityFilters(prev => ({ ...prev, to: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityAction">Ação</Label>
              <Input
                id="activityAction"
                placeholder="ex: login, progress_update"
                value={activityFilters.action}
                onChange={(event) => setActivityFilters(prev => ({ ...prev, action: event.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="w-full" onClick={() => void downloadActivityReport('xlsx')} disabled={downloading === 'activity-xlsx'}>
                <Download className="mr-2 h-4 w-4" />
                {downloading === 'activity-xlsx' ? 'A gerar Excel...' : 'Baixar Excel'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => void downloadActivityReport('pdf')} disabled={downloading === 'activity-pdf'}>
                <Download className="mr-2 h-4 w-4" />
                {downloading === 'activity-pdf' ? 'A gerar PDF...' : 'Baixar PDF'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </Layout>
  )
}
