import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MetricCard from '@/components/ui/MetricCard'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import Layout from './layout/Layout'
import { FileText, Download, Users, GraduationCap, Award, Activity } from 'lucide-react'
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

export default function ReportsPage() {
  const statsState = useDashboardStats()
  const usersState = useUsers()
  const activityState = useRecentActivity()

  const loading = statsState.loading || usersState.loading || activityState.loading
  const error = statsState.error || usersState.error || activityState.error
  const stats = statsState.data
  const users = usersState.data ?? []
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
    return 'Nao foi possivel gerar o relatorio.'
  }

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
    <Layout title="Relatorios" subtitle="Exportacao de dados reais da plataforma">
      <LoadingOverlay show={loading} message="Carregando relatorios..." />

      {error ? (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-700">{error}</CardContent>
        </Card>
      ) : null}

      {downloadError ? (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-700">{downloadError}</CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard title="Beneficiarias" value={stats?.totalUsers ?? users.length} icon={Users} />
        <MetricCard title="Ativas" value={stats?.activeUsers ?? users.filter(user => user.status === 'Ativo').length} icon={Activity} />
        <MetricCard title="Cursos Concluidos" value={stats?.coursesCompleted ?? 0} icon={GraduationCap} />
        <MetricCard title="Certificados" value={stats?.certificatesIssued ?? 0} icon={Award} />
        <MetricCard title="Eventos" value={activity.length} icon={FileText} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exportacoes Disponiveis</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Relatorio de Beneficiarias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Exporta dados agregados de usuarias e progresso em Excel ou PDF.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  <Label htmlFor="usersTo">Ate</Label>
                  <Input
                    id="usersTo"
                    type="date"
                    value={userFilters.to}
                    onChange={(event) => setUserFilters(prev => ({ ...prev, to: event.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="usersStatus">Status</Label>
                  <select
                    id="usersStatus"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
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

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="w-full"
                  onClick={() => void downloadUsersReport('xlsx')}
                  disabled={downloading === 'users-xlsx'}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloading === 'users-xlsx' ? 'Gerando Excel...' : 'Baixar Excel'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void downloadUsersReport('pdf')}
                  disabled={downloading === 'users-pdf'}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloading === 'users-pdf' ? 'Gerando PDF...' : 'Baixar PDF'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Relatorio de Atividade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Exporta a atividade recente do dashboard em Excel ou PDF.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  <Label htmlFor="activityTo">Ate</Label>
                  <Input
                    id="activityTo"
                    type="date"
                    value={activityFilters.to}
                    onChange={(event) => setActivityFilters(prev => ({ ...prev, to: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityAction">Acao</Label>
                <Input
                  id="activityAction"
                  placeholder="ex: login, progress_update"
                  value={activityFilters.action}
                  onChange={(event) => setActivityFilters(prev => ({ ...prev, action: event.target.value }))}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="w-full"
                  onClick={() => void downloadActivityReport('xlsx')}
                  disabled={downloading === 'activity-xlsx'}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloading === 'activity-xlsx' ? 'Gerando Excel...' : 'Baixar Excel'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void downloadActivityReport('pdf')}
                  disabled={downloading === 'activity-pdf'}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloading === 'activity-pdf' ? 'Gerando PDF...' : 'Baixar PDF'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </Layout>
  )
}
