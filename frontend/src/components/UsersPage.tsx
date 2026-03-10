import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import DataTable from '@/components/ui/DataTable'
import MetricCard from '@/components/ui/MetricCard'
import StatusBadge from '@/components/ui/StatusBadge'
import { EmptyUsers } from '@/components/ui/EmptyState'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import Layout from './layout/Layout'
import { Users, Eye, Download, UserPlus } from 'lucide-react'
import { useUsers } from '@/hooks/useApi'
import { User } from '@/services/api'

export default function UsersPage() {
  const navigate = useNavigate()
  const { data, loading, error } = useUsers()
  const users = data ?? []

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'Ativo').length,
    inactive: users.filter(u => u.status === 'Inativo').length,
    avgProgress: users.length > 0
      ? Math.round(users.reduce((acc, u) => acc + u.totalProgress, 0) / users.length)
      : 0
  }), [users])

  const columns = [
    {
      key: 'anonymousCode' as keyof User,
      title: 'Código',
      sortable: true
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
      render: (value: string) => (
        <StatusBadge status={value === 'Ativo' ? 'active' : 'inactive'} />
      )
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

  const handleExportUsers = (): void => {
    const rows = users.map(user =>
      [
        user.anonymousCode,
        user.ngoId,
        user.status,
        String(user.totalProgress),
        String(user.coursesCompleted),
        String(user.certificatesEarned),
        user.lastActivity
      ].join(',')
    )
    const csv = `codigo,ngo,status,progresso,cursos,certificados,last_activity\n${rows.join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'wira-users.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout title="Gestão de Beneficiárias" subtitle="Dados reais da API WIRA">
      <LoadingOverlay show={loading} message="Carregando beneficiárias..." />

      {error ? (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-700">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard title="Total" value={stats.total} icon={Users} />
        <MetricCard title="Ativas" value={stats.active} icon={Users} />
        <MetricCard title="Inativas" value={stats.inactive} icon={Users} />
        <MetricCard title="Progresso Médio" value={`${stats.avgProgress}%`} icon={Users} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Lista de Beneficiárias</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportUsers}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button size="sm" onClick={() => navigate('/active')}>
              <UserPlus className="mr-2 h-4 w-4" />
              Activar Nova
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <EmptyUsers onAdd={() => navigate('/active')} />
          ) : (
            <DataTable
              data={users}
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
          )}
        </CardContent>
      </Card>
    </Layout>
  )
}

