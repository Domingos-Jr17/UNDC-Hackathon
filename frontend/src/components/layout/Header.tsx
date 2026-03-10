import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  FileText,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User,
  UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthContext } from '@/contexts/AuthContext'
import { announceToScreenReader } from '@/lib/accessibility'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick?: () => void
  className?: string
}

export default function Header({ onMenuClick, className }: HeaderProps) {
  const { user, logout } = useAuthContext()
  const navigate = useNavigate()

  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date()),
    []
  )

  const handleLogout = () => {
    logout()
    announceToScreenReader('Sessão terminada com sucesso')
    navigate('/')
  }

  const userInitials = user?.anonymousCode
    ? user.anonymousCode.slice(0, 2).toUpperCase()
    : 'ST'

  return (
    <header className={cn('sticky top-0 z-30 border-b border-white/70 bg-[#f7fbff]/85 backdrop-blur-xl', className)}>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Abrir menu lateral"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary md:flex">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">Coordenação WIRA</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="capitalize">{dateLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/reports')}>
            <FileText className="h-4 w-4" />
            Relatórios
          </Button>
          <Button size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/active')}>
            <UserPlus className="h-4 w-4" />
            Nova ativação
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-slate-200 bg-white shadow-sm">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.anonymousCode || 'STAFF'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.role || 'STAFF'}</p>
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
  )
}
