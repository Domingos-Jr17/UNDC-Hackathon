import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Award, BadgeCheck, Copy, ExternalLink, FilePlus2, Search, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import Layout from './layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import MetricCard from '@/components/ui/MetricCard'
import EmptyState from '@/components/ui/EmptyState'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { apiService, CertificateRecord, CertificateVerification } from '@/services/api'
import { invalidateApiCache, useCourses, useUserCertificates, useUserDetails, useUsers } from '@/hooks/useApi'

const scorePresets = [70, 80, 90, 100]

export default function CertificatesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const preselectedUserId = typeof (location.state as { userId?: string } | null)?.userId === 'string'
    ? (location.state as { userId?: string }).userId ?? ''
    : ''
  const [userSearch, setUserSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState(preselectedUserId)
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [score, setScore] = useState('70')
  const [verificationInput, setVerificationInput] = useState('')
  const [manualVerification, setManualVerification] = useState<CertificateVerification | null>(null)
  const [verifyingCode, setVerifyingCode] = useState<string | null>(null)
  const [verificationFeedback, setVerificationFeedback] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const usersState = useUsers({
    page: 1,
    pageSize: 12,
    search: userSearch.trim() || undefined
  })
  const userDetailsState = useUserDetails(selectedUserId)
  const certificatesState = useUserCertificates(selectedUserId)
  const coursesState = useCourses()

  const users = usersState.data?.users ?? []
  const courses = coursesState.data ?? []
  const selectedUser = userDetailsState.data ?? users.find(user => String(user.id) === selectedUserId) ?? null
  const certificates = certificatesState.data ?? []
  const userOptions = useMemo(
    () => selectedUser && users.every(user => String(user.id) !== String(selectedUser.id))
      ? [selectedUser, ...users]
      : users,
    [selectedUser, users]
  )

  useEffect(() => {
    if (selectedCourseId && !courses.some(course => course.id === selectedCourseId)) {
      setSelectedCourseId('')
    }
  }, [courses, selectedCourseId])

  const metrics = useMemo(() => {
    if (!certificates.length) {
      return {
        total: 0,
        averageScore: 0,
        latestIssue: 'Sem emissão',
        uniqueCourses: 0
      }
    }

    const averageScore = Math.round(certificates.reduce((acc, item) => acc + item.score, 0) / certificates.length)

    return {
      total: certificates.length,
      averageScore,
      latestIssue: new Date(certificates[0].issueDate).toLocaleDateString('pt-PT'),
      uniqueCourses: new Set(certificates.map(item => item.courseId)).size
    }
  }, [certificates])

  const handleVerifyCertificate = async (code: string): Promise<void> => {
    try {
      setVerifyingCode(code)
      const response = await apiService.verifyCertificate(code)
      setVerificationFeedback(prev => ({
        ...prev,
        [code]: response.valid ? 'Certificado validado com sucesso.' : 'Certificado inválido.'
      }))
    } catch (error) {
      setVerificationFeedback(prev => ({
        ...prev,
        [code]: (error as Error).message
      }))
    } finally {
      setVerifyingCode(null)
    }
  }

  const handleGenerateCertificate = async (): Promise<void> => {
    if (!selectedUser?.anonymousCode) {
      toast.error('Seleccione uma beneficiária antes de gerar o certificado')
      return
    }

    if (!selectedCourseId) {
      toast.error('Seleccione um curso')
      return
    }

    const numericScore = Number(score)
    if (!Number.isFinite(numericScore) || numericScore < 70 || numericScore > 100) {
      toast.error('Introduza uma pontuação entre 70 e 100')
      return
    }

    setSubmitting(true)
    try {
      const response = await apiService.generateCertificate({
        anonymousCode: selectedUser.anonymousCode,
        courseId: selectedCourseId,
        score: numericScore
      })

      invalidateApiCache(cacheKey =>
        cacheKey === 'dashboard-stats' ||
        cacheKey.startsWith('users:') ||
        cacheKey.startsWith(`user-details:${selectedUserId}`) ||
        cacheKey.startsWith(`user-certificates:${selectedUserId}`)
      )

      await Promise.all([
        certificatesState.refetch(),
        userDetailsState.refetch()
      ])

      setVerificationInput(response.verificationCode)
      toast.success(response.message)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleManualVerify = async (): Promise<void> => {
    if (!verificationInput.trim()) {
      toast.error('Introduza um código de verificação')
      return
    }

    try {
      setVerifyingCode('manual')
      const response = await apiService.verifyCertificate(verificationInput.trim())
      setManualVerification(response)
      toast.success(response.valid ? 'Certificado confirmado.' : 'Certificado inválido.')
    } catch (error) {
      setManualVerification(null)
      toast.error((error as Error).message)
    } finally {
      setVerifyingCode(null)
    }
  }

  const handleCopyCode = async (code: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Código copiado')
    } catch {
      toast.error('Não foi possível copiar o código')
    }
  }

  const openVerificationPage = (certificate: CertificateRecord): void => {
    try {
      const url = new URL(certificate.qrCode, window.location.origin)
      const isHttp = url.protocol === 'https:' || url.protocol === 'http:'
      const isTrustedHost = url.hostname === window.location.hostname
      const isCertificatePath = url.pathname.includes('/api/certificates/verify/')

      if (!isHttp || !isTrustedHost || !isCertificatePath) {
        toast.error('Link de verificação inválido')
        return
      }

      window.open(url.toString(), '_blank', 'noopener,noreferrer')
    } catch {
      toast.error('Link de verificação inválido')
    }
  }

  return (
    <Layout title="Central de certificados" subtitle="Gere, valide e acompanhe certificados por beneficiária sem depender apenas do detalhe individual.">
      <LoadingOverlay
        show={usersState.loading || userDetailsState.loading || certificatesState.loading || coursesState.loading || submitting}
        message="A preparar certificados..."
      />

      {usersState.error || userDetailsState.error || certificatesState.error || coursesState.error ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6 text-rose-700">
            {usersState.error ?? userDetailsState.error ?? certificatesState.error ?? coursesState.error}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Certificados" value={metrics.total} description="Emitidos para a beneficiária seleccionada" icon={Award} tone="primary" />
        <MetricCard title="Nota média" value={`${metrics.averageScore}%`} description="Média das emissões activas" icon={BadgeCheck} tone="success" />
        <MetricCard title="Última emissão" value={metrics.latestIssue} description="Data mais recente disponível" icon={ShieldCheck} tone="neutral" />
        <MetricCard title="Cursos cobertos" value={metrics.uniqueCourses} description="Percursos com certificação registada" icon={FilePlus2} tone="warning" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">Emitir certificado</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <Input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value.toUpperCase())}
                placeholder="Buscar por código, ONG ou nome..."
              />
              <select
                className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
              >
                <option value="">Seleccionar beneficiária</option>
                {userOptions.map(user => (
                  <option key={user.id} value={String(user.id)}>
                    {user.anonymousCode} · {user.ngoId}
                  </option>
                ))}
              </select>
            </div>

            {!selectedUser ? (
              <EmptyState
                icon={Search}
                title="Escolha uma beneficiária"
                description="Pesquise por código ou ONG para carregar os certificados e emitir um novo documento com contexto correcto."
                size="sm"
              />
            ) : (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Beneficiária activa</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">{selectedUser.anonymousCode}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">ONG {selectedUser.ngoId} · {selectedUser.totalProgress}% de progresso total</p>
                  </div>
                  <Button variant="outline" onClick={() => navigate(`/users/${selectedUser.id}`)}>
                    Ver detalhe completo
                  </Button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.6fr]">
                  <select
                    className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                    value={selectedCourseId}
                    onChange={(event) => setSelectedCourseId(event.target.value)}
                  >
                    <option value="">Seleccionar curso</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>

                  <Input
                    type="number"
                    min="70"
                    max="100"
                    value={score}
                    onChange={(event) => setScore(event.target.value)}
                    placeholder="Pontuação"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {scorePresets.map(preset => (
                    <Button key={preset} type="button" variant={score === String(preset) ? 'default' : 'outline'} size="sm" onClick={() => setScore(String(preset))}>
                      {preset}%
                    </Button>
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button onClick={() => void handleGenerateCertificate()} disabled={submitting}>
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    {submitting ? 'A emitir...' : 'Gerar certificado'}
                  </Button>
                  <Button variant="outline" onClick={() => void certificatesState.refetch()} disabled={!selectedUserId}>
                    Actualizar lista
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">Validar certificado</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Input
              value={verificationInput}
              onChange={(event) => setVerificationInput(event.target.value.trim())}
              placeholder="Introduza o código de verificação"
            />
            <Button onClick={() => void handleManualVerify()} disabled={verifyingCode === 'manual'}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {verifyingCode === 'manual' ? 'A validar...' : 'Validar agora'}
            </Button>

            {manualVerification?.certificate ? (
              <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                <p className="font-semibold">Certificado confirmado</p>
                <p className="mt-2">{manualVerification.certificate.courseTitle}</p>
                <p className="mt-1">Código: {manualVerification.certificate.anonymousCode}</p>
                <p className="mt-1">Pontuação: {manualVerification.certificate.score}%</p>
              </div>
            ) : (
              <EmptyState
                icon={ShieldCheck}
                title="Validação rápida"
                description="Cole um código para confirmar autenticidade, curso e pontuação sem abrir o detalhe da beneficiária."
                size="sm"
              />
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl text-slate-950">Histórico de certificados</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Consulte emissões activas, valide códigos e abra o link de verificação quando precisar de partilhar evidências.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedUser ? (
            <EmptyState
              icon={Award}
              title="Sem beneficiária seleccionada"
              description="Seleccione uma beneficiária acima para carregar o histórico de certificados disponíveis."
            />
          ) : certificates.length === 0 ? (
            <EmptyState
              icon={Award}
              title="Ainda sem certificados"
              description="Quando esta beneficiária concluir um curso com nota suficiente, o certificado aparecerá aqui."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {certificates.map(certificate => (
                <div key={`${certificate.id}-${certificate.verificationCode}`} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{certificate.courseTitle}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Emitido em {new Date(certificate.issueDate).toLocaleDateString('pt-PT')}</p>
                    </div>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                      {certificate.score}%
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Código</p>
                    <p className="mt-1 font-mono text-sm text-slate-900">{certificate.verificationCode}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => void handleVerifyCertificate(certificate.verificationCode)} disabled={verifyingCode === certificate.verificationCode}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {verifyingCode === certificate.verificationCode ? 'Validando...' : 'Verificar'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void handleCopyCode(certificate.verificationCode)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar código
                    </Button>
                    <Button size="sm" onClick={() => openVerificationPage(certificate)}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir verificação
                    </Button>
                  </div>

                  {verificationFeedback[certificate.verificationCode] ? (
                    <p className="mt-3 text-sm text-muted-foreground">{verificationFeedback[certificate.verificationCode]}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  )
}
