import { useMemo, useState } from 'react'
import { Building2, CheckCircle2, MapPin, Plus, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import Layout from './layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import MetricCard from '@/components/ui/MetricCard'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { apiService, Employer, EmployerMutationInput } from '@/services/api'
import { useEmployers, invalidateApiCache } from '@/hooks/useApi'

const validationOptions = ['PENDING', 'VALIDATED', 'REJECTED', 'SUSPENDED'] as const

const initialForm: EmployerMutationInput = {
  name: '',
  sector: '',
  nuit: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  location: '',
  validationStatus: 'PENDING',
  validationNotes: '',
  notes: ''
}

export default function EmployersPage() {
  const [status, setStatus] = useState<string>('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [editingEmployer, setEditingEmployer] = useState<Employer | null>(null)
  const [form, setForm] = useState<EmployerMutationInput>(initialForm)
  const [submitting, setSubmitting] = useState(false)

  const { data: employers, loading, error, refetch } = useEmployers({
    status: status || undefined,
    active: activeOnly
  })

  const metrics = useMemo(() => {
    const items = employers ?? []
    return {
      total: items.length,
      validated: items.filter(item => item.validation_status === 'VALIDATED').length,
      pending: items.filter(item => item.validation_status === 'PENDING').length,
      active: items.filter(item => item.is_active).length
    }
  }, [employers])

  const resetForm = (): void => {
    setEditingEmployer(null)
    setForm(initialForm)
  }

  const startEdit = (employer: Employer): void => {
    setEditingEmployer(employer)
    setForm({
      name: employer.name,
      sector: employer.sector ?? '',
      nuit: employer.nuit ?? '',
      contactName: employer.contact_name ?? '',
      contactPhone: employer.contact_phone ?? '',
      contactEmail: employer.contact_email ?? '',
      location: employer.location ?? '',
      validationStatus: employer.validation_status,
      validationNotes: employer.validation_notes ?? '',
      notes: employer.notes ?? '',
      isActive: employer.is_active
    })
  }

  const handleSubmit = async (): Promise<void> => {
    if (!form.name?.trim()) {
      toast.error('Nome do empregador é obrigatório')
      return
    }

    setSubmitting(true)
    try {
      if (editingEmployer) {
        await apiService.updateEmployer(editingEmployer.id, form)
        toast.success('Empregador actualizado com sucesso')
      } else {
        await apiService.createEmployer(form)
        toast.success('Empregador criado com sucesso')
      }

      invalidateApiCache(cacheKey => cacheKey.startsWith('employers:') || cacheKey === 'dashboard-stats')
      resetForm()
      await refetch()
    } catch (submitError) {
      toast.error((submitError as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      key: 'name' as keyof Employer,
      title: 'Empregador',
      sortable: true
    },
    {
      key: 'sector' as keyof Employer,
      title: 'Sector',
      sortable: true,
      render: (value: string | null | undefined) => value ?? 'Sem sector'
    },
    {
      key: 'location' as keyof Employer,
      title: 'Localização',
      sortable: true,
      render: (value: string | null | undefined) => value ?? 'Sem localização'
    },
    {
      key: 'validation_status' as keyof Employer,
      title: 'Validação',
      sortable: true,
      render: (value: Employer['validation_status']) => (
        <StatusBadge status={value === 'VALIDATED' ? 'success' : value === 'PENDING' ? 'warning' : 'inactive'}>
          {value}
        </StatusBadge>
      )
    },
    {
      key: 'is_active' as keyof Employer,
      title: 'Estado',
      sortable: true,
      render: (value: boolean) => <StatusBadge status={value ? 'active' : 'inactive'}>{value ? 'Activo' : 'Inactivo'}</StatusBadge>
    }
  ]

  return (
    <Layout title="Empregadores" subtitle="Registe parceiros, acompanhe validação ética e mantenha a base pronta para criação de vagas.">
      <LoadingOverlay show={loading} message="A carregar empregadores..." />

      {error ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6 text-rose-700">{error}</CardContent>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Base total" value={metrics.total} description="Empregadores carregados com filtros atuais" icon={Building2} tone="primary" />
        <MetricCard title="Validados" value={metrics.validated} description="Prontos para operar vagas" icon={CheckCircle2} tone="success" />
        <MetricCard title="Pendentes" value={metrics.pending} description="Exigem revisão operacional" icon={RefreshCcw} tone="warning" />
        <MetricCard title="Activos" value={metrics.active} description="Disponíveis no ecossistema" icon={MapPin} tone="neutral" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">{editingEmployer ? 'Editar empregador' : 'Novo empregador'}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Nome" value={form.name ?? ''} onChange={(event) => setForm(prev => ({ ...prev, name: event.target.value }))} />
              <Input placeholder="Sector" value={form.sector ?? ''} onChange={(event) => setForm(prev => ({ ...prev, sector: event.target.value }))} />
              <Input placeholder="NUIT / registo" value={form.nuit ?? ''} onChange={(event) => setForm(prev => ({ ...prev, nuit: event.target.value }))} />
              <Input placeholder="Localização" value={form.location ?? ''} onChange={(event) => setForm(prev => ({ ...prev, location: event.target.value }))} />
              <Input placeholder="Contacto" value={form.contactName ?? ''} onChange={(event) => setForm(prev => ({ ...prev, contactName: event.target.value }))} />
              <Input placeholder="Telefone" value={form.contactPhone ?? ''} onChange={(event) => setForm(prev => ({ ...prev, contactPhone: event.target.value }))} />
              <Input placeholder="Email" value={form.contactEmail ?? ''} onChange={(event) => setForm(prev => ({ ...prev, contactEmail: event.target.value }))} />
              <select
                className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                value={form.validationStatus ?? 'PENDING'}
                onChange={(event) => setForm(prev => ({ ...prev, validationStatus: event.target.value as Employer['validation_status'] }))}
              >
                {validationOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <Textarea placeholder="Notas de validação" value={form.validationNotes ?? ''} onChange={(event) => setForm(prev => ({ ...prev, validationNotes: event.target.value }))} />
            <Textarea placeholder="Notas internas" value={form.notes ?? ''} onChange={(event) => setForm(prev => ({ ...prev, notes: event.target.value }))} />

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive ?? true}
                onChange={(event) => setForm(prev => ({ ...prev, isActive: event.target.checked }))}
              />
              Empregador activo
            </label>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void handleSubmit()} disabled={submitting}>
                <Plus className="mr-2 h-4 w-4" />
                {submitting ? 'A guardar...' : editingEmployer ? 'Guardar alterações' : 'Criar empregador'}
              </Button>
              {editingEmployer ? (
                <Button variant="outline" onClick={resetForm}>
                  Cancelar edição
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">Filtros operacionais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <select
              className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Todos os estados</option>
              {validationOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)} />
              Mostrar apenas activos
            </label>
            <Button variant="outline" onClick={() => void refetch()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Actualizar lista
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-950">Lista operacional</CardTitle>
        </CardHeader>
        <CardContent>
          {!employers || employers.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Sem empregadores"
              description="Crie o primeiro empregador para começar a preparar vagas validadas."
              action={{ label: 'Criar empregador', onClick: () => resetForm() }}
            />
          ) : (
            <DataTable
              data={employers}
              columns={columns}
              searchable={false}
              onRowClick={startEdit}
              actions={[
                {
                  label: 'Editar',
                  onClick: startEdit
                }
              ]}
            />
          )}
        </CardContent>
      </Card>
    </Layout>
  )
}
