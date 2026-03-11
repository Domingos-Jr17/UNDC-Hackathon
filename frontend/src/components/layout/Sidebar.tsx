import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  UserCheck,
  Users,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  description: string
  group: 'core' | 'support'
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    description: 'Visão operacional e prioridades do dia.',
    group: 'core'
  },
  {
    id: 'users',
    label: 'Beneficiárias',
    icon: Users,
    path: '/users',
    description: 'Pesquisar, acompanhar e revisar perfis.',
    group: 'core'
  },
  {
    id: 'active',
    label: 'Nova ativação',
    icon: UserCheck,
    path: '/active',
    description: 'Activar beneficiárias e distribuir códigos.',
    group: 'core'
  },
  {
    id: 'courses',
    label: 'Cursos',
    icon: BookOpen,
    path: '/courses',
    description: 'Gerenciar o catálogo de cursos.',
    group: 'core'
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: FileText,
    path: '/reports',
    description: 'Exportações e indicadores institucionais.',
    group: 'support'
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    path: '/settings',
    description: 'Preferências da equipa e da plataforma.',
    group: 'support'
  }
]

interface SidebarProps {
  className?: string
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

export default function Sidebar({
  className,
  mobileOpen = false,
  onMobileOpenChange
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()

  useEffect(() => {
    onMobileOpenChange?.(false)
  }, [location.pathname, onMobileOpenChange])

  const groupedItems = useMemo(() => ({
    core: sidebarItems.filter(item => item.group === 'core'),
    support: sidebarItems.filter(item => item.group === 'support')
  }), [])

  const renderItems = (items: SidebarItem[]) => (
    items.map((item) => {
      const Icon = item.icon
      const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)

      return (
        <NavLink
          key={item.id}
          to={item.path}
          className={cn(
            'group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm transition-all duration-200',
            active
              ? 'border-primary/15 bg-primary text-primary-foreground shadow-lg shadow-primary/15'
              : 'text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900'
          )}
          title={isCollapsed ? item.label : item.description}
        >
          <div
            className={cn(
              'mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl',
              active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
            )}
          >
            <Icon className="h-4 w-4" />
          </div>

          {!isCollapsed ? (
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{item.label}</div>
              <div className={cn('mt-1 text-xs', active ? 'text-white/80' : 'text-slate-500')}>
                {item.description}
              </div>
            </div>
          ) : null}
        </NavLink>
      )
    })
  )

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => onMobileOpenChange?.(false)}
          aria-label="Fechar menu lateral"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[310px] max-w-[88vw] flex-col border-r border-white/60 bg-[#f7fbff]/95 backdrop-blur-xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'lg:w-24' : 'lg:w-80',
          className
        )}
      >
        <div className="border-b border-slate-200/80 px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-primary/15 ring-1 ring-slate-200">
                <img src="/esperanc.ico" alt="WIRA" className="h-8 w-8 object-contain" />
              </div>
              {!isCollapsed ? (
                <div>
                 
                  <h2 className="text-lg font-semibold text-slate-950">Portal Operacional</h2>
                  <p className="text-xs text-muted-foreground">Acompanhe ativações, risco e progresso.</p>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex"
                onClick={() => setIsCollapsed(prev => !prev)}
                aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => onMobileOpenChange?.(false)}
                aria-label="Fechar menu lateral"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <nav className="space-y-2">{renderItems(groupedItems.core)}</nav>

          <div className="mt-6 border-t border-slate-200/80 pt-5">
            <nav className="space-y-2">{renderItems(groupedItems.support)}</nav>
          </div>
        </div>
      </aside>
    </>
  )
}
