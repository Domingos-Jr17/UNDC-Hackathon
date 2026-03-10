import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  path?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

const resolveLabel = (pathname: string, segment: string): string => {
  if (pathname === '/dashboard') return 'Dashboard'
  if (pathname === '/active') return 'Nova ativacao'
  if (pathname === '/users') return 'Beneficiarias'
  if (/^\/users\/[^/]+$/.test(pathname)) return 'Detalhe da beneficiaria'
  if (pathname === '/courses') return 'Cursos'
  if (pathname === '/courses/create') return 'Criar curso'
  if (/^\/courses\/[^/]+$/.test(pathname)) return 'Detalhe do curso'
  if (pathname === '/reports') return 'Relatorios'
  if (pathname === '/settings') return 'Configuracoes'
  if (pathname === '/settings/profile') return 'Perfil'
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

export default function Breadcrumbs({
  items,
  className,
  showHome = true
}: BreadcrumbsProps) {
  const location = useLocation()

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items

    const segments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []
    let currentPath = ''

    segments.forEach((segment) => {
      currentPath += `/${segment}`
      const isDynamic = /^\/users\/[^/]+$/.test(currentPath) || /^\/courses\/[^/]+$/.test(currentPath)

      breadcrumbs.push({
        label: resolveLabel(currentPath, segment),
        path: isDynamic ? undefined : currentPath
      })
    })

    return breadcrumbs
  }

  const breadcrumbItems = generateBreadcrumbs()

  if (breadcrumbItems.length === 0) return null

  return (
    <nav
      className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}
      aria-label="Navegacao estrutural"
    >
      {showHome ? (
        <>
          <Link
            to="/dashboard"
            className="flex items-center hover:text-foreground transition-colors"
            aria-label="Pagina inicial"
          >
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
        </>
      ) : null}

      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1
        const Icon = item.icon

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            <div className="flex items-center">
              {Icon ? <Icon className="mr-1 h-4 w-4" /> : null}
              {item.path && !isLast ? (
                <Link
                  to={item.path}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'font-medium',
                    isLast ? 'text-foreground' : 'text-muted-foreground'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </div>
            {!isLast ? <ChevronRight className="mx-1 h-4 w-4" /> : null}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
