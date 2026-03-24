import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import Layout from './layout/Layout'
import MetricCard from './ui/MetricCard'
import StatusBadge from './ui/StatusBadge'
import DataTable from './ui/DataTable'
import { Users, Activity, Award, BarChart3, Eye, Filter } from 'lucide-react'
import { useUsers } from '@/hooks/useApi'
import { User } from '@/services/api'

type FilterType = 'all' | 'Ativo' | 'Inativo'

export default function MonitorProgress() {
  const navigate = useNavigate()
  const { data, loading, error } = useUsers()
  const users = data?.users ?? []
  const [filter, setFilter] = useState<FilterType>('all')

  const filteredUsers = useMemo(() => {
    if (filter === 'all') {
      return users
    }
    return users.filter(user => user.status === filter)
  }, [filter, users])

  const metrics = useMemo(() => {
    const totalUsers = users.length
    const activeUsers = users.filter(user => user.status === 'Ativo').length
    const avgProgress = totalUsers > 0
      ? Math.round(users.reduce((acc, user) => acc + user.totalProgress, 0) / totalUsers)
      : 0

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: Math.max(0, totalUsers - activeUsers),
      avgProgress,
      certificates: users.reduce((acc, user) => acc + user.certificatesEarned, 0)
    }
  }, [users])

  const columns = [
    {
      key: 'anonymousCode' as keyof User,
      title: 'Código',
      sortable: true,
      render: (value: string) => <Badge variant="secondary" className="font-mono">{value}</Badge>
    },
    {
      key: 'ngoId' as keyof User,
      title: 'ONG',
      sortable: true
    },
    {
      key: 'status' as keyof User,
      title: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value === 'Ativo' ? 'active' : 'inactive'} />
    },
    {
      key: 'totalProgress' as keyof User,
      title: 'Progresso',
      sortable: true,
      render: (value: number) => `${value}%`
    },
    {
      key: 'coursesCompleted' as keyof User,
      title: 'Cursos',
      sortable: true
    },
    {
      key: 'certificatesEarned' as keyof User,
      title: 'Certificados',
      sortable: true
    },
    {
      key: 'lastActivity' as keyof User,
      title: 'Última Atividade',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleString('pt-MZ')
    }
  ]

  return (
    <Layout title="Monitorar Progresso" subtitle="Acompanhamento em tempo real das beneficiárias">
      <LoadingOverlay show={loading} message="Carregando progresso..." />

      {error ? (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-700">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard title="Total" value={metrics.totalUsers} icon={Users} />
        <MetricCard title="Ativas" value={metrics.activeUsers} icon={Activity} />
        <MetricCard title="Inativas" value={metrics.inactiveUsers} icon={Users} />
        <MetricCard title="Progresso Médio" value={`${metrics.avgProgress}%`} icon={BarChart3} />
        <MetricCard title="Certificados" value={metrics.certificates} icon={Award} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
            Todos ({metrics.totalUsers})
          </Button>
          <Button variant={filter === 'Ativo' ? 'default' : 'outline'} onClick={() => setFilter('Ativo')}>
            Ativos ({metrics.activeUsers})
          </Button>
          <Button variant={filter === 'Inativo' ? 'default' : 'outline'} onClick={() => setFilter('Inativo')}>
            Inativos ({metrics.inactiveUsers})
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Usuários ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredUsers}
            columns={columns}
            searchPlaceholder="Buscar por código ou ONG..."
            onRowClick={(row) => navigate(`/users/${row.id}`)}
            actions={[
              {
                label: 'Ver Detalhes',
                onClick: (row) => navigate(`/users/${row.id}`),
                icon: Eye
              }
            ]}
          />
        </CardContent>
      </Card>
    </Layout>
  )
}


