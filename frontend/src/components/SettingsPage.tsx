import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from './layout/Layout';
import { User, Shield, Bell, Key, Save, Upload, Camera } from 'lucide-react';

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  location: string;
}

interface SecurityFormData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: 'Admin Staff',
    email: 'admin@wira.org',
    phone: '+258 84 123 4567',
    location: 'Maputo, Moçambique'
  });
  
  const [securityData, setSecurityData] = useState<SecurityFormData>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Perfil atualizado:', profileData);
    // Aqui normalmente faríamos uma chamada à API para atualizar o perfil
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmNewPassword) {
      alert('As novas palavras-passe não coincidem');
      return;
    }
    console.log('Palavra-passe atualizada:', securityData);
    // Aqui normalmente faríamos uma chamada à API para atualizar a palavra-passe
  };

  return (
    <Layout title="Configurações" subtitle="Gerencie suas configurações da conta">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96 gap-8">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notificações
            </TabsTrigger>
          </TabsList>

          {/* Tab de Perfil */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <Button size="sm" variant="outline" className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0">
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <Label>Imagem de Perfil</Label>
                      <p className="text-sm text-muted-foreground">JPG, GIF ou PNG. Tamanho máximo de 5MB</p>
                      <Button size="sm" variant="outline" className="mt-2">
                        <Upload className="mr-2 h-4 w-4" />
                        Carregar Imagem
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Localização</Label>
                      <Input
                        id="location"
                        name="location"
                        value={profileData.location}
                        onChange={handleProfileChange}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="hover:shadow-md transition-shadow duration-200">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Segurança */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Segurança da Conta</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSecuritySubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Palavra-passe atual</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={securityData.currentPassword}
                        onChange={handleSecurityChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nova palavra-passe</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={securityData.newPassword}
                        onChange={handleSecurityChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword">Confirmar nova palavra-passe</Label>
                      <Input
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        type="password"
                        value={securityData.confirmNewPassword}
                        onChange={handleSecurityChange}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="hover:shadow-md transition-shadow duration-200">
                    <Key className="mr-2 h-4 w-4" />
                    Atualizar palavra-passe
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="font-medium">Login bem-sucedido</p>
                      <p className="text-sm text-muted-foreground">Hoje às 08:45 via navegador</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Recente</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="font-medium">Alteração de palavra-passe</p>
                      <p className="text-sm text-muted-foreground">15/10/2025 às 14:20</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Segurança</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Notificações */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-normal">Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">Receber atualizações de cursos e progresso</p>
                    </div>
                    <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground">Activado</Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-normal">Notificações Push</Label>
                      <p className="text-sm text-muted-foreground">Receber notificações no navegador</p>
                    </div>
                    <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground">Activado</Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-normal">SMS de Lembretes</Label>
                      <p className="text-sm text-muted-foreground">Receber lembretes por SMS</p>
                    </div>
                    <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground">Desactivado</Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-normal">Notificações de Segurança</Label>
                      <p className="text-sm text-muted-foreground">Alertas de login e atividades suspeitas</p>
                    </div>
                    <Button variant="outline" size="sm">Activado</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Notificações de Curso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-normal">Conclusão de Módulo</Label>
                      <p className="text-sm text-muted-foreground">Quando você completa um módulo</p>
                    </div>
                    <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground">Activado</Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-normal">Novos Cursos</Label>
                      <p className="text-sm text-muted-foreground">Quando novos cursos são adicionados</p>
                    </div>
                    <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground">Activado</Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-normal">Certificados</Label>
                      <p className="text-sm text-muted-foreground">Quando você ganha um certificado</p>
                    </div>
                    <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground">Activado</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

