import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

const routeMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/active': 'Activar Usuários',
  '/monitor': 'Monitorar Progresso',
  '/users': 'Usuários',
  '/users/[id]': 'Detalhes do Usuário',
  '/courses': 'Cursos',
  '/courses/create': 'Criar Curso',
  '/courses/[id]': 'Detalhes do Curso',
  '/reports': 'Relatórios',
  '/reports/progress': 'Relatório de Progresso',
  '/reports/courses': 'Relatório de Cursos',
  '/reports/ngos': 'Relatório de ONGs',
  '/settings': 'Configurações',
  '/settings/profile': 'Perfil',
  '/settings/ngos': 'ONGs Parceiras',
};

export default function Breadcrumbs({
  items,
  className,
  showHome = true
}: BreadcrumbsProps) {
  const location = useLocation();

  // Generate breadcrumbs from current route if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Handle dynamic routes like [id]
      const isDynamic = segment.startsWith('[') && segment.endsWith(']');
      const routeKey = isDynamic
        ? currentPath.replace(/\/\w+$/, '/[id]')
        : currentPath;

      const label = routeMap[routeKey] || segment.charAt(0).toUpperCase() + segment.slice(1);

      breadcrumbs.push({
        label,
        path: isDynamic ? undefined : currentPath,
        icon: index === 0 && !showHome ? Home : undefined
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = generateBreadcrumbs();

  if (breadcrumbItems.length === 0) return null;

  return (
    <nav
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
      aria-label="Navegação estrutural"
    >
      {showHome && (
        <>
          <Link
            to="/dashboard"
            className="flex items-center hover:text-foreground transition-colors"
            aria-label="Página inicial"
          >
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbItems.length > 0 && (
            <ChevronRight className="h-4 w-4" />
          )}
        </>
      )}

      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        const Icon = item.icon;

        return (
          <React.Fragment key={index}>
            <div className="flex items-center">
              {Icon && <Icon className="h-4 w-4 mr-1" />}
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
                    "font-medium",
                    isLast ? "text-foreground" : "text-muted-foreground"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </div>
            {!isLast && (
              <ChevronRight className="h-4 w-4 mx-1" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

