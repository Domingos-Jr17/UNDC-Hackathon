import { memo, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isFollowUpAlertsPhase2Enabled } from '@/config/features'
import MetricCard from './ui/MetricCard'
import StatusBadge from './ui/StatusBadge'
import Layout from './layout/Layout'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { useDashboardStats, useRecentActivity, useUsers } from '@/hooks/useApi'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Clock3,
  FileText,
  GraduationCap,
  UserPlus,
  Users,
} from 'lucide-react'
import { User } from '@/services/api'

const getDaysSince = (isoDate?: string): number => {
  if (!isoDate) return 999
  const timestamp = new Date(isoDate).getTime()
  if (Number.isNaN(timestamp)) return 999
  return Math.max(0, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24)))
}

const getActivityTone = (action: string): 'success' | 'warning' | 'info' => {
  const normalized = action.toLowerCase()
  if (normalized.includes('completed') || normalized.includes('cert') || normalized.includes('conclu')) {
    return 'success'
  }
  if (normalized.includes('pending') || normalized.includes('aguarda') || normalized.includes('inactive')) {
    return 'warning'
  }
  return 'info'
}

function DashboardComponent() {
  const navigate = useNavigate()
  const statsState = useDashboardStats()
  const activityState = useRecentActivity()
  const usersState = useUsers()

  const loading = statsState.loading || activityState.loading || usersState.loading
  const error = statsState.error || activityState.error || usersState.error

  const stats = statsState.data ?? {
    totalUsers: 0,
    activeUsers: 0,
    coursesCompleted: 0,
    certificatesIssued: 0,
    averageCompletionTime: 0,
    openAlerts: 0,
    placedApplications: 0
  }

  const users = usersState.data?.users ?? []
  const recentActivity = activityState.data ?? []

  const derived = useMemo(() => {
    const activeUsers = users.filter(user => user.status === 'Ativo')
    const inactiveUsers = users.filter(user => user.status === 'Inativo')
    const priorityUsers = activeUsers
      .map(user => ({
        ...user,
        daysSinceActivity: getDaysSince(user.lastActivity)
      }))
      .filter(user => user.daysSinceActivity >= 14 || user.totalProgress < 35)
      .sort((left, right) => right.daysSinceActivity - left.daysSinceActivity || left.totalProgress - right.totalProgress)
      .slice(0, 4)

    const activationRate = stats.totalUsers > 0
      ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
      : 0

    return {
      activeUsers,
      inactiveUsers,
      priorityUsers,
      activationRate
    }
  }, [stats.activeUsers, stats.totalUsers, users])

  const actionCards = [
    {
      title: 'Activar novas beneficiárias',
      description: 'Conclua códigos pendentes e entregue acesso ao app.',
      icon: UserPlus,
      onClick: () => navigate('/active')
    },
    {
      title: 'Revisar acompanhamento',
      description: 'Abra a lista completa e priorize casos com risco de abandono.',
      icon: Users,
      onClick: () => navigate('/users')
    },
    ...(isFollowUpAlertsPhase2Enabled
      ? [
          {
            title: 'Atacar alertas abertos',
            description: 'Entre na fila operacional de risco e atribua owner aos casos.',
            icon: AlertTriangle,
            onClick: () => navigate('/alerts')
          },
          {
            title: 'Agendar follow-up',
            description: 'Dispare check-ins para colocações já em curso.',
            icon: BriefcaseBusiness,
            onClick: () => navigate('/follow-up')
          }
        ]
      : [
          {
            title: 'Gerir empregadores',
            description: 'Valide parceiros e mantenha a rede ativa para novas colocações.',
            icon: BriefcaseBusiness,
            onClick: () => navigate('/employers')
          },
          {
            title: 'Rever matches',
            description: 'Confirme shortlist, revisão social e transições de candidatura.',
            icon: AlertTriangle,
            onClick: () => navigate('/matches')
          }
        ])
  ]

  return (
    <Layout title="Dashboard WIRA" subtitle="Visão operacional com prioridades do dia, atividade recente e ações imediatas.">
      <LoadingOverlay show={loading} message="A carregar dashboard..." />

      {error ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6 text-rose-700">{error}</CardContent>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Beneficiárias ativas"
          value={`${stats.activeUsers}/${stats.totalUsers}`}
          description={`${derived.activationRate}% da base com acesso activo`}
          icon={Users}
          tone="primary"
        />
        <MetricCard
          title="Certificados emitidos"
          value={stats.certificatesIssued}
          description="Indicador direto de conclusão e reconhecimento"
          icon={Award}
          tone="success"
        />
        <MetricCard
          title="Cursos concluídos"
          value={stats.coursesCompleted}
          description="Volume total de percursos finalizados"
          icon={GraduationCap}
          tone="neutral"
        />
        <MetricCard
          title="Tempo médio"
          value={`${stats.averageCompletionTime} dias`}
          description="Tempo médio até à conclusão completa"
          icon={Clock3}
          tone="warning"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {isFollowUpAlertsPhase2Enabled ? (
          <>
            <MetricCard
              title="Colocações"
              value={stats.placedApplications ?? 0}
              description="Candidaturas já em acompanhamento pós-colocação"
              icon={BriefcaseBusiness}
              tone="success"
            />
            <MetricCard
              title="Alertas abertos"
              value={stats.openAlerts ?? 0}
              description="Casos operacionais que exigem resposta"
              icon={AlertTriangle}
              tone="warning"
            />
          </>
        ) : (
          <>
            <MetricCard
              title="Base inativa"
              value={derived.inactiveUsers.length}
              description="Beneficiárias sem activação ou sem uso recente"
              icon={Users}
              tone="neutral"
            />
            <MetricCard
              title="Prioridade do dia"
              value={derived.priorityUsers.length}
              description="Casos que exigem atenção operacional imediata"
              icon={BriefcaseBusiness}
              tone="success"
            />
          </>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">Ações recomendadas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {actionCards.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.onClick}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-left transition hover:border-primary/20 hover:bg-white"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-950">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-950">
              <Activity className="h-5 w-5 text-primary" />
              Atividade recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div>
                <p className="font-medium text-slate-950">Fecho rápido</p>
                <p className="text-muted-foreground">
                  {derived.activationRate}% da base está ativa. Use relatórios quando precisar de partilha externa.
                </p>
              </div>
              <Button variant="outline" className="shrink-0" onClick={() => navigate('/reports')}>
                <FileText className="mr-2 h-4 w-4" />
                Abrir relatórios
              </Button>
            </div>

            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda não há atividade recente para apresentar.</p>
            ) : (
              recentActivity.slice(0, 4).map(item => (
                <div key={item.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">{item.user}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.action}</p>
                    </div>
                    <StatusBadge status={getActivityTone(item.action)}>
                      {getActivityTone(item.action) === 'success' ? 'Conquista' : getActivityTone(item.action) === 'warning' ? 'Pendência' : 'Atualização'}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(item.time).toLocaleString('pt-PT')}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">Beneficiárias para acompanhamento imediato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {derived.priorityUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum caso crítico identificado nas últimas verificações.</p>
            ) : (
              derived.priorityUsers.map((user) => (
                <PriorityUserRow key={user.id} user={user} onOpen={() => navigate(`/users/${user.id}`)} />
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </Layout>
  )
}

function PriorityUserRow({ user, onOpen }: { user: User & { daysSinceActivity: number }; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-4 rounded-3xl border border-slate-200 px-4 py-4 text-left transition hover:border-primary/20 hover:bg-slate-50"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-950">{user.anonymousCode}</p>
          <StatusBadge status={user.daysSinceActivity >= 14 ? 'warning' : 'info'}>
            {user.daysSinceActivity >= 14 ? 'Sem atividade' : 'Acompanhar'}
          </StatusBadge>
        </div>
        <p className="text-sm text-muted-foreground">{user.ngoId}</p>
        <p className="text-sm text-slate-700">{user.totalProgress}% de progresso · {user.daysSinceActivity} dias desde a última atividade</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </button>
  )
}

const Dashboard = memo(DashboardComponent)
Dashboard.displayName = 'Dashboard'

export default Dashboard
