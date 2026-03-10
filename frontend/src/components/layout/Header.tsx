import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { announceToScreenReader } from '@/lib/accessibility';

interface HeaderProps {
  onMenuClick?: () => void;
  className?: string;
}

export default function Header({ onMenuClick, className }: HeaderProps) {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      announceToScreenReader('Sessão terminada com sucesso');
      navigate('/');
    } catch (error) {
      announceToScreenReader('Erro ao terminar sessão');
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    announceToScreenReader(`Modo ${!isDarkMode ? 'escuro' : 'claro'} activado`);
  };

  const userInitials = user?.anonymousCode
    ? user.anonymousCode.slice(0, 2).toUpperCase()
    : 'ST';

  return (
    <header className={`sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <div className="container flex h-16 items-center gap-4 px-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden flex-shrink-0"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* WIRA Branding */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <img
            src="/logo.png"
            alt="WIRA Platform Logo"
            className="h-8 w-auto hidden sm:block"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/esperan.ico";
            }}
          />
          <img
            src="/esperan.ico"
            alt="WIRA Platform Logo"
            className="h-8 w-8 sm:hidden"
          />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground">WIRA Platform</h1>
            <p className="text-xs text-muted-foreground">Women's Integrated Reintegration Academy</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar usuários, cursos, relatórios..."
              className="pl-10"
              aria-label="Buscar na plataforma"
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Dark mode toggle - Hidden on smallest screens */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex"
            onClick={toggleDarkMode}
            aria-label="Alternar modo escuro"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs">
                  3
                </Badge>
                <span className="sr-only">Notificações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                <DropdownMenuItem className="flex flex-col items-start p-3">
                  <div className="flex w-full items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Novo usuário registado</p>
                      <p className="text-xs text-muted-foreground">
                        Beneficiária V0050 aguarda activação
                      </p>
                      <p className="text-xs text-muted-foreground">Há 5 minutos</p>
                    </div>
                    <Badge variant="secondary" className="ml-2">Novo</Badge>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Progresso atualizado</p>
                    <p className="text-xs text-muted-foreground">
                      Beneficiária V0048 completou módulo de Costura
                    </p>
                    <p className="text-xs text-muted-foreground">Há 1 hora</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Relatório disponível</p>
                    <p className="text-xs text-muted-foreground">
                      Relatório mensal de Outubro pronto para visualização
                    </p>
                    <p className="text-xs text-muted-foreground">Há 2 horas</p>
                  </div>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center">
                Ver todas as notificações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Help - Hidden on smallest screens */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex"
            aria-label="Ajuda"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.anonymousCode || 'STAFF'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.role || 'STAFF'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}



