import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ShieldCheck, Sparkles, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import Layout from './layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import StatusBadge from '@/components/ui/StatusBadge'
import MetricCard from '@/components/ui/MetricCard'
import EmptyState from '@/components/ui/EmptyState'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { apiService, JobMatch } from '@/services/api'
import { invalidateApiCache, useJobsAdmin, useMatches } from '@/hooks/useApi'

export default function JobMatchesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({})
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  const [submittingKey, setSubmittingKey] = useState<string | null>(null)

  const matchesState = useMatches({ jobId: id, status: undefined })
  const jobsState = useJobsAdmin()
  const matches = matchesState.data ?? []
  const job = useMemo(() => (jobsState.data ?? []).find(item => item.id === id) ?? null, [jobsState.data, id])

  const metrics = useMemo(() => ({
    total: matches.length,
    ngoReviewed: matches.filter(item => item.status === 'NGO_REVIEWED').length,
    socialReviewed: matches.filter(item => item.status === 'SOCIAL_REVIEWED').length,
    confirmed: matches.filter(item => item.status === 'VICTIM_CONFIRMED').length
  }), [matches])

  const mutateMatch = async (operation: () => Promise<unknown>, successMessage: string): Promise<void> => {
    try {
      await operation()
      invalidateApiCache(cacheKey => cacheKey.startsWith('matches:') || cacheKey.startsWith('applications:') || cacheKey === 'dashboard-stats')
      await matchesState.refetch()
      toast.success(successMessage)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSubmittingKey(null)
    }
  }

  const handleReview = async (match: JobMatch, reviewType: 'ngo' | 'social', decision: 'approve' | 'reject'): Promise<void> => {
    const notes = decisionNotes[`${match.id}:${reviewType}`] ?? ''
    const rejectionReason = rejectionReasons[`${match.id}:${reviewType}`] ?? ''
    if (decision === 'reject' && !rejectionReason.trim()) {
      toast.error('Rejeição exige motivo')
      return
    }

    setSubmittingKey(`${match.id}:${reviewType}:${decision}`)
    await mutateMatch(
      () => apiService.reviewMatch(match.id, {
        decision,
        reviewType,
        notes,
        rejectionReason
      }),
      `Revisão ${reviewType === 'ngo' ? 'ONG' : 'social'} registada`
    )
  }

  const handleVictimConfirmation = async (match: JobMatch, confirmed: boolean): Promise<void> => {
    const notes = decisionNotes[`${match.id}:victim`] ?? ''
    if (!confirmed && !notes.trim()) {
      toast.error('Rejeição da beneficiária exige motivo')
      return
    }
    setSubmittingKey(`${match.id}:victim:${confirmed}`)
    await mutateMatch(
      () => apiService.confirmVictimMatch(match.id, { confirmed, notes }),
      confirmed ? 'Confirmação da beneficiária registada' : 'Recusa da beneficiária registada'
    )
  }

  return (
    <Layout title="Matches da vaga" subtitle={job ? `Shortlist operacional para ${job.title}` : 'Reveja a shortlist, execute a validação tripla e acompanhe o histórico por candidata.'}>
      <LoadingOverlay show={matchesState.loading || jobsState.loading} message="A carregar shortlist..." />

      {matchesState.error ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6 text-rose-700">{matchesState.error}</CardContent>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Matches" value={metrics.total} description="Shortlist actual da vaga" icon={Sparkles} tone="primary" />
        <MetricCard title="ONG revista" value={metrics.ngoReviewed} description="Passaram pela primeira triagem" icon={CheckCircle2} tone="warning" />
        <MetricCard title="Social revista" value={metrics.socialReviewed} description="Validação intermédia concluída" icon={ShieldCheck} tone="neutral" />
        <MetricCard title="Confirmadas" value={metrics.confirmed} description="Prontas para submissão" icon={CheckCircle2} tone="success" />
      </section>

      {!matches.length ? (
        <EmptyState
          icon={Sparkles}
          title="Sem shortlist"
          description="Gere o matching na página de vagas para produzir a shortlist desta vaga."
          action={{ label: 'Voltar às vagas', onClick: () => navigate('/jobs') }}
        />
      ) : (
        <div className="space-y-6">
          {matches.map(match => {
            const ngoNotesKey = `${match.id}:ngo`
            const socialNotesKey = `${match.id}:social`
            const victimNotesKey = `${match.id}:victim`
            const canSocialReview = match.status === 'NGO_REVIEWED' || match.status === 'SOCIAL_REVIEWED'
            const canVictimConfirm = match.status === 'SOCIAL_REVIEWED' || match.status === 'VICTIM_CONFIRMED'

            return (
              <Card key={match.id} className="rounded-[32px] border-white/70 bg-white shadow-sm">
                <CardHeader className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-slate-950">{match.user?.anonymous_code ?? match.anonymous_code}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={match.status === 'VICTIM_CONFIRMED' ? 'success' : match.status === 'REJECTED' ? 'inactive' : 'warning'}>
                        {match.status}
                      </StatusBadge>
                      <StatusBadge status="info">{match.score}% fit</StatusBadge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {match.shared_skills ? `Skills alinhadas: ${match.shared_skills}` : 'Sem skills partilhadas explícitas'}.
                    </p>
                    {match.rationale ? (
                      <p className="text-sm text-slate-700">{match.rationale.split('|').join(' • ')}</p>
                    ) : null}
                  </div>
                  <Button variant="outline" onClick={() => navigate('/applications')}>
                    Abrir candidaturas
                  </Button>
                </CardHeader>
                <CardContent className="grid gap-6 xl:grid-cols-3">
                  <div className="space-y-3 rounded-3xl bg-slate-50 p-5">
                    <p className="font-semibold text-slate-950">Revisão ONG</p>
                    <Textarea
                      placeholder="Notas ONG"
                      value={decisionNotes[ngoNotesKey] ?? ''}
                      onChange={(event) => setDecisionNotes(prev => ({ ...prev, [ngoNotesKey]: event.target.value }))}
                    />
                    <Input
                      placeholder="Motivo da rejeição"
                      value={rejectionReasons[ngoNotesKey] ?? ''}
                      onChange={(event) => setRejectionReasons(prev => ({ ...prev, [ngoNotesKey]: event.target.value }))}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => void handleReview(match, 'ngo', 'approve')} disabled={submittingKey === `${match.id}:ngo:approve`}>
                        Aprovar ONG
                      </Button>
                      <Button variant="outline" onClick={() => void handleReview(match, 'ngo', 'reject')} disabled={submittingKey === `${match.id}:ngo:reject`}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-3xl bg-slate-50 p-5">
                    <p className="font-semibold text-slate-950">Revisão social</p>
                    <Textarea
                      placeholder="Notas revisão social"
                      value={decisionNotes[socialNotesKey] ?? ''}
                      onChange={(event) => setDecisionNotes(prev => ({ ...prev, [socialNotesKey]: event.target.value }))}
                    />
                    <Input
                      placeholder="Motivo da rejeição"
                      value={rejectionReasons[socialNotesKey] ?? ''}
                      onChange={(event) => setRejectionReasons(prev => ({ ...prev, [socialNotesKey]: event.target.value }))}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => void handleReview(match, 'social', 'approve')} disabled={!canSocialReview || submittingKey === `${match.id}:social:approve`}>
                        Aprovar social
                      </Button>
                      <Button variant="outline" onClick={() => void handleReview(match, 'social', 'reject')} disabled={!canSocialReview || submittingKey === `${match.id}:social:reject`}>
                        Rejeitar
                      </Button>
                    </div>
                    {!canSocialReview ? <p className="text-xs text-muted-foreground">A revisão social só abre após aprovação ONG.</p> : null}
                  </div>

                  <div className="space-y-3 rounded-3xl bg-slate-50 p-5">
                    <p className="font-semibold text-slate-950">Confirmação da beneficiária</p>
                    <Textarea
                      placeholder="Notas / motivo da recusa"
                      value={decisionNotes[victimNotesKey] ?? ''}
                      onChange={(event) => setDecisionNotes(prev => ({ ...prev, [victimNotesKey]: event.target.value }))}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => void handleVictimConfirmation(match, true)} disabled={!canVictimConfirm || submittingKey === `${match.id}:victim:true`}>
                        Confirmar interesse
                      </Button>
                      <Button variant="outline" onClick={() => void handleVictimConfirmation(match, false)} disabled={!canVictimConfirm || submittingKey === `${match.id}:victim:false`}>
                        Rejeitar
                      </Button>
                    </div>
                    {!canVictimConfirm ? <p className="text-xs text-muted-foreground">A confirmação só abre após revisão social.</p> : null}
                    {match.applications?.length ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                        <p className="font-medium text-slate-950">Histórico de candidatura</p>
                        {match.applications.map(application => (
                          <p key={application.id}>#{application.id} · {application.status} · {new Date(application.applied_at).toLocaleString('pt-PT')}</p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
