import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import Layout from './layout/Layout'
import { Bell, KeyRound, LogOut, RefreshCcw, Save, ShieldCheck, User } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useApiHealth } from '@/hooks/useApi'

interface ProfileFormData {
  displayName: string
  contactEmail: string
  phone: string
  location: string
}

interface NotificationSettings {
  emailUpdates: boolean
  securityAlerts: boolean
  weeklyDigest: boolean
  reportReady: boolean
}

interface SettingsAuditItem {
  id: string
  label: string
  detail: string
  timestamp: string
}

interface StoredPortalSettings {
  profile: ProfileFormData
  notifications: NotificationSettings
  audit: SettingsAuditItem[]
}

const buildStorageKey = (staffCode: string) => `wira_staff_preferences_${staffCode}`

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

const createInitialSettings = (staffCode: string, ngoId?: string): StoredPortalSettings => ({
  profile: {
    displayName: staffCode,
    contactEmail: '',
    phone: '',
    location: ngoId ?? ''
  },
  notifications: {
    emailUpdates: true,
    securityAlerts: true,
    weeklyDigest: false,
    reportReady: true
  },
  audit: [
    {
      id: 'initial-session',
      label: 'Sessão reconhecida',
      detail: 'Preferências carregadas para este dispositivo.',
      timestamp: new Date().toISOString()
    }
  ]
})

export default function SettingsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()
  const { isHealthy, lastCheck, checkHealth } = useApiHealth()

  const initialTab = location.pathname === '/settings/profile' ? 'profile' : 'access'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [profileData, setProfileData] = useState<ProfileFormData>({
    displayName: '',
    contactEmail: '',
    phone: '',
    location: ''
  })
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailUpdates: true,
    securityAlerts: true,
    weeklyDigest: false,
    reportReady: true
  })
  const [auditTrail, setAuditTrail] = useState<SettingsAuditItem[]>([])

  const storageKey = useMemo(() => buildStorageKey(user?.anonymousCode ?? 'staff'), [user?.anonymousCode])

  useEffect(() => {
    const fallback = createInitialSettings(user?.anonymousCode ?? 'STAFF', user?.ngoId)
    const stored = localStorage.getItem(storageKey)

    if (!stored) {
      setProfileData(fallback.profile)
      setNotifications(fallback.notifications)
      setAuditTrail(fallback.audit)
      return
    }

    try {
      const parsed = JSON.parse(stored) as StoredPortalSettings
      setProfileData(parsed.profile)
      setNotifications(parsed.notifications)
      setAuditTrail(parsed.audit)
    } catch {
      setProfileData(fallback.profile)
      setNotifications(fallback.notifications)
      setAuditTrail(fallback.audit)
    }
  }, [storageKey, user?.anonymousCode, user?.ngoId])

  const persistSettings = (next: StoredPortalSettings) => {
    localStorage.setItem(storageKey, JSON.stringify(next))
    setProfileData(next.profile)
    setNotifications(next.notifications)
    setAuditTrail(next.audit)
  }

  const appendAudit = (label: string, detail: string): SettingsAuditItem => ({
    id: `${Date.now()}-${label}`,
    label,
    detail,
    timestamp: new Date().toISOString()
  })

  const handleProfileChange = (field: keyof ProfileFormData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleProfileSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const nextAudit = appendAudit('Perfil atualizado', 'Dados de contacto e identificação local do portal foram revistos.')
    const nextState = {
      profile: profileData,
      notifications,
      audit: [nextAudit, ...auditTrail].slice(0, 6)
    }
    persistSettings(nextState)
    toast.success('Perfil do portal atualizado.')
  }

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    const nextNotifications = { ...notifications, [key]: !notifications[key] }
    const nextAudit = appendAudit(
      'Preferências atualizadas',
      `A definição "${notificationLabels[key]}" foi ${nextNotifications[key] ? 'ativada' : 'desativada'}.`
    )
    persistSettings({
      profile: profileData,
      notifications: nextNotifications,
      audit: [nextAudit, ...auditTrail].slice(0, 6)
    })
    toast.success('Preferências guardadas neste dispositivo.')
  }

  const handleLogout = () => {
    const nextAudit = appendAudit('Sessão encerrada', 'A sessão local foi terminada a partir das configurações.')
    persistSettings({
      profile: profileData,
      notifications,
      audit: [nextAudit, ...auditTrail].slice(0, 6)
    })
    logout()
    navigate('/')
  }

  const refreshApiStatus = async () => {
    await checkHealth()
    toast.info('Estado da API atualizado.')
  }

  const apiStatusLabel = isHealthy === null ? 'A verificar' : isHealthy ? 'Online' : 'Indisponível'
  const apiStatusTone = isHealthy === null ? 'outline' : isHealthy ? 'default' : 'destructive'

  return (
    <Layout title="Configurações" subtitle="Ajuste preferências do portal, verifique o estado de acesso e mantenha o ambiente operacional consistente.">
      <div className="space-y-6">
        <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-950">Sessão ativa</p>
              <p className="text-sm text-muted-foreground">
                {user?.anonymousCode ?? 'STAFF'} · {user?.role ?? 'STAFF'} · {user?.ngoId ?? 'Sem ONG associada'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={apiStatusTone}>{`API ${apiStatusLabel}`}</Badge>
              {lastCheck ? <Badge variant="outline">{`Última verificação ${formatDateTime(lastCheck.toISOString())}`}</Badge> : null}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 gap-2 lg:w-[420px]">
            <TabsTrigger value="profile" onClick={() => navigate('/settings/profile')}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="access" onClick={() => navigate('/settings')}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Acesso
            </TabsTrigger>
            <TabsTrigger value="notifications" onClick={() => navigate('/settings')}>
              <Bell className="mr-2 h-4 w-4" />
              Alertas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Perfil operacional</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nome de exibição</Label>
                    <Input
                      id="displayName"
                      value={profileData.displayName}
                      onChange={event => handleProfileChange('displayName', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email de contacto</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="equipa@wira.org"
                      value={profileData.contactEmail}
                      onChange={event => handleProfileChange('contactEmail', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="+258 84 000 0000"
                      value={profileData.phone}
                      onChange={event => handleProfileChange('phone', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Localização</Label>
                    <Input
                      id="location"
                      placeholder="Maputo"
                      value={profileData.location}
                      onChange={event => handleProfileChange('location', event.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      Guardar perfil
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access">
            <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
              <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Estado de acesso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-medium text-slate-950">Código da sessão</p>
                    <p className="mt-1 font-mono text-slate-700">{user?.anonymousCode ?? 'STAFF'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-medium text-slate-950">Papel</p>
                    <p className="mt-1 text-slate-700">{user?.role ?? 'STAFF'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-medium text-slate-950">Ligação à API</p>
                    <p className="mt-1 text-slate-700">{apiStatusLabel}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" className="w-full" onClick={() => void refreshApiStatus()}>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Verificar ligação
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Terminar sessão
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    Histórico recente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {auditTrail.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem eventos de configuração registados neste dispositivo.</p>
                  ) : (
                    auditTrail.map(item => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-slate-950">{item.label}</p>
                          <span className="text-xs text-muted-foreground">{formatDateTime(item.timestamp)}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="rounded-[32px] border-white/70 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Alertas e preferências locais</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {(Object.keys(notificationLabels) as Array<keyof NotificationSettings>).map(key => (
                  <div key={key} className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{notificationLabels[key]}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{notificationDescriptions[key]}</p>
                      </div>
                      <Badge variant={notifications[key] ? 'default' : 'outline'}>
                        {notifications[key] ? 'Ativo' : 'Desativo'}
                      </Badge>
                    </div>
                    <Button variant="outline" className="mt-4 w-full" onClick={() => handleNotificationToggle(key)}>
                      {notifications[key] ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

const notificationLabels: Record<keyof NotificationSettings, string> = {
  emailUpdates: 'Atualizações por email',
  securityAlerts: 'Alertas de segurança',
  weeklyDigest: 'Resumo semanal',
  reportReady: 'Exportações concluídas'
}

const notificationDescriptions: Record<keyof NotificationSettings, string> = {
  emailUpdates: 'Use quando quiser lembrar a equipa de novidades relevantes no portal.',
  securityAlerts: 'Mantém avisos importantes sobre acesso e falhas de autenticação.',
  weeklyDigest: 'Resume atividade operacional para revisão periódica.',
  reportReady: 'Informa quando uma exportação foi iniciada e concluída com sucesso.'
}
