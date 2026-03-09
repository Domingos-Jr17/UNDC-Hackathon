import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import MetricCard from '@/components/ui/MetricCard'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import Layout from './layout/Layout'
import { FileText, Download, Users, GraduationCap, Award, Activity } from 'lucide-react'
import { useDashboardStats, useRecentActivity, useUsers } from '@/hooks/useApi'

const downloadFile = (filename: string, content: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
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

  const exportUsersCsv = (): void => {
    const rows = users.map(user => [
      user.anonymousCode,
      user.ngoId,
      user.status,
      user.totalProgress,
      user.coursesCompleted,
      user.certificatesEarned,
      user.lastActivity
    ].join(','))

    const csv = `codigo,ngo,status,progresso,cursos_concluidos,certificados,last_activity\n${rows.join('\n')}`
    downloadFile('wira-users-report.csv', csv, 'text/csv;charset=utf-8;')
  }

  const exportActivityJson = (): void => {
    downloadFile(
      'wira-activity-report.json',
      JSON.stringify(activity, null, 2),
      'application/json;charset=utf-8;'
    )
  }

  return (
    <Layout title="Relatórios" subtitle="Exportação de dados reais da plataforma">
      <LoadingOverlay show={loading} message="Carregando relatórios..." />

      {error ? (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-700">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard title="Beneficiárias" value={stats?.totalUsers ?? users.length} icon={Users} />
        <MetricCard title="Ativas" value={stats?.activeUsers ?? users.filter(user => user.status === 'Ativo').length} icon={Activity} />
        <MetricCard title="Cursos Concluídos" value={stats?.coursesCompleted ?? 0} icon={GraduationCap} />
        <MetricCard title="Certificados" value={stats?.certificatesIssued ?? 0} icon={Award} />
        <MetricCard title="Eventos" value={activity.length} icon={FileText} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exportações Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Relatório de Beneficiárias</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Exporta dados agregados de utilizadoras e progresso em formato CSV.
              </p>
              <Button className="w-full" onClick={exportUsersCsv}>
                <Download className="mr-2 h-4 w-4" />
                Baixar CSV
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Relatório de Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Exporta atividade recente do dashboard em formato JSON.
              </p>
              <Button className="w-full" onClick={exportActivityJson}>
                <Download className="mr-2 h-4 w-4" />
                Baixar JSON
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </Layout>
  )
}
