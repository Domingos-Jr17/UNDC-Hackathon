import { useNavigate } from 'react-router-dom'
import {
  FileText,
  LogOut,
  Menu,
  Settings,
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
import Breadcrumbs from './Breadcrumbs'

interface HeaderProps {
  onMenuClick?: () => void
  className?: string
  showBreadcrumbs?: boolean
}

export default function Header({ onMenuClick, className, showBreadcrumbs = true }: HeaderProps) {
  const { user, logout } = useAuthContext()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    announceToScreenReader('Sessão terminada com sucesso')
    navigate('/')
  }

  const userInitials = user?.anonymousCode
    ? user.anonymousCode.slice(0, 2).toUpperCase()
    : 'ST'

  return (
    <header className={cn('sticky top-0 z-30 border-b border-white/70 bg-[#f7fbff]/92 backdrop-blur-xl', className)}>
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:px-6 lg:px-8">
        <div className="flex min-h-10 items-center justify-between gap-4">
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
            {showBreadcrumbs ? <Breadcrumbs className="hidden lg:flex" /> : null}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/reports')}>
              <FileText className="h-4 w-4" />
              Relatórios
            </Button>
            <Button size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/active')}>
              <UserPlus className="h-4 w-4" />
              Nova activação
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

        {/* {showBreadcrumbs ? (
          <div className="border-t border-slate-200/70 pt-3">
            <Breadcrumbs className="lg:hidden" />
          </div>
        ) : null} */}
      </div>
    </header>
  )
}
