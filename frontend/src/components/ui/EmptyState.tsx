import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = 'md'
}: EmptyStateProps) {
  const sizeConfig = {
    sm: {
      icon: 'h-8 w-8',
      title: 'text-lg',
      description: 'text-sm',
      spacing: 'space-y-2'
    },
    md: {
      icon: 'h-12 w-12',
      title: 'text-xl',
      description: 'text-base',
      spacing: 'space-y-3'
    },
    lg: {
      icon: 'h-16 w-16',
      title: 'text-2xl',
      description: 'text-lg',
      spacing: 'space-y-4'
    }
  };

  const config = sizeConfig[size];

  return (
    <Card className={cn("flex flex-col items-center justify-center text-center p-8", className)}>
      <CardHeader className={cn("flex flex-col items-center", config.spacing)}>
        <Icon className={cn("text-muted-foreground", config.icon)} />
        <CardTitle className={cn(config.title)}>{title}</CardTitle>
        {description && (
          <CardDescription className={cn(config.description)}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      {action && (
        <CardContent>
          <Button
            variant={action.variant || 'default'}
            onClick={action.onClick}
            className="min-w-[140px]"
          >
            {action.label}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// User icon component
const UsersIcon = ({ className }: { className?: string }) => (
  <div className={`flex items-center justify-center h-12 w-12 rounded-full bg-muted ${className}`}>
    <span className="text-2xl">👥</span>
  </div>
);

// Predefined empty states for common use cases
export const EmptyUsers = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    icon={UsersIcon}
    title="Nenhum usuário encontrado"
    description="Comece adicionando um novo usuário à plataforma."
    action={onAdd ? {
      label: 'Adicionar Usuário',
      onClick: onAdd,
      variant: 'default'
    } : undefined}
  />
);

// Courses icon component
const CoursesIcon = ({ className }: { className?: string }) => (
  <div className={`flex items-center justify-center h-12 w-12 rounded-full bg-muted ${className}`}>
    <span className="text-2xl">📚</span>
  </div>
);

export const EmptyCourses = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    icon={CoursesIcon}
    title="Nenhum curso disponível"
    description="Adicione cursos profissionais para ajudar as sobreviventes."
    action={onAdd ? {
      label: 'Adicionar Curso',
      onClick: onAdd,
      variant: 'default'
    } : undefined}
  />
);

// Reports icon component
const ReportsIcon = ({ className }: { className?: string }) => (
  <div className={`flex items-center justify-center h-12 w-12 rounded-full bg-muted ${className}`}>
    <span className="text-2xl">📊</span>
  </div>
);

export const EmptyReports = ({ onGenerate }: { onGenerate?: () => void }) => (
  <EmptyState
    icon={ReportsIcon}
    title="Nenhum relatório gerado"
    description="Gere relatórios para analisar o progresso e impacto da plataforma."
    action={onGenerate ? {
      label: 'Gerar Relatório',
      onClick: onGenerate,
      variant: 'default'
    } : undefined}
  />
);

// Search icon component
const SearchIcon = ({ className }: { className?: string }) => (
  <div className={`flex items-center justify-center h-12 w-12 rounded-full bg-muted ${className}`}>
    <span className="text-2xl">🔍</span>
  </div>
);

export const EmptySearch = ({ query, onClear }: { query: string; onClear: () => void }) => (
  <EmptyState
    icon={SearchIcon}
    title={`Nenhum resultado para "${query}"`}
    description="Tente ajustar sua busca ou limpar os filtros."
    action={{
      label: 'Limpar Busca',
      onClick: onClear,
      variant: 'outline'
    }}
    size="sm"
  />
);

// Progress icon component
const ProgressIcon = ({ className }: { className?: string }) => (
  <div className={`flex items-center justify-center h-12 w-12 rounded-full bg-muted ${className}`}>
    <span className="text-2xl">📈</span>
  </div>
);

export const EmptyProgress = ({ onStart }: { onStart?: () => void }) => (
  <EmptyState
    icon={ProgressIcon}
    title="Acompanhamento de Progresso"
    description="Monitore o progresso dos usuários nos cursos disponíveis."
    action={onStart ? {
      label: 'Começar Monitoramento',
      onClick: onStart,
      variant: 'default'
    } : undefined}
  />
);

