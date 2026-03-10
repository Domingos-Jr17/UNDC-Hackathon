import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type StatusType =
  | 'active'
  | 'inactive'
  | 'draft'
  | 'pending'
  | 'completed'
  | 'in-progress'
  | 'failed'
  | 'success'
  | 'warning'
  | 'info'

interface StatusBadgeProps {
  status: StatusType
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const statusConfig = {
  active: {
    label: 'Activo',
    className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
    variant: 'secondary' as const
  },
  inactive: {
    label: 'Inactivo',
    className: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    variant: 'secondary' as const
  },
  pending: {
    label: 'Pendente',
    className: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    variant: 'secondary' as const
  },
  completed: {
    label: 'Concluído',
    className: 'bg-sky-100 text-sky-800 hover:bg-sky-200',
    variant: 'secondary' as const
  },
  draft: {
    label: 'Rascunho',
    className: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    variant: 'secondary' as const
  },
  'in-progress': {
    label: 'Em progresso',
    className: 'bg-violet-100 text-violet-800 hover:bg-violet-200',
    variant: 'secondary' as const
  },
  failed: {
    label: 'Falhou',
    className: 'bg-rose-100 text-rose-800 hover:bg-rose-200',
    variant: 'destructive' as const
  },
  success: {
    label: 'Sucesso',
    className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
    variant: 'secondary' as const
  },
  warning: {
    label: 'Atenção',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    variant: 'secondary' as const
  },
  info: {
    label: 'Informação',
    className: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
    variant: 'secondary' as const
  }
}

export default function StatusBadge({
  status,
  children,
  className,
  variant
}: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending
  const displayText = children || config.label

  return (
    <Badge
      variant={variant || config.variant}
      className={cn(config.className, className)}
    >
      {displayText}
    </Badge>
  )
}

export function getUserProgressStatus(percentage: number): StatusType {
  if (percentage === 0) return 'inactive'
  if (percentage > 0 && percentage < 100) return 'in-progress'
  if (percentage === 100) return 'completed'
  return 'pending'
}

export function getCourseEnrollmentStatus(isActive: boolean, progress: number): StatusType {
  if (!isActive) return 'inactive'
  if (progress === 0) return 'pending'
  if (progress > 0 && progress < 100) return 'in-progress'
  return 'completed'
}
