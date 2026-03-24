import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DataTable from '@/components/ui/DataTable'
import MetricCard from '@/components/ui/MetricCard'
import StatusBadge from '@/components/ui/StatusBadge'
import { EmptyUsers } from '@/components/ui/EmptyState'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import Layout from './layout/Layout'
import { AlertTriangle, ArrowRight, Download, TrendingUp, UserPlus, Users } from 'lucide-react'
import { useUsers } from '@/hooks/useApi'
import { User } from '@/services/api'

export default function UsersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const pageSize = 20

  const { data, loading, error } = useUsers({
    page,
    pageSize,
    search: search.trim() || undefined,
    status
  })

  const users = data?.users ?? []
  const pagination = data?.pagination

  const stats = useMemo(() => ({
    total: pagination?.total ?? users.length,
    active: users.filter(u => u.status === 'Ativo').length,
    inactive: users.filter(u => u.status === 'Inativo').length,
    avgProgress: users.length > 0
      ? Math.round(users.reduce((acc, u) => acc + u.totalProgress, 0) / users.length)
      : 0
  }), [pagination?.total, users])

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
      title: 'Última atividade',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleString('pt-PT')
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

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1

  return (
    <Layout title="Gestão de beneficiárias" subtitle="Procure perfis, identifique riscos e aceda rapidamente aos detalhes mais relevantes.">
      <LoadingOverlay show={loading} message="A carregar beneficiárias..." />

      {error ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6 text-rose-700">{error}</CardContent>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Base total" value={stats.total} description="Perfis registados na plataforma" icon={Users} tone="primary" />
        <MetricCard title="Activas" value={stats.active} description="Na página actual" icon={TrendingUp} tone="success" />
        <MetricCard title="Inactivas" value={stats.inactive} description="Na página actual" icon={AlertTriangle} tone="warning" />
        <MetricCard title="Progresso médio" value={`${stats.avgProgress}%`} description="Ritmo agregado da página actual" icon={ArrowRight} tone="neutral" />
      </section>

      <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-950">Leitura rápida</p>
            <p className="text-sm text-muted-foreground">
              Use pesquisa e filtros para trabalhar sobre a paginação real do backend sem carregar toda a base de uma vez.
            </p>
          </div>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button variant={status === undefined ? 'default' : 'outline'} onClick={() => { setStatus(undefined); setPage(1) }}>
                Todos
              </Button>
              <Button variant={status === 'Ativo' ? 'default' : 'outline'} onClick={() => { setStatus('Ativo'); setPage(1) }}>
                Activas
              </Button>
              <Button variant={status === 'Inativo' ? 'default' : 'outline'} onClick={() => { setStatus('Inativo'); setPage(1) }}>
                Inactivas
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Buscar por código, ONG ou nome..."
                className="min-w-[240px]"
              />
              <Button variant="outline" onClick={handleExportUsers}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
              <Button onClick={() => navigate('/active')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Nova activação
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl text-slate-950">Lista de beneficiárias</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Clique numa linha para abrir o detalhe, acompanhar evolução e decidir a próxima ação.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <EmptyUsers onAdd={() => navigate('/active')} />
          ) : (
            <>
              <DataTable
                data={users}
                columns={columns}
                searchable={false}
                pagination={false}
                emptyMessage="Nenhuma beneficiária corresponde aos filtros atuais."
                onRowClick={(row) => navigate(`/users/${row.id}`)}
                actions={[
                  {
                    label: 'Ver detalhes',
                    onClick: (row) => navigate(`/users/${row.id}`),
                    icon: ArrowRight
                  }
                ]}
              />
              {pagination ? (
                <div className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                  <div>
                    Página {pagination.page} de {totalPages} · {pagination.total} registos
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={pagination.page <= 1}>
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => prev + 1)}
                      disabled={pagination.page >= totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </Layout>
  )
}
