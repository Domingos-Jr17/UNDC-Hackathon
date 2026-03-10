import { BarChart3, BookOpen, FileText, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
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
  }

  const config = sizeConfig[size]

  return (
    <Card className={cn('rounded-3xl border border-dashed border-slate-300/90 bg-white/85 p-3 shadow-sm', className)}>
      <CardHeader className={cn('flex flex-col items-center text-center', config.spacing)}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Icon className={cn(config.icon)} />
        </div>
        <CardTitle className={cn(config.title)}>{title}</CardTitle>
        {description ? (
          <CardDescription className={cn('max-w-md', config.description)}>{description}</CardDescription>
        ) : null}
      </CardHeader>
      {action ? (
        <CardContent className="flex justify-center pt-0">
          <Button variant={action.variant || 'default'} onClick={action.onClick} className="min-w-[160px]">
            {action.label}
          </Button>
        </CardContent>
      ) : null}
    </Card>
  )
}

export const EmptyUsers = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    icon={Users}
    title="Nenhuma beneficiária encontrada"
    description="A lista será preenchida assim que novas ativações forem concluídas ou quando filtros mais amplos forem aplicados."
    action={onAdd ? {
      label: 'Iniciar ativação',
      onClick: onAdd,
      variant: 'default'
    } : undefined}
  />
)

export const EmptyCourses = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    icon={BookOpen}
    title="Nenhum curso disponível"
    description="Adicione cursos profissionais para que a equipa possa orientar novas jornadas de capacitação."
    action={onAdd ? {
      label: 'Adicionar curso',
      onClick: onAdd,
      variant: 'default'
    } : undefined}
  />
)

export const EmptyReports = ({ onGenerate }: { onGenerate?: () => void }) => (
  <EmptyState
    icon={FileText}
    title="Nenhum relatório gerado"
    description="Use filtros rápidos para preparar exportações e compartilhar indicadores com parceiros institucionais."
    action={onGenerate ? {
      label: 'Gerar relatório',
      onClick: onGenerate,
      variant: 'default'
    } : undefined}
  />
)

export const EmptySearch = ({ query, onClear }: { query: string; onClear: () => void }) => (
  <EmptyState
    icon={Search}
    title={`Nenhum resultado para "${query}"`}
    description="Ajuste a busca ou limpe filtros para voltar aos registros disponíveis."
    action={{
      label: 'Limpar busca',
      onClick: onClear,
      variant: 'outline'
    }}
    size="sm"
  />
)

export const EmptyProgress = ({ onStart }: { onStart?: () => void }) => (
  <EmptyState
    icon={BarChart3}
    title="Sem dados de progresso"
    description="Assim que as beneficiárias iniciarem cursos, esta área exibirá evolução e riscos de abandono."
    action={onStart ? {
      label: 'Começar monitorização',
      onClick: onStart,
      variant: 'default'
    } : undefined}
  />
)
