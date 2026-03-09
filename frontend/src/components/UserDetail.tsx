import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import StatusBadge from '@/components/ui/StatusBadge'
import Layout from './layout/Layout'
import { ArrowLeft, User, GraduationCap, Award, Clock, BarChart3 } from 'lucide-react'
import { useUserDetails } from '@/hooks/useApi'
import { apiService } from '@/services/api'

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user, loading, error } = useUserDetails(id ?? '')
  const [verifyingCode, setVerifyingCode] = useState<string | null>(null)
  const [verificationFeedback, setVerificationFeedback] = useState<Record<string, string>>({})

  const progressRows = useMemo(() => user?.progress ?? [], [user?.progress])
  const certificateRows = useMemo(() => user?.certificates ?? [], [user?.certificates])

  const handleVerifyCertificate = async (code: string): Promise<void> => {
    try {
      setVerifyingCode(code)
      const response = await apiService.verifyCertificate(code)
      setVerificationFeedback(prev => ({
        ...prev,
        [code]: response.valid ? 'Certificado validado com sucesso' : 'Certificado invalido'
      }))
    } catch (verifyError) {
      setVerificationFeedback(prev => ({
        ...prev,
        [code]: (verifyError as Error).message
      }))
    } finally {
      setVerifyingCode(null)
    }
  }

  if (loading) {
    return (
      <Layout title="Detalhes da Beneficiaria" subtitle="Informacoes completas de progresso e certificacao">
        <LoadingOverlay show={loading} message="Carregando detalhes..." />
      </Layout>
    )
  }

  if (error || !user) {
    return (
      <Layout title="Detalhes da Beneficiaria" subtitle="Informacoes completas de progresso e certificacao">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-destructive">Beneficiaria nao encontrada</h2>
            <p className="text-muted-foreground mt-2">{error ?? 'Nao foi possivel carregar os dados solicitados.'}</p>
            <Button className="mt-4" onClick={() => navigate('/users')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Usuarios
            </Button>
          </CardContent>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout title="Detalhes da Beneficiaria" subtitle={`Codigo ${user.anonymousCode}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Usuarios
          </Button>
          <Button onClick={() => navigate('/reports')}>Abrir Relatorios</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{user.anonymousCode}</CardTitle>
                  <p className="text-muted-foreground">ONG: {user.ngoId}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{user.totalProgress}%</p>
                  <p className="text-sm text-muted-foreground">Progresso</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{user.coursesCompleted}</p>
                  <p className="text-sm text-muted-foreground">Cursos</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{user.certificatesEarned}</p>
                  <p className="text-sm text-muted-foreground">Certificados</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{progressRows.length}</p>
                  <p className="text-sm text-muted-foreground">Cursos Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Situacao</span>
                <StatusBadge status={user.status === 'Ativo' ? 'active' : 'inactive'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Última atividade</span>
                <span>{new Date(user.lastActivity).toLocaleDateString('pt-MZ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Codigo</span>
                <Badge variant="secondary" className="font-mono">{user.anonymousCode}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Papel</span>
                <span>{user.role ?? 'VICTIM'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Progresso por Curso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progressRows.length === 0 ? (
              <p className="text-muted-foreground">Sem progresso registrado.</p>
            ) : (
              <div className="space-y-3">
                {progressRows.map(item => (
                  <div key={`${item.courseId}-${item.lastActivity}`} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{item.courseTitle}</h4>
                      <span className="font-semibold">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mb-2">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${item.percentage}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Modulo atual: {item.currentModule}</span>
                      <span>{new Date(item.lastActivity).toLocaleDateString('pt-MZ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {certificateRows.length === 0 ? (
              <p className="text-muted-foreground">Nenhum certificado emitido.</p>
            ) : (
              <div className="space-y-3">
                {certificateRows.map(certificate => (
                  <div key={certificate.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{certificate.courseTitle}</p>
                        <p className="text-sm text-muted-foreground">Codigo: {certificate.code}</p>
                      </div>
                      <Badge>{certificate.score}%</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(certificate.issueDate).toLocaleDateString('pt-MZ')}</span>
                      <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Resultado validado</span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={verifyingCode === certificate.code}
                        onClick={() => {
                          void handleVerifyCertificate(certificate.code)
                        }}
                      >
                        {verifyingCode === certificate.code ? 'Validando...' : 'Verificar'}
                      </Button>
                      {verificationFeedback[certificate.code] ? (
                        <span className="text-xs text-muted-foreground">{verificationFeedback[certificate.code]}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
