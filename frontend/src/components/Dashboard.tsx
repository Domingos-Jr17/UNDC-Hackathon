import { memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TypographySmall, TypographyMuted } from '@/components/ui/typography'
import { Users, GraduationCap, TrendingUp, BarChart3, Clock, Activity } from 'lucide-react'
import Layout from './layout/Layout'
import MetricCard from './ui/MetricCard'
import StatusBadge from './ui/StatusBadge'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { useDashboardStats, useRecentActivity, useUsers } from '@/hooks/useApi'

function DashboardComponent() {
  const statsState = useDashboardStats()
  const activityState = useRecentActivity()
  const usersState = useUsers({ status: 'Ativo' })

  const loading = statsState.loading || activityState.loading || usersState.loading
  const error = statsState.error || activityState.error || usersState.error

  const stats = statsState.data ?? {
    totalUsers: 0,
    activeUsers: 0,
    coursesCompleted: 0,
    certificatesIssued: 0,
    averageCompletionTime: 0
  }

  const activeUsers = useMemo(
    () => (usersState.data ?? []).filter(user => user.status === 'Ativo').slice(0, 8),
    [usersState.data]
  )

  const recentActivity = useMemo(
    () => (activityState.data ?? []).slice(0, 10),
    [activityState.data]
  )

  return (
    <Layout title="Dashboard WIRA" subtitle="Visão operacional em tempo real">
      <LoadingOverlay show={loading} message="Carregando dashboard..." />

      {error ? (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <TypographySmall className="text-red-700">{error}</TypographySmall>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard title="Beneficiárias" value={stats.totalUsers} icon={Users} />
        <MetricCard title="Ativas" value={stats.activeUsers} icon={TrendingUp} />
        <MetricCard title="Cursos Concluídos" value={stats.coursesCompleted} icon={GraduationCap} />
        <MetricCard title="Certificados" value={stats.certificatesIssued} icon={BarChart3} />
        <MetricCard title="Tempo Médio" value={`${stats.averageCompletionTime} dias`} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <TypographyMuted>Sem atividade recente.</TypographyMuted>
              ) : (
                recentActivity.map(item => (
                  <div key={item.id} className="p-3 rounded-lg border border-border/50">
                    <TypographySmall className="font-medium">{item.user}</TypographySmall>
                    <TypographyMuted className="text-sm">{item.action}</TypographyMuted>
                    <TypographySmall className="text-xs text-muted-foreground">
                      {new Date(item.time).toLocaleString('pt-MZ')}
                    </TypographySmall>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Beneficiárias Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeUsers.length === 0 ? (
                <TypographyMuted>Nenhuma beneficiária ativa encontrada.</TypographyMuted>
              ) : (
                activeUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                    <div>
                      <TypographySmall className="font-medium">{user.anonymousCode}</TypographySmall>
                      <TypographyMuted className="text-sm">{user.ngoId}</TypographyMuted>
                    </div>
                    <div className="text-right">
                      <TypographySmall>{user.totalProgress}%</TypographySmall>
                      <StatusBadge status={user.status === 'Ativo' ? 'active' : 'inactive'} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

const Dashboard = memo(DashboardComponent)
Dashboard.displayName = 'Dashboard'

export default Dashboard
